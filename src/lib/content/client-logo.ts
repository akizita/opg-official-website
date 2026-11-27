const OPTIMIZED_CLIENT_LOGO_HOSTS = new Set([
  'ursafbeufgmlxhxnflvh.supabase.co',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
  'www.gravatar.com',
])

const DATA_IMAGE_URI_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,/i
const SVG_PATH_PATTERN = /\.svg(\?|#|$)/i

function isOptimizedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  if (OPTIMIZED_CLIENT_LOGO_HOSTS.has(normalized)) return true
  return (
    normalized.endsWith('.supabase.co') ||
    normalized.endsWith('.googleusercontent.com')
  )
}

/**
 * Resolves a client logo URL safely for Next.js <Image>, returning null when blank or invalid.
 * Marks SVG assets, data URIs, and unconfigured hosts unoptimized to prevent runtime optimizer crashes.
 */
export function resolveSafeClientLogo(rawSrc?: string | null): {
  src: string
  unoptimized: boolean
} | null {
  const trimmed = typeof rawSrc === 'string' ? rawSrc.trim() : ''
  if (!trimmed) return null

  const isSvg = SVG_PATH_PATTERN.test(trimmed)

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { src: trimmed, unoptimized: isSvg }
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
          isSvg ||
          parsed.protocol !== 'https:' ||
          !isOptimizedHost(parsed.hostname),
      }
    }
  } catch {
    return null
  }

  return null
}

/** Validates an optional http(s) URL (or relative path), normalizing blank values to null. */
export function normalizeOptionalHttpUrl(
  rawUrl: string | null | undefined,
  label: string,
): { value: string | null; error?: string } {
  const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : ''
  if (!trimmed) return { value: null }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { value: trimmed }
  }

  const candidate =
    !/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && trimmed.includes('.')
      ? `https://${trimmed}`
      : trimmed

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { value: null, error: `${label} must use https:// or http://.` }
    }
    return { value: parsed.toString() }
  } catch {
    return { value: null, error: `${label} must be a valid URL.` }
  }
}
