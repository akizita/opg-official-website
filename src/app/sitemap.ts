import type { MetadataRoute } from 'next'

import { getSiteUrl, isSiteIndexable } from '@/lib/site-config'
import { createStaticClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) return []

  const siteUrl = getSiteUrl()
  const entries: MetadataRoute.Sitemap = [
    { changeFrequency: 'weekly', priority: 1, url: siteUrl.toString() },
    {
      changeFrequency: 'monthly',
      priority: 0.9,
      url: new URL('/about', siteUrl).toString(),
    },
    {
      changeFrequency: 'monthly',
      priority: 0.9,
      url: new URL('/services', siteUrl).toString(),
    },
    {
      changeFrequency: 'monthly',
      priority: 0.9,
      url: new URL('/clients', siteUrl).toString(),
    },
    {
      changeFrequency: 'monthly',
      priority: 0.8,
      url: new URL('/mission-and-vision', siteUrl).toString(),
    },
    {
      changeFrequency: 'weekly',
      priority: 0.9,
      url: new URL('/articles', siteUrl).toString(),
    },
    {
      changeFrequency: 'weekly',
      priority: 0.9,
      url: new URL('/careers', siteUrl).toString(),
    },
    {
      changeFrequency: 'monthly',
      priority: 0.8,
      url: new URL('/faqs', siteUrl).toString(),
    },
    {
      changeFrequency: 'monthly',
      priority: 0.8,
      url: new URL('/contact', siteUrl).toString(),
    },
  ]

  try {
    const supabase = createStaticClient()

    // Additional published page documents
    const { data: publishedDocs } = await supabase
      .from('page_documents')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (publishedDocs) {
      for (const doc of publishedDocs) {
        if (
          doc.slug === 'home' ||
          [
            'about',
            'services',
            'clients',
            'mission-and-vision',
            'articles',
            'careers',
            'faqs',
            'contact',
            'search',
          ].includes(doc.slug)
        ) {
          continue
        }
        entries.push({
          url: new URL(`/${doc.slug}`, siteUrl).toString(),
          lastModified: doc.updated_at ? new Date(doc.updated_at) : undefined,
          changeFrequency: 'monthly',
          priority: 0.8,
        })
      }
    }

    // Published services
    const { data: services } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('is_published', true)

    if (services) {
      for (const service of services) {
        entries.push({
          url: new URL(`/services/${service.slug}`, siteUrl).toString(),
          lastModified: service.updated_at
            ? new Date(service.updated_at)
            : undefined,
          changeFrequency: 'monthly',
          priority: 0.8,
        })
      }
    }

    // Published articles
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (articles) {
      for (const article of articles) {
        entries.push({
          url: new URL(`/articles/${article.slug}`, siteUrl).toString(),
          lastModified: article.updated_at
            ? new Date(article.updated_at)
            : undefined,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    // Published job openings
    const { data: jobs } = await supabase
      .from('job_openings')
      .select('slug, updated_at')
      .eq('status', 'published')

    if (jobs) {
      for (const job of jobs) {
        entries.push({
          url: new URL(`/careers/${job.slug}`, siteUrl).toString(),
          lastModified: job.updated_at ? new Date(job.updated_at) : undefined,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  } catch {
    // Fallback safely if DB is unreachable during build
  }

  return entries
}
