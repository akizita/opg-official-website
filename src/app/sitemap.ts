import type { MetadataRoute } from 'next'

import { getSiteUrl, isSiteIndexable } from '@/lib/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteIndexable()) return []

  const siteUrl = getSiteUrl()

  // Add a route only after its content is published and accepted. Draft
  // navigation placeholders must never enter the production sitemap.
  return [{ changeFrequency: 'weekly', priority: 1, url: siteUrl.toString() }]
}
