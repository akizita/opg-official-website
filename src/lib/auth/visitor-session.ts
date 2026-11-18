import {
  extractUserAvatarUrl,
  extractUserDisplayName,
} from '@/lib/auth/user-avatars'
import { createClient } from '@/lib/supabase/server'

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
  const email = data?.claims?.email

  if (error || !id || typeof email !== 'string' || !email.trim()) return null

  const normalizedEmail = email.trim().toLowerCase()
  const claims = data?.claims as Record<string, unknown> | undefined
  const user = userResult?.data?.user ?? null

  return {
    avatarUrl: extractUserAvatarUrl(claims, user),
    displayName: extractUserDisplayName(claims, user),
    email: normalizedEmail,
    id,
  }
}
