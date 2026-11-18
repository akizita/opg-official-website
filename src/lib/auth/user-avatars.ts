import {
  extractUserAvatarUrl,
  extractUserDisplayName,
} from '@/lib/auth/avatar-utils'
import { createPrivilegedClient } from '@/lib/supabase/server'

export {
  extractUserAvatarUrl,
  extractUserDisplayName,
  sanitizeAvatarUrl,
} from '@/lib/auth/avatar-utils'

export type ResolvedAuthProfile = {
  avatarUrl: string | null
  displayName: string | null
}

/**
 * Resolves registered Supabase Auth user profile photos (`avatar_url` / `picture`)
 * and display names for a batch of email addresses.
 */
export async function resolveAuthProfilesByEmail(
  emails: string[],
): Promise<Map<string, ResolvedAuthProfile>> {
  const result = new Map<string, ResolvedAuthProfile>()
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
        const displayName = extractUserDisplayName(undefined, authUser)
        if (avatarUrl || displayName) {
          result.set(userEmail, { avatarUrl, displayName })
        }
      }

      if (data.users.length < 200) break
    }
  } catch {
    // Non-fatal fallback: caller continues with Gravatar / initials fallback.
  }

  return result
}

/**
 * Resolves registered Supabase Auth user profile photos (`avatar_url` / `picture`
 * from OAuth or saved user metadata) for a batch of email addresses.
 */
export async function resolveAuthAvatarsByEmail(
  emails: string[],
): Promise<Map<string, string>> {
  const profiles = await resolveAuthProfilesByEmail(emails)
  const result = new Map<string, string>()

  for (const [email, profile] of profiles) {
    if (profile.avatarUrl) {
      result.set(email, profile.avatarUrl)
    }
  }

  return result
}
