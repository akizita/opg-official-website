import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getArticleCategories,
  getPublishedArticles,
} from '@/lib/content/articles'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const categories = await getArticleCategories(supabase)
  return categories.map((cat) => ({ slug: cat.slug }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const categories = await getArticleCategories()
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    return { robots: { index: false, follow: false } }
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/articles/category/${slug}`, siteUrl).toString()

  return {
    title: `${category.name} Articles | ${siteConfig.shortName}`,
    description: category.description || `Articles and insights about ${category.name}.`,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
  }
}

export default async function ArticleCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const categories = await getArticleCategories()
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    notFound()
  }

  const { articles } = await getPublishedArticles({
    categorySlug: slug,
    pageSize: 20,
  })

  return (
    <main id="main-content" className="articles-page container">
      <nav aria-label="Breadcrumbs" className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/articles">Articles</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{category.name}</span>
      </nav>

      <header className="articles-hero">
        <h1 className="articles-hero__title">{category.name}</h1>
        {category.description && (
          <p className="articles-hero__lead">{category.description}</p>
        )}
      </header>

      {articles.length === 0 ? (
        <EmptyState
          title="No articles in this category"
          message="Check back soon for new articles in this topic area."
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
                  <time dateTime={article.published_at} className="article-card__date">
                    {new Date(article.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
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

