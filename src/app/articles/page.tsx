import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import type { Article } from '@/lib/content/articles'
import { getPublishedArticles } from '@/lib/content/articles'
import { featuredArticles } from '@/lib/content/featured-articles'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600

const PAGE_SIZE = 6

type ArticlesPageProps = {
  searchParams: Promise<{
    page?: string
    category?: string
  }>
}

function formatArticleDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function ArticleImage({
  article,
  sizes,
  priority = false,
}: {
  article: Article
  sizes: string
  priority?: boolean
}) {
  const src = article.cover_image_url || '/images/clients-blog-secondary.jpg'

  return (
    <Image
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      src={src}
      unoptimized={src.startsWith('https://media.licdn.com')}
    />
  )
}

function Engagement({
  article,
  inverse = false,
}: {
  article: Article
  inverse?: boolean
}) {
  return (
    <span
      className={`article-engagement ${inverse ? 'article-engagement--inverse' : ''}`}
      aria-label={`${article.like_count ?? 0} LinkedIn reactions. LinkedIn views are visible only to the publisher.`}
    >
      <span className="article-engagement__item">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
        </svg>
        {article.like_count ?? 0} reactions
      </span>
      <span
        className="article-engagement__item"
        title="View totals are visible only to the LinkedIn publisher"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M2.2 12s3.6-6 9.8-6 9.8 6 9.8 6-3.6 6-9.8 6-9.8-6-9.8-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
        {article.view_count === null
          ? 'Publisher-only views'
          : `${article.view_count.toLocaleString()} views`}
      </span>
    </span>
  )
}

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/articles', siteUrl).toString()

  return {
    title: `Articles & Industry Insights | ${siteConfig.shortName}`,
    description:
      'People stories, leadership perspectives, and practical insights from Outsourced Pro Global.',
    alternates: { canonical: pageUrl },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title: `Articles & Insights | ${siteConfig.name}`,
      description:
        'Stories and perspectives on talent, career growth, and building exceptional global teams.',
      url: pageUrl,
      type: 'website',
    },
  }
}

export default async function ArticlesPage({
  searchParams,
}: ArticlesPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, Number.parseInt(params.page || '1', 10) || 1)
  const categorySlug = params.category || undefined

  const databaseData = await getPublishedArticles({
    page: 1,
    pageSize: 50,
    categorySlug,
  })

  const editorialArticles = featuredArticles.filter(
    (article) =>
      !categorySlug ||
      article.categories?.some((category) => category.slug === categorySlug),
  )
  const articleMap = new Map<string, Article>()

  for (const article of [...editorialArticles, ...databaseData.articles]) {
    if (!articleMap.has(article.slug)) articleMap.set(article.slug, article)
  }

  const allArticles = [...articleMap.values()].sort(
    (a, b) =>
      new Date(b.published_at || b.created_at).getTime() -
      new Date(a.published_at || a.created_at).getTime(),
  )
  const total = allArticles.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = (currentPage - 1) * PAGE_SIZE
  const articles = allArticles.slice(from, from + PAGE_SIZE)
  const featuredArticle = articles[0]
  const latestArticles = articles.slice(1, 3)

  return (
    <div className="articles-page">
      <div className="articles-page__glow" aria-hidden="true" />
      <div className="articles-page__container">
        <h1 className="sr-only">OPG articles and industry insights</h1>

        {articles.length === 0 ? (
          <EmptyState
            title="No articles found"
            message={
              categorySlug
                ? 'No articles match this category yet. Explore another topic or check back soon.'
                : 'Our editorial team is preparing new stories. Please check back shortly.'
            }
          />
        ) : (
          <>
            {featuredArticle ? (
              <section
                className="articles-feature-layout"
                aria-label="Featured and latest articles"
              >
                <Link
                  className="articles-feature-card"
                  href={`/articles/${featuredArticle.slug}`}
                >
                  <div className="articles-feature-card__media">
                    <ArticleImage
                      article={featuredArticle}
                      priority
                      sizes="(max-width: 62rem) 100vw, 68vw"
                    />
                  </div>
                  <div className="articles-feature-card__content">
                    <span className="articles-feature-card__label">
                      Featured perspective
                    </span>
                    <h2>{featuredArticle.title}</h2>
                    <p>{featuredArticle.excerpt}</p>
                    <div className="articles-feature-card__meta">
                      <span>
                        {formatArticleDate(featuredArticle.published_at)} ·{' '}
                        {featuredArticle.reading_time_minutes} min read
                      </span>
                      <Engagement article={featuredArticle} inverse />
                    </div>
                  </div>
                </Link>

                <aside
                  className="articles-latest"
                  aria-labelledby="latest-articles-title"
                >
                  <div className="articles-latest__header">
                    <h2 id="latest-articles-title">Latest stories</h2>
                  </div>

                  <div className="articles-latest__list">
                    {latestArticles.map((article) => (
                      <Link
                        className="articles-latest__item"
                        href={`/articles/${article.slug}`}
                        key={article.id}
                      >
                        <div className="articles-latest__thumbnail">
                          <ArticleImage
                            article={article}
                            sizes="(max-width: 42rem) 28vw, 9rem"
                          />
                        </div>
                        <div className="articles-latest__copy">
                          <h3>{article.title}</h3>
                          <p>
                            {formatArticleDate(article.published_at)} ·{' '}
                            {article.reading_time_minutes} min read
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </aside>
              </section>
            ) : null}

            <section
              className="articles-collection"
              aria-labelledby="articles-collection-title"
            >
              <div className="articles-collection__header">
                <div>
                  <p>People & perspectives</p>
                  <h2 id="articles-collection-title">Stories worth sharing</h2>
                </div>
                <p>
                  Real experiences, practical lessons, and the people shaping
                  work at OPG.
                </p>
              </div>

              <div className="articles-grid">
                {articles.map((article) => (
                  <article className="article-card" key={article.id}>
                    <Link
                      aria-label={`Read ${article.title}`}
                      className="article-card__media"
                      href={`/articles/${article.slug}`}
                    >
                      <ArticleImage
                        article={article}
                        sizes="(max-width: 42rem) 100vw, (max-width: 62rem) 50vw, 33vw"
                      />
                    </Link>
                    <div className="article-card__body">
                      <div className="article-card__meta">
                        <span className="article-card__category">
                          {article.categories?.[0]?.name || 'OPG Perspective'}
                        </span>
                        <span>{article.reading_time_minutes} min read</span>
                      </div>
                      <h3 className="article-card__title">
                        <Link href={`/articles/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h3>
                      <p className="article-card__excerpt">{article.excerpt}</p>
                      <div className="article-card__footer">
                        <time dateTime={article.published_at || undefined}>
                          {formatArticleDate(article.published_at)}
                        </time>
                        <Engagement article={article} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {totalPages > 1 ? (
              <div className="articles-pagination">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={total}
                  pageSize={PAGE_SIZE}
                  basePath={
                    categorySlug
                      ? `/articles?category=${encodeURIComponent(categorySlug)}`
                      : '/articles'
                  }
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
