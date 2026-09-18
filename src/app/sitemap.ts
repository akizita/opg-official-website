import type { MetadataRoute } from 'next'

import { getSiteUrl, isSiteIndexable } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) return []

  const siteUrl = getSiteUrl()
  const entries: MetadataRoute.Sitemap = [
    { changeFrequency: 'weekly', priority: 1, url: siteUrl.toString() },
  ]

  try {
    const supabase = await createClient()
    const { data: publishedDocs } = await supabase
      .from('page_documents')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (publishedDocs) {
      for (const doc of publishedDocs) {
        entries.push({
          url: new URL(`/${doc.slug}`, siteUrl).toString(),
          lastModified: doc.updated_at ? new Date(doc.updated_at) : undefined,
          changeFrequency: 'monthly',
          priority: 0.8,
        })
      }
    }
  } catch {
    // If DB is unreachable during static generation, return base entries safely
  }

  return entries
}
