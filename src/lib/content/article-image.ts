export const DEFAULT_ARTICLE_COVER_IMAGE = '/images/clients-blog-secondary.jpg'

const OPTIMIZED_IMAGE_EXACT_HOSTS = new Set([
  'ursafbeufgmlxhxnflvh.supabase.co',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
  'www.gravatar.com',
])

const DATA_IMAGE_URI_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,/i

function isOptimizedRemoteHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  if (normalized === 'media.licdn.com') return false
  if (OPTIMIZED_IMAGE_EXACT_HOSTS.has(normalized)) return true
  return (
    normalized.endsWith('.supabase.co') ||
    normalized.endsWith('.googleusercontent.com')
  )
}

/**
 * Resolves an article cover image URL into a safe src/unoptimized pair for next/image
 * so uploaded data URIs, external domains, or malformed URLs never crash page rendering.
 */
export function resolveSafeArticleImage(rawSrc?: string | null): {
  src: string
  unoptimized: boolean
} {
  const trimmed = typeof rawSrc === 'string' ? rawSrc.trim() : ''
  if (!trimmed) {
    return { src: DEFAULT_ARTICLE_COVER_IMAGE, unoptimized: false }
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { src: trimmed, unoptimized: false }
  }

  if (DATA_IMAGE_URI_PATTERN.test(trimmed)) {
    return { src: trimmed, unoptimized: true }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return {
        src: trimmed,
        unoptimized:
          parsed.protocol !== 'https:' ||
          !isOptimizedRemoteHost(parsed.hostname),
      }
    }
  } catch {
    // Fall through to default placeholder on malformed URL strings.
  }

  return { src: DEFAULT_ARTICLE_COVER_IMAGE, unoptimized: false }
}

/** Checks whether a cover URL can be emitted in OpenGraph / JSON-LD metadata. */
export function resolvePublicMetadataImageUrl(
  rawSrc?: string | null,
): string | undefined {
  const trimmed = typeof rawSrc === 'string' ? rawSrc.trim() : ''
  if (!trimmed || DATA_IMAGE_URI_PATTERN.test(trimmed)) return undefined
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed
    }
  } catch {
    return undefined
  }
  return undefined
}

export function formatSafeArticleDate(
  value: string | null | undefined,
  month: 'short' | 'long' = 'short',
): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

export function getSafeDateTimestamp(
  value: string | null | undefined,
): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}
