const DEFAULT_ADMIN_PATH = '/admin'

export function getSafeAdminPath(
  value: string | null | undefined,
  fallback = DEFAULT_ADMIN_PATH,
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const parsed = new URL(value, 'https://opg.invalid')

    if (parsed.origin !== 'https://opg.invalid') return fallback
    if (!parsed.pathname.startsWith('/admin')) return fallback

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

const publicAuthPaths = new Set(['/contact', '/account', '/reset-password'])

export function isPublicAuthPath(value: string | null | undefined): boolean {
  return typeof value === 'string' && publicAuthPaths.has(value)
}

export function getSafePublicPath(
  value: string | null | undefined,
  fallback = '/contact',
): string {
  return isPublicAuthPath(value) ? value! : fallback
}
