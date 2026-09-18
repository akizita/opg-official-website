export const siteConfig = {
  name: 'Outsourced Pro Global',
  shortName: 'OPG',
  description:
    'Outsourced Pro Global connects organizations with skilled professionals and helps candidates discover their next opportunity.',
  canonicalUrl: 'https://opglobal.com.hk',
  navigation: [
    { href: '/about', label: 'About' },
    { href: '/mission-and-vision', label: 'Mission & Vision' },
    { href: '/services', label: 'Services' },
    { href: '/clients', label: 'Clients' },
    { href: '/careers', label: 'Careers' },
    { href: '/articles', label: 'Articles' },
    { href: '/faqs', label: 'FAQs' },
  ],
} as const

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!configuredUrl) {
    return new URL(siteConfig.canonicalUrl)
  }

  try {
    return new URL(configuredUrl)
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute URL')
  }
}

export function isSiteIndexable() {
  return process.env.SITE_INDEXABLE === 'true'
}
