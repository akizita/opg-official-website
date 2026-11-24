import {
  extractUserAvatarUrl,
  extractUserDisplayName,
} from '@/lib/auth/user-avatars'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export async function getVisitorSession() {
  const supabase = await createClient()
  const [claimsResult, userResult] = await Promise.all([
    supabase.auth.getClaims(),
    typeof supabase.auth.getUser === 'function'
      ? supabase.auth.getUser().catch(() => ({
          data: { user: null },
          error: null,
        }))
      : Promise.resolve({ data: { user: null }, error: null }),
  ])

  const { data, error } = claimsResult
  const id = data?.claims?.sub
  const user = userResult?.data?.user ?? null
  const rawEmail =
    typeof data?.claims?.email === 'string' && data.claims.email.trim()
      ? data.claims.email
      : user?.email

  if (error || !id || typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return null
  }

  const normalizedEmail = rawEmail.trim().toLowerCase()
  const claims = data?.claims as Record<string, unknown> | undefined
  let avatarUrl = extractUserAvatarUrl(claims, user)
  let displayName = extractUserDisplayName(claims, user)

  if (!avatarUrl || !displayName) {
    const privilegedClient = createPrivilegedClient()
    if (privilegedClient) {
      const adminUserRes = await privilegedClient.auth.admin
        .getUserById(id)
        .catch(() => null)
      if (adminUserRes?.data?.user) {
        if (!avatarUrl) {
          avatarUrl = extractUserAvatarUrl(undefined, adminUserRes.data.user)
        }
        if (!displayName) {
          displayName = extractUserDisplayName(
            undefined,
            adminUserRes.data.user,
          )
        }
      }
    }
  }

  return {
    avatarUrl,
    displayName,
    email: normalizedEmail,
    id,
  }
}
