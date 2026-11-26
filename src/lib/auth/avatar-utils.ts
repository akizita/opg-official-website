type MetadataContainer = {
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null
  user_metadata?: Record<string, unknown> | null
}

const AVATAR_KEYS = [
  'avatar_url',
  'avatarUrl',
  'picture',
  'picture_url',
  'photo_url',
  'image',
  'profile_photo_url',
  'avatar',
] as const

const NAME_KEYS = ['full_name', 'name', 'display_name'] as const

const SAFE_DATA_IMAGE_PATTERN =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i

export function sanitizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (SAFE_DATA_IMAGE_PATTERN.test(trimmed)) return trimmed
  return null
}

export function deriveAvatarInitials(
  displayName?: string | null,
  email?: string | null,
): string {
  const cleanName = (displayName ?? '').trim()
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean)
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  const cleanEmail = (email ?? '').trim()
  if (cleanEmail) {
    const localParts = cleanEmail
      .split('@')[0]
      .split(/[._+-]+/)
      .filter(Boolean)
    if (localParts.length > 1) {
      return `${localParts[0][0]}${localParts[localParts.length - 1][0]}`.toUpperCase()
    }
    return (localParts[0] || '?').slice(0, 2).toUpperCase()
  }

  return '?'
}

function readMetadataValue(
  metadata: unknown,
  keys: readonly string[],
): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  const record = metadata as Record<string, unknown>
  for (const key of keys) {
    const val = record[key]
    if (typeof val === 'string' && val.trim()) {
      return val.trim()
    }
  }
  return null
}

export function extractUserAvatarUrl(
  claims: Record<string, unknown> | undefined,
  user: MetadataContainer | null | undefined,
): string | null {
  const fromUserMetadata = sanitizeAvatarUrl(
    readMetadataValue(user?.user_metadata, AVATAR_KEYS),
  )
  if (fromUserMetadata) return fromUserMetadata

  const fromClaims = sanitizeAvatarUrl(
    readMetadataValue(claims?.user_metadata, AVATAR_KEYS),
  )
  if (fromClaims) return fromClaims

  const fromTopClaims = sanitizeAvatarUrl(
    readMetadataValue(claims, AVATAR_KEYS),
  )
  if (fromTopClaims) return fromTopClaims

  if (Array.isArray(user?.identities)) {
    for (const identity of user.identities) {
      const fromIdentity = sanitizeAvatarUrl(
        readMetadataValue(identity?.identity_data, AVATAR_KEYS),
      )
      if (fromIdentity) return fromIdentity
    }
  }

  return null
}

export function extractUserDisplayName(
  claims: Record<string, unknown> | undefined,
  user: MetadataContainer | null | undefined,
): string | null {
  const fromUser = readMetadataValue(user?.user_metadata, NAME_KEYS)
  if (fromUser) return fromUser

  const fromClaims = readMetadataValue(claims?.user_metadata, NAME_KEYS)
  if (fromClaims) return fromClaims

  const fromTopClaims = readMetadataValue(claims, NAME_KEYS)
  if (fromTopClaims) return fromTopClaims

  if (Array.isArray(user?.identities)) {
    for (const identity of user.identities) {
      const fromIdentity = readMetadataValue(identity?.identity_data, NAME_KEYS)
      if (fromIdentity) return fromIdentity
    }
  }

  return null
}

/**
 * Builds an ordered, deduplicated list of validated candidate avatar URLs
 * (`avatarUrl` first, followed by an optional explicit `gravatarUrl` fallback),
 * falling back cleanly to initials when empty or on load error.
 */
export function buildAvatarCandidates({
  avatarUrl,
  gravatarUrl,
}: {
  avatarUrl?: string | null
  email?: string | null
  gravatarUrl?: string | null
}): string[] {
  const candidates: string[] = []
  const pushUnique = (value: string | null) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value)
    }
  }

  pushUnique(sanitizeAvatarUrl(avatarUrl))
  pushUnique(sanitizeAvatarUrl(gravatarUrl))

  return candidates
}
