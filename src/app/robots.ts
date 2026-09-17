import type { MetadataRoute } from 'next'

import { getSiteUrl, isSiteIndexable } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  if (!isSiteIndexable()) {
    return { rules: { disallow: '/', userAgent: '*' } }
  }

  return {
    rules: {
      allow: '/',
      disallow: ['/admin/', '/api/'],
      userAgent: '*',
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  }
}
