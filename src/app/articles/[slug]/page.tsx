import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { RichText } from '@/components/ui/rich-text'
import { getArticleBySlug } from '@/lib/content/articles'
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

  return (articles || []).map((art) => ({ slug: art.slug }))
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
      authors: article.author?.full_name ? [article.author.full_name] : undefined,
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
  }

  return (
    <article className="article-detail-page container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          {article.published_at && (
            <time dateTime={article.published_at} className="article-detail__date">
              {new Date(article.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          )}
        </div>

        <h1 className="article-detail__title">{article.title}</h1>
        <p className="article-detail__lead">{article.excerpt}</p>

        {article.author && (
          <div className="article-detail__author-bar">
            <div>
              <p className="article-detail__author-name">By {article.author.full_name}</p>
              {article.author.bio && (
                <p className="article-detail__author-bio">{article.author.bio}</p>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="article-detail__content">
        <RichText content={article.content} />
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="article-detail__tags">
          <span className="article-detail__tags-label">Tags:</span>
          {article.tags.map((tag) => (
            <span key={tag.id} className="article-tag-chip">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <footer className="article-detail__footer">
        <Card className="spotlight-card">
          <div>
            <h2>Ready to scale your team?</h2>
            <p>
              Connect with OPG to discover how dedicated remote talent pods can
              accelerate your organization&apos;s product delivery.
            </p>
          </div>
          <div className="button-row">
            <ButtonLink href="/contact" variant="primary">
              Schedule a Consultation
            </ButtonLink>
            <ButtonLink href="/services" variant="secondary">
              Explore Delivery Models
            </ButtonLink>
          </div>
        </Card>
      </footer>
    </article>
  )
}

