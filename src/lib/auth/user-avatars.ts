import { createHash } from 'crypto'

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
  gravatarUrl: string | null
}

/**
 * Builds a deterministic SHA-256 Gravatar URL that returns HTTP 404 when no
 * custom Gravatar exists for the email address.
 */
export function buildGravatarUrl(
  email: string | null | undefined,
): string | null {
  const cleanEmail = (email ?? '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) return null
  const hash = createHash('sha256').update(cleanEmail).digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?s=96&d=404`
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

  for (const targetEmail of targets) {
    result.set(targetEmail, {
      avatarUrl: null,
      displayName: null,
      gravatarUrl: buildGravatarUrl(targetEmail),
    })
  }

  const privilegedClient = createPrivilegedClient()
  if (!privilegedClient) return result

  try {
    const MAX_PAGES = 5
    let matchedCount = 0
    for (let page = 1; page <= MAX_PAGES && matchedCount < targets.size; page++) {
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
        const existing = result.get(userEmail)
        if (avatarUrl || displayName) {
          result.set(userEmail, {
            avatarUrl,
            displayName,
            gravatarUrl: existing?.gravatarUrl ?? buildGravatarUrl(userEmail),
          })
          matchedCount += 1
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
