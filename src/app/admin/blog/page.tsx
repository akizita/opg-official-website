import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import {
  getFeaturedArticleSlug,
  getPublishedArticles,
} from '@/lib/content/articles'
import { getClientsBlogConfig } from '@/lib/content/clients-blog'
import { featuredArticles } from '@/lib/content/featured-articles'
import { getAdminTeamData } from '@/lib/content/team'
import { createClient } from '@/lib/supabase/server'

import { BlogStudio } from './blog-studio'

export const metadata: Metadata = {
  title: 'Clients Blog Management | OPG Admin',
}

export const dynamic = 'force-dynamic'

export type StudioAuthorOption = {
  id: string
  name: string
  role: string
  avatarUrl: string | null
}

export type StudioArticleOption = {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImageUrl: string | null
  publishedAt: string | null
  readingTimeMinutes: number
  isFeaturedSitewide: boolean
}

export default async function AdminBlogPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to manage the Clients Blog section.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const supabase = await createClient()

  const [initialConfig, teamData, publishedResult, featuredSlug] =
    await Promise.all([
      getClientsBlogConfig(supabase),
      getAdminTeamData(supabase),
      getPublishedArticles({ page: 1, pageSize: 50, client: supabase }),
      getFeaturedArticleSlug(supabase),
    ])

  const authorOptions: StudioAuthorOption[] = teamData.members
    .filter((m) => m.is_active)
    .map((m) => ({
      id: m.id,
      name: m.full_name,
      role: m.position,
      avatarUrl: m.photo_url,
    }))

  const articleMap = new Map<string, StudioArticleOption>()
  for (const article of [...publishedResult.articles, ...featuredArticles]) {
    if (!articleMap.has(article.slug)) {
      articleMap.set(article.slug, {
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt || '',
        coverImageUrl: article.cover_image_url || null,
        publishedAt: article.published_at || article.created_at || null,
        readingTimeMinutes: Number(article.reading_time_minutes || 4),
        isFeaturedSitewide: Boolean(
          featuredSlug && article.slug === featuredSlug,
        ),
      })
    }
  }

  const articleOptions = [...articleMap.values()].sort((a, b) => {
    if (a.isFeaturedSitewide !== b.isFeaturedSitewide) {
      return a.isFeaturedSitewide ? -1 : 1
    }
    return (
      new Date(b.publishedAt || 0).getTime() -
      new Date(a.publishedAt || 0).getTime()
    )
  })

  return (
    <BlogStudio
      articleOptions={articleOptions}
      authorOptions={authorOptions}
      initialConfig={initialConfig}
      roleKey={profile.roleKey}
    />
  )
}
