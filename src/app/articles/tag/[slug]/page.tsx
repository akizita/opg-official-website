import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getArticleTags, getPublishedArticles } from '@/lib/content/articles'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

type TagPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const tags = await getArticleTags(supabase)
  return tags.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const tags = await getArticleTags()
  const tag = tags.find((t) => t.slug === slug)

  if (!tag) {
    return { robots: { index: false, follow: false } }
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/articles/tag/${slug}`, siteUrl).toString()

  return {
    title: `#${tag.name} Articles | ${siteConfig.shortName}`,
    description: `Articles tagged with #${tag.name}.`,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
  }
}

export default async function ArticleTagPage({ params }: TagPageProps) {
  const { slug } = await params
  const tags = await getArticleTags()
  const tag = tags.find((t) => t.slug === slug)

  if (!tag) {
    notFound()
  }

  const { articles } = await getPublishedArticles({
    tagSlug: slug,
    pageSize: 20,
  })

  return (
    <main id="main-content" className="articles-page container">
      <nav aria-label="Breadcrumbs" className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/articles">Articles</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">#{tag.name}</span>
      </nav>

      <header className="articles-hero">
        <h1 className="articles-hero__title">#{tag.name}</h1>
        <p className="articles-hero__lead">
          Articles and resources filed under #{tag.name}.
        </p>
      </header>

      {articles.length === 0 ? (
        <EmptyState
          title="No articles found"
          message="No articles tagged with this topic yet."
        />
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <Card key={article.id} className="article-card">
              <div className="article-card__meta">
                <span className="article-card__reading-time">
                  {article.reading_time_minutes} min read
                </span>
                {article.published_at && (
                  <time
                    dateTime={article.published_at}
                    className="article-card__date"
                  >
                    {new Date(article.published_at).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}
                  </time>
                )}
              </div>

              <h2 className="article-card__title">
                <Link href={`/articles/${article.slug}`}>{article.title}</Link>
              </h2>
              <p className="article-card__excerpt">{article.excerpt}</p>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
