import { extractUserAvatarUrl } from '@/lib/auth/avatar-utils'
import { createPrivilegedClient } from '@/lib/supabase/server'

export {
  extractUserAvatarUrl,
  extractUserDisplayName,
  sanitizeAvatarUrl,
} from '@/lib/auth/avatar-utils'

/**
 * Resolves registered Supabase Auth user profile photos (`avatar_url` / `picture`
 * from OAuth or saved user metadata) for a batch of email addresses.
 */
export async function resolveAuthAvatarsByEmail(
  emails: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const targets = new Set(
    emails
      .map((email) => email.trim().toLowerCase())
      .filter((email) => Boolean(email && email.includes('@'))),
  )
  if (targets.size === 0) return result

  const privilegedClient = createPrivilegedClient()
  if (!privilegedClient) return result

  try {
    const MAX_PAGES = 5
    for (let page = 1; page <= MAX_PAGES && result.size < targets.size; page++) {
      const { data, error } = await privilegedClient.auth.admin.listUsers({
        page,
        perPage: 200,
      })
      if (error || !data?.users?.length) break

      for (const authUser of data.users) {
        const userEmail = authUser.email?.trim().toLowerCase()
        if (!userEmail || !targets.has(userEmail)) continue

        const avatarUrl = extractUserAvatarUrl(undefined, authUser)
        if (avatarUrl) {
          result.set(userEmail, avatarUrl)
        }
      }

      if (data.users.length < 200) break
    }
  } catch {
    // Non-fatal fallback: caller continues with Gravatar / initials fallback.
  }

  return result
}
