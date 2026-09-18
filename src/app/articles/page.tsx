import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import {
  getArticleCategories,
  getPublishedArticles,
} from '@/lib/content/articles'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600 // 1 hour ISR

type ArticlesPageProps = {
  searchParams: Promise<{
    page?: string
    category?: string
  }>
}

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/articles', siteUrl).toString()

  return {
    title: `Articles & Industry Insights | ${siteConfig.shortName}`,
    description:
      'Executive perspectives, playbooks, and best practices on scaling global talent pods, engineering velocity, and operational compliance.',
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title: `Articles & Insights | ${siteConfig.name}`,
      description:
        'Perspectives on scaling global talent pods, engineering velocity, and cross-border operations.',
      url: pageUrl,
      type: 'website',
    },
  }
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const categorySlug = params.category || undefined

  const [articlesData, categories] = await Promise.all([
    getPublishedArticles({
      page: currentPage,
      pageSize: 6,
      categorySlug,
    }),
    getArticleCategories(),
  ])

  const { articles, totalPages, total } = articlesData

  return (
    <main id="main-content" className="articles-page container">
      <header className="articles-hero">
        <h1 className="articles-hero__title">Insights & Perspectives</h1>
        <p className="articles-hero__lead">
          Actionable analysis, operational playbooks, and leadership strategies
          for distributed engineering and global workforce scaling.
        </p>
      </header>

      {/* Category filter navigation */}
      <nav aria-label="Article categories" className="articles-filter-nav">
        <Link
          href="/articles"
          className={`articles-filter-chip ${!categorySlug ? 'articles-filter-chip--active' : ''}`}
        >
          All Topics
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/articles?category=${encodeURIComponent(cat.slug)}`}
            className={`articles-filter-chip ${categorySlug === cat.slug ? 'articles-filter-chip--active' : ''}`}
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {articles.length === 0 ? (
        <EmptyState
          title="No articles found"
          message={
            categorySlug
              ? 'No articles match this category yet. Check back soon or explore other topics.'
              : 'Our editorial team is preparing insights. Please check back shortly.'
          }
        />
      ) : (
        <>
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
                      {new Date(article.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                </div>

                <h2 className="article-card__title">
                  <Link href={`/articles/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>

                <p className="article-card__excerpt">{article.excerpt}</p>

                <div className="article-card__footer">
                  {article.author && (
                    <span className="article-card__author">
                      By {article.author.full_name}
                    </span>
                  )}
                  {article.categories && article.categories.length > 0 && (
                    <span className="article-card__category">
                      {article.categories[0].name}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: '3rem' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={total}
                pageSize={6}
                basePath={categorySlug ? `/articles?category=${encodeURIComponent(categorySlug)}` : '/articles'}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}

