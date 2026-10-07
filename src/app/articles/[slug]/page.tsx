import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArticleEngagement } from '@/components/ui/article-engagement'
import { RichText } from '@/components/ui/rich-text'
import { getArticleBySlug } from '@/lib/content/articles'
import { featuredArticles } from '@/lib/content/featured-articles'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')

  const slugs = new Set([
    ...featuredArticles.map((article) => article.slug),
    ...(articles || []).map((article) => article.slug),
  ])

  return [...slugs].map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return { robots: { index: false, follow: false } }
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/articles/${slug}`, siteUrl).toString()

  const title = article.seo_title
    ? article.seo_title
    : `${article.title} | ${siteConfig.shortName}`

  const description = article.seo_description || article.excerpt

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: article.author?.full_name
        ? [article.author.full_name]
        : undefined,
      images: article.cover_image_url
        ? [{ url: article.cover_image_url }]
        : undefined,
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/articles/${slug}`, siteUrl).toString()

  // Article JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    url: pageUrl,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author.full_name,
        }
      : {
          '@type': 'Organization',
          name: siteConfig.name,
        },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteUrl.toString(),
    },
    image: article.cover_image_url || undefined,
    isBasedOn: article.source_url || undefined,
  }

  const authorName = article.author?.full_name || siteConfig.name
  const authorRole = article.author?.role_title || 'Editorial Team'
  const publishedLabel = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Publication date pending'

  return (
    <article className="article-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="article-detail__container">
        <nav aria-label="Breadcrumbs" className="breadcrumbs">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/articles">Articles</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{article.title}</span>
        </nav>

        <header className="article-detail__header">
          <div className="article-detail__meta">
            {article.categories && article.categories.length > 0 && (
              <span className="article-detail__category">
                {article.categories[0].name}
              </span>
            )}
            <span className="article-detail__reading-time">
              {article.reading_time_minutes} min read
            </span>
          </div>

          <h1 className="article-detail__title">{article.title}</h1>
          <p className="article-detail__lead">{article.excerpt}</p>
        </header>

        {article.cover_image_url ? (
          <figure className="article-detail__cover">
            <Image
              alt=""
              fill
              priority
              sizes="(max-width: 75rem) 100vw, 72rem"
              src={article.cover_image_url}
              unoptimized={article.cover_image_url.startsWith(
                'https://media.licdn.com',
              )}
            />
          </figure>
        ) : null}

        <div className="article-detail__content-wrap">
          <div className="article-detail__content">
            <RichText content={article.content} />
          </div>

          <aside
            className="article-detail__publication"
            aria-label="Publication details"
          >
            <span className="article-detail__author-mark" aria-hidden="true">
              OPG
            </span>
            <div className="article-detail__publication-author">
              <span>Written by</span>
              <strong>{authorName}</strong>
              <p>{authorRole}</p>
            </div>
            <div className="article-detail__publication-date">
              <span>Published</span>
              {article.published_at ? (
                <time dateTime={article.published_at}>{publishedLabel}</time>
              ) : (
                <p>{publishedLabel}</p>
              )}
            </div>
            <ArticleEngagement slug={article.slug} />
          </aside>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="article-detail__tags">
            <span className="article-detail__tags-label">Topics</span>
            {article.tags.map((tag) => (
              <span key={tag.id} className="article-tag-chip">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <footer className="article-detail__footer">
          <div className="article-detail__social-intro">
            <div>
              <span>OPG social channels</span>
              <h2>Follow our people, insights, and opportunities.</h2>
            </div>
            <nav
              aria-label="Outsourced Pro Global social media"
              className="article-detail__social-links"
            >
              <a
                aria-label="Follow OPG on LinkedIn"
                href="https://www.linkedin.com/company/outsourced-pro-global/"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14M8.3 18.2V9.8H5.5v8.4h2.8M6.9 8.7a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m11.3 9.5v-4.6c0-2.5-1.3-3.7-3.1-3.7a2.7 2.7 0 0 0-2.4 1.3V9.8H10v8.4h2.8V14c0-1.1.2-2.1 1.6-2.1s1.4 1.3 1.4 2.2v4.1h2.4Z" />
                </svg>
              </a>
              <a
                aria-label="Follow OPG on Facebook"
                href="https://www.facebook.com/OPGteam/"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M14 8h3V4.2c-.5-.1-2.2-.2-4.1-.2C9 4 6.3 6.4 6.3 10.8V14H2v4.3h4.3V24h5.3v-5.7h4.1l.7-4.3h-4.8v-2.8C11.6 10 12 8 14 8Z" />
                </svg>
              </a>
              <a
                aria-label="Follow OPG on Instagram"
                href="https://www.instagram.com/_opgteam/"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <rect height="18" rx="5" width="18" x="3" y="3" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.4" cy="6.7" r="1" />
                </svg>
              </a>
              <a
                aria-label="Share this article on Reddit"
                href={`https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}`}
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M20.9 12.1c.1-.3.2-.6.2-1a2.2 2.2 0 0 0-3.8-1.5 10.7 10.7 0 0 0-4.7-1.5l1-4.5 3.1.7a1.8 1.8 0 1 0 .3-1.2l-3.8-.8a.7.7 0 0 0-.8.5l-1.1 5.3a10.7 10.7 0 0 0-4.8 1.5 2.2 2.2 0 1 0-3.6 2.5 4 4 0 0 0-.1.9c0 2.7 4.1 4.9 9.1 4.9s9.2-2.2 9.2-4.9a4 4 0 0 0-.2-.9ZM6.7 12.3a1.4 1.4 0 1 1 2.8 0 1.4 1.4 0 0 1-2.8 0Zm8.6 3.2c-.9.9-2.4 1.1-3.3 1.1s-2.4-.2-3.3-1.1a.6.6 0 0 1 .9-.9c.5.5 1.5.8 2.4.8s1.9-.3 2.4-.8a.6.6 0 0 1 .9.9Zm-.7-1.8a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z" />
                </svg>
              </a>
              <a
                aria-label="Follow OPG on Threads"
                href="https://www.threads.net/@_opgteam"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12.3 2C6.7 2 3 5.8 3 12.1 3 18.5 6.7 22 12.4 22c5 0 8.6-2.7 8.6-6.8 0-3.1-1.8-5-4.5-5.7-.4-3.2-2.2-5-5-5-2.1 0-3.8 1-4.8 2.7l1.8 1.2c.7-1.1 1.6-1.7 3-1.7 1.5 0 2.5.8 2.8 2.5h-1.9c-3.5 0-5.7 1.7-5.7 4.4 0 2.4 1.9 4.1 4.6 4.1 3.3 0 5.2-2.1 5.3-5.7 1.4.6 2.2 1.6 2.2 3.2 0 2.8-2.4 4.6-6.3 4.6-4.6 0-7.1-2.8-7.1-7.7 0-4.8 2.6-7.9 7-7.9 3.5 0 5.9 1.7 7 4.9l2.1-.7C20 4.3 16.6 2 12.3 2Zm-1 13.5c-1.5 0-2.4-.7-2.4-1.8 0-1.4 1.3-2.2 3.6-2.2h2c0 2.6-1.1 4-3.2 4Z" />
                </svg>
              </a>
              <a
                aria-label="Follow OPG on TikTok"
                href="https://www.tiktok.com/@_opgteam"
                rel="noreferrer"
                target="_blank"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M15.6 3c.4 2.5 1.8 4 4.4 4.2v3.3a9.4 9.4 0 0 1-4.3-1.1v6.1a5.9 5.9 0 1 1-5.1-5.8v3.5a2.6 2.6 0 1 0 1.7 2.4V3h3.3Z" />
                </svg>
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </article>
  )
}
