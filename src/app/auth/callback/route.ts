import { NextResponse, type NextRequest } from 'next/server'

import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'
import {
  extractUserAvatarUrl,
  extractUserDisplayName,
  sanitizeAvatarUrl,
} from '@/lib/auth/avatar-utils'
import { DESIGNATED_SUPER_ADMIN_EMAIL } from '@/lib/auth/config'
import { getSafeAdminPath, isPublicAuthPath } from '@/lib/auth/redirect'
import {
  backfillSubmissionAvatar,
  updateAuthUserMetadataPrivileged,
} from '@/lib/auth/submission-avatar-sync'
import { createClient } from '@/lib/supabase/server'

function isCustomUploadedAvatar(url: string | null): boolean {
  return Boolean(url && url.includes('/storage/v1/object/public/'))
}

async function fetchGoogleProfileFromToken(providerToken: string): Promise<{
  name: string | null
  picture: string | null
}> {
  let name: string | null = null
  let picture: string | null = null

  try {
    const response = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${providerToken}` },
        signal: AbortSignal.timeout(3_500),
      },
    )
    if (response.ok) {
      const profile = (await response.json()) as {
        name?: unknown
        picture?: unknown
      }
      picture = sanitizeAvatarUrl(profile.picture)
      if (typeof profile.name === 'string' && profile.name.trim()) {
        name = profile.name.trim()
      }
    }
  } catch {
    // Fall through to People API lookup if userinfo failed.
  }

  if (!picture) {
    try {
      const peopleResponse = await fetch(
        'https://people.googleapis.com/v1/people/me?personFields=photos,names',
        {
          headers: { Authorization: `Bearer ${providerToken}` },
          signal: AbortSignal.timeout(3_500),
        },
      )
      if (peopleResponse.ok) {
        const peopleData = (await peopleResponse.json()) as {
          names?: Array<{ displayName?: unknown }>
          photos?: Array<{ default?: boolean; url?: unknown }>
        }
        const customPhoto = peopleData.photos?.find(
          (entry) => !entry.default && sanitizeAvatarUrl(entry.url),
        )
        const anyPhoto = peopleData.photos?.find((entry) =>
          sanitizeAvatarUrl(entry.url),
        )
        picture = sanitizeAvatarUrl(customPhoto?.url ?? anyPhoto?.url)
        if (!name) {
          const displayName = peopleData.names?.find(
            (entry) =>
              typeof entry.displayName === 'string' && entry.displayName.trim(),
          )?.displayName
          if (typeof displayName === 'string') {
            name = displayName.trim()
          }
        }
      }
    } catch {
      // Optional Google People API fallback
    }
  }

  return { name, picture }
}

async function syncGoogleProfileMetadata(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exchangeData: unknown,
) {
  if (!exchangeData || typeof exchangeData !== 'object') return
  const session = (
    exchangeData as {
      session?: {
        provider_token?: string | null
        user?: {
          email?: string | null
          id?: string | null
          identities?: Array<{
            identity_data?: Record<string, unknown> | null
          }> | null
          user_metadata?: Record<string, unknown> | null
        } | null
      } | null
    }
  ).session
  if (!session?.user) return

  let userRecord = session.user
  if (
    (!Array.isArray(userRecord.identities) ||
      userRecord.identities.length === 0) &&
    typeof supabase.auth.getUser === 'function'
  ) {
    const liveUserRes = await supabase.auth.getUser().catch(() => null)
    if (liveUserRes?.data?.user) {
      userRecord = liveUserRes.data.user
    }
  }

  const currentAvatar = sanitizeAvatarUrl(userRecord.user_metadata?.avatar_url)
  const currentPicture = sanitizeAvatarUrl(userRecord.user_metadata?.picture)
  const currentName =
    typeof userRecord.user_metadata?.full_name === 'string' &&
    userRecord.user_metadata.full_name.trim()
      ? userRecord.user_metadata.full_name.trim()
      : null

  let freshPicture = extractUserAvatarUrl(undefined, {
    identities: userRecord.identities,
    user_metadata: null,
  })
  let freshName = extractUserDisplayName(undefined, {
    identities: userRecord.identities,
    user_metadata: null,
  })

  const providerToken = session.provider_token?.trim()
  if (providerToken) {
    const oidcProfile = await fetchGoogleProfileFromToken(providerToken)
    if (oidcProfile.picture) freshPicture = oidcProfile.picture
    if (oidcProfile.name) freshName = oidcProfile.name
  }

  const patch: Record<string, string> = {}
  const preserveCustomUpload = isCustomUploadedAvatar(currentAvatar)
  if (
    !preserveCustomUpload &&
    freshPicture &&
    (freshPicture !== currentAvatar || freshPicture !== currentPicture)
  ) {
    patch.avatar_url = freshPicture
    patch.picture = freshPicture
  }
  if (freshName && freshName !== currentName) {
    patch.full_name = freshName
  }

  if (Object.keys(patch).length > 0) {
    let updatedViaSession = false
    if (typeof supabase.auth.updateUser === 'function') {
      try {
        const res = await supabase.auth.updateUser({ data: patch })
        if (!res?.error) updatedViaSession = true
      } catch {
        updatedViaSession = false
      }
    }
    if (!updatedViaSession && userRecord.id) {
      await updateAuthUserMetadataPrivileged(
        userRecord.id,
        userRecord.user_metadata,
        patch,
      )
    }
  }

  const effectiveAvatar =
    (preserveCustomUpload ? currentAvatar : null) ??
    patch.avatar_url ??
    currentAvatar ??
    freshPicture
  if (userRecord.email && effectiveAvatar) {
    await backfillSubmissionAvatar(userRecord.email, effectiveAvatar)
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const error = requestUrl.searchParams.get('error')
  const publicFlow = isPublicAuthPath(next)

  if (error) {
    if (publicFlow) {
      return NextResponse.redirect(
        new URL('/sign-in?notice=oauth-error', requestUrl.origin),
      )
    }
    const errorCode = requestUrl.searchParams.get('error_code')
    const notice =
      errorCode === 'signup_disabled' ? 'signup-disabled' : 'oauth-error'
    return NextResponse.redirect(
      new URL(`/admin/sign-in?notice=${notice}`, requestUrl.origin),
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(
          publicFlow
            ? '/sign-in?notice=invalid-link'
            : '/admin/sign-in?notice=oauth-error',
          requestUrl.origin,
        ),
      )
    }

    await syncGoogleProfileMetadata(supabase, exchangeData)

    if (publicFlow) {
      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims()
      if (
        claimsError ||
        !claimsData?.claims?.sub ||
        typeof claimsData.claims.email !== 'string' ||
        !claimsData.claims.email.trim()
      ) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/sign-in?notice=invalid-link', requestUrl.origin),
        )
      }
      return NextResponse.redirect(new URL(next!, requestUrl.origin))
    }

    const session = await getAdminSession()

    if (!session) {
      const { data: claimsData } = await supabase.auth.getClaims()
      const email =
        typeof claimsData?.claims?.email === 'string'
          ? claimsData.claims.email.trim().toLowerCase()
          : ''
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(
          email === DESIGNATED_SUPER_ADMIN_EMAIL
            ? '/admin/sign-in?notice=super-admin-provisioning'
            : '/admin/sign-in?notice=unauthorized',
          requestUrl.origin,
        ),
      )
    }

    const destination =
      session.currentLevel === 'aal2'
        ? getSafeAdminPath(next, '/admin')
        : getAdminAuthDestination(session)

    return NextResponse.redirect(new URL(destination, requestUrl.origin))
  }

  return NextResponse.redirect(
    new URL('/admin/sign-in?notice=invalid-link', requestUrl.origin),
  )
}
