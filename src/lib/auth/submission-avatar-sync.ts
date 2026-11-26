import { createClient } from '@supabase/supabase-js'

import { sanitizeAvatarUrl } from '@/lib/auth/avatar-utils'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!url || !secretKey) return null

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Updates Auth user_metadata directly with the service-role client when a
 * cookie-scoped updateUser() call fails or needs server persistence.
 */
export async function updateAuthUserMetadataPrivileged(
  userId: string,
  existingMetadata: Record<string, unknown> | null | undefined,
  patch: Record<string, string>,
): Promise<void> {
  if (!userId || Object.keys(patch).length === 0) return
  const client = createServiceClient()
  if (!client) return

  try {
    await client.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(existingMetadata ?? {}),
        ...patch,
      },
    })
  } catch {
    // Non-fatal fallback
  }
}

/**
 * Backfills null `avatar_url` values on historical contact inquiries and
 * candidate testimonials submitted by the same verified account email.
 */
export async function backfillSubmissionAvatar(
  email: string | null | undefined,
  rawAvatarUrl: string | null | undefined,
): Promise<void> {
  const cleanEmail = (email ?? '').trim().toLowerCase()
  const cleanAvatarUrl = sanitizeAvatarUrl(rawAvatarUrl)
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanAvatarUrl) return

  const client = createServiceClient()
  if (!client) return

  try {
    await Promise.all([
      client
        .from('contact_inquiries')
        .update({ avatar_url: cleanAvatarUrl })
        .eq('email', cleanEmail)
        .is('avatar_url', null),
      client
        .from('candidate_testimonials')
        .update({ avatar_url: cleanAvatarUrl })
        .eq('email', cleanEmail)
        .is('avatar_url', null),
    ])
  } catch {
    // Non-fatal if migrations are pending or DB is temporarily unreachable.
  }
}
