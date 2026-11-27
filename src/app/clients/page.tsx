import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { BlogShareButtons } from '@/components/ui/blog-share-buttons'
import { ButtonLink } from '@/components/ui/button-link'
import type { ClientLogoType } from '@/components/ui/client-logo'
import { ClientsBlogRealtimeSync } from '@/components/ui/clients-blog-realtime-sync'
import { ClientsBlogRichBlock } from '@/components/ui/clients-blog-rich-blocks'
import {
  ClientsPartnerProfiles,
  type PartnerProfileItem,
} from '@/components/ui/clients-partner-profiles'
import { ClientsRealtimeSync } from '@/components/ui/clients-realtime-sync'
import { ClientsTestimonialCarousel, type CarouselTestimonialItem } from '@/components/ui/clients-testimonial-carousel'
import { ClientsGlobeHero } from '@/components/ui/clients-globe-hero'
import { ClientsCtaAsciiMapCorners } from '@/components/ui/clients-cta-ascii-map'
import type { Article } from '@/lib/content/articles'
import {
  getFeaturedArticleSlug,
  getPublishedArticles,
} from '@/lib/content/articles'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import { featuredArticles } from '@/lib/content/featured-articles'
import {
  getClientsBlogConfig,
  type ClientsBlogConfig,
} from '@/lib/content/clients-blog'
import {
  getPublishedTestimonials,
  getVisibleClients,
  type Client,
  type Testimonial,
} from '@/lib/content/clients'
import { CLIENT_PAGE_DEFAULTS } from '@/lib/content/client-page'
import type { PageDocument } from '@/lib/content/page-documents'
import { CLIENTS_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const clientPartners: readonly PartnerProfileItem[] = [
  {
    id: 'northstar-labs',
    name: 'Northstar Labs',
    badge: 'Enterprise Software',
    industry: 'Enterprise SaaS & Cloud Systems',
    region: 'North America (San Francisco, CA)',
    podCapability: 'Full-Stack Engineering & QA Automation Pod',
    talentCount: '14 Specialists Placed',
    tagline: 'Cloud-native enterprise workflow intelligence',
    description:
      'Northstar Labs engineers secure, cloud-native workflow automation platforms and distributed collaboration software serving high-growth technology scaleups and global enterprise clients.',
    website: 'https://northstarlabs.example.com',
    social: 'https://www.linkedin.com/company/northstar-labs',
    facebook: 'https://facebook.com/northstarlabs',
    instagram: 'https://instagram.com/northstarlabs',
    x: 'https://x.com/northstarlabs',
    logoType: 'northstar',
  },
  {
    id: 'meridian-health',
    name: 'Meridian Health',
    badge: 'Digital Health',
    industry: 'Healthcare Technology & Telehealth',
    region: 'Australia (Sydney, NSW)',
    podCapability: '24/7 Care Coordination & Medical Ops Pod',
    talentCount: '18 Specialists Placed',
    tagline: 'Coordinated telehealth and patient-first access',
    description:
      'A premier digital healthcare collective improving clinical access across Australasia through synchronized telehealth support, 24/7 triage workflows, and compassionate care navigation.',
    website: 'https://meridianhealth.example.com',
    social: 'https://www.linkedin.com/company/meridian-health',
    facebook: 'https://facebook.com/meridianhealth',
    instagram: 'https://instagram.com/meridianhealth',
    x: 'https://x.com/meridianhealth',
    logoType: 'meridian',
  },
  {
    id: 'harborline-finance',
    name: 'Harborline Finance',
    badge: 'Fintech & Compliance',
    industry: 'Financial Services & Risk Management',
    region: 'United Kingdom (London)',
    podCapability: 'AML/KYC Compliance & Settlement Pod',
    talentCount: '9 Specialists Placed',
    tagline: 'Transparent cross-border algorithmic wealth tech',
    description:
      'A regulated fintech firm providing transparent cross-border asset management, algorithmic settlement infrastructure, and institutional-grade regulatory reporting systems.',
    website: 'https://harborlinefinance.example.com',
    social: 'https://www.linkedin.com/company/harborline-finance',
    facebook: 'https://facebook.com/harborlinefinance',
    instagram: 'https://instagram.com/harborlinefinance',
    x: 'https://x.com/harborlinefin',
    logoType: 'harborline',
  },
  {
    id: 'atlas-commerce',
    name: 'Atlas Commerce',
    badge: 'E-Commerce & Retail',
    industry: 'Omnichannel Commerce & Logistics',
    region: 'Southeast Asia (Singapore)',
    podCapability: 'Catalog Ops, Retention & Growth Pod',
    talentCount: '16 Specialists Placed',
    tagline: 'Omnichannel marketplace scaling for lifestyle brands',
    description:
      'A fast-scaling multi-channel commerce platform enabling ambitious consumer brands to synchronize catalog feeds, streamline fulfillment pipelines, and accelerate regional marketplace growth.',
    website: 'https://atlascommerce.example.com',
    social: 'https://www.linkedin.com/company/atlas-commerce',
    facebook: 'https://facebook.com/atlascommerce',
    instagram: 'https://instagram.com/atlascommerce',
    x: 'https://x.com/atlascommerce',
    logoType: 'atlas',
  },
  {
    id: 'veridian-operations',
    name: 'Veridian Operations',
    badge: 'Professional Services',
    industry: 'Management Consulting & Shared Services',
    region: 'Middle East (Dubai, UAE)',
    podCapability: 'Executive Shared Services & BI Pod',
    talentCount: '11 Specialists Placed',
    tagline: 'Resilient operating models and strategic execution',
    description:
      'A leading corporate advisory and management consultancy designing high-agility shared services, automated business intelligence pipelines, and resilient operating models for multinational enterprises.',
    website: 'https://veridianops.example.com',
    social: 'https://www.linkedin.com/company/veridian-operations',
    facebook: 'https://facebook.com/veridianops',
    instagram: 'https://instagram.com/veridianops',
    x: 'https://x.com/veridianops',
    logoType: 'veridian',
  },
] as const

export type ClientBlogPost = {
  id: string
  title: string
  category: string
  readTime: string
  badge: string
  excerpt: string
  highlights: string[]
  author: string
  authorRole: string
  href: string
}

export type ClientTestimonialItem = {
  id: string
  quote: string
  headline: string
  authorName: string
  authorRole: string
  companyName: string
  companyId: string
  logoType: ClientLogoType
  metricBadge: string
  rating: number
  industry: string
  photoUrl: string
}

const clientTestimonials: readonly ClientTestimonialItem[] = [
  {
    id: 'testimonial-northstar',
    companyId: 'northstar-labs',
    companyName: 'Northstar Labs',
    headline: 'Exceeded All Expectations on Velocity & Scale',
    authorName: 'Marcus Vance',
    authorRole: 'VP of Engineering & Product Infrastructure',
    logoType: 'northstar',
    metricBadge: '+160% Sprint Velocity',
    industry: 'Enterprise SaaS',
    rating: 5,
    photoUrl: '/images/testimonial-marcus-vance.jpg',
    quote:
      'Outsourced Pro Global integrated seamlessly into our GitHub and Jira workflows within two weeks. Their QA and full-stack engineering pod didn’t just execute sprint tickets—they overhauled our automated CI/CD pipeline, reducing release regression cycles by 65%. It feels like having our own senior in-house engineers down the hall.',
  },
  {
    id: 'testimonial-meridian',
    companyId: 'meridian-health',
    companyName: 'Meridian Health',
    headline: 'Uncompromised Clinical Compliance & 24/7 Care',
    authorName: 'Dr. Eleanor Evans, MD',
    authorRole: 'Chief Medical & Operations Officer',
    logoType: 'meridian',
    metricBadge: '99.8% SLA Adherence',
    industry: 'Digital Health',
    rating: 5,
    photoUrl: '/images/testimonial-eleanor-evans.jpg',
    quote:
      'In digital health, empathy and compliance cannot be compromised. OPG built us a dedicated 24/7 clinical coordination pod that achieved a 99.8% SLA adherence rate and full HIPAA/Privacy compliance from month one. Our patients receive compassionate care within seconds, day or night.',
  },
  {
    id: 'testimonial-harborline',
    companyId: 'harborline-finance',
    companyName: 'Harborline Finance',
    headline: 'Slashing Fintech OpEx & Model Backlog by 48%',
    authorName: 'Alistair Finch, CFA',
    authorRole: 'Head of Quantitative Risk & Regulatory Systems',
    logoType: 'harborline',
    metricBadge: '48% OpEx Efficiency',
    industry: 'Fintech & Compliance',
    rating: 5,
    photoUrl: '/images/testimonial-alistair-finch.jpg',
    quote:
      'Finding mathematically rigorous fintech talent with SOC 2 compliance discipline is notoriously difficult. The specialized modeling pod OPG assembled for Harborline exceeded every technical benchmark, slashing our model reconciliation backlog and lowering our operational overhead by 48%.',
  },
  {
    id: 'testimonial-atlas',
    companyId: 'atlas-commerce',
    companyName: 'Atlas Commerce',
    headline: 'Flawless Peak Synchronization Across 14 Hubs',
    authorName: 'Elena Rostova',
    authorRole: 'Global Director of Supply Chain & E-Commerce Ops',
    logoType: 'atlas',
    metricBadge: '14 Hubs Synchronized',
    industry: 'Global E-Commerce',
    rating: 5,
    photoUrl: '/images/testimonial-elena-rostova.jpg',
    quote:
      'When seasonal demand surges during Q4 peak events, OPG’s dedicated operations pod scales with us effortlessly. Their multi-lingual support and vendor reconciliation pods have eliminated order bottlenecks across 14 international fulfillment hubs with near-zero error rates.',
  },
  {
    id: 'testimonial-veridian',
    companyId: 'veridian-operations',
    companyName: 'Veridian Operations',
    headline: 'The Gold Standard in Remote Delivery & Insights',
    authorName: 'David Sterling',
    authorRole: 'Managing Director & Principal Consultant',
    logoType: 'veridian',
    metricBadge: '35+ Hrs Saved Weekly',
    industry: 'Shared Services',
    rating: 5,
    photoUrl: '/images/testimonial-david-sterling.jpg',
    quote:
      'OPG represents the gold standard in remote talent delivery. Their business intelligence pod engineered automated reporting pipelines that saved our executive team over 35 hours weekly in manual data assembly. The transparency, caliber, and proactive communication are unmatched.',
  },
]

function formatArticleDate(value: string | null | undefined) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

function resolveSafeBlogImageProps(rawUrl: string | null | undefined): {
  src: string
  unoptimized: boolean
} | null {
  if (!rawUrl || !rawUrl.trim()) return null
  const safe = resolveSafeArticleImage(rawUrl)
  return {
    src: safe.src,
    unoptimized: safe.unoptimized || /\.svg(\?|#|$)/i.test(safe.src),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select(
      'title, summary, seo_title, seo_description, canonical_url, og_image_url, status',
    )
    .eq('slug', 'clients')
    .eq('status', 'published')
    .maybeSingle<PageDocument>()
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/clients', siteUrl).toString()
  const title =
    doc?.seo_title ||
    `Clients & Strategic Partnerships | ${siteConfig.shortName}`
  const description =
    doc?.seo_description ||
    'Discover the forward-thinking organizations that partner with Outsourced Pro Global to build dedicated offshore talent pods, scale operations, and accelerate sustainable growth.'
  const indexable = isSiteIndexable()

  return {
    title,
    description,
    alternates: { canonical: doc?.canonical_url || pageUrl },
    openGraph: {
      title,
      description,
      url: doc?.canonical_url || pageUrl,
      siteName: siteConfig.name,
      type: 'website',
      images: doc?.og_image_url ? [{ url: doc.og_image_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: doc?.og_image_url ? [doc.og_image_url] : undefined,
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
  }
}

function getCompanyLogoType(name: string): ClientLogoType | undefined {
  const lower = name.toLowerCase()
  if (lower.includes('northstar')) return 'northstar'
  if (lower.includes('meridian')) return 'meridian'
  if (lower.includes('harborline')) return 'harborline'
  if (lower.includes('atlas')) return 'atlas'
  if (lower.includes('veridian')) return 'veridian'
  return undefined
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ opgPreview?: string }>
}) {
  const { opgPreview } = await searchParams
  const supabase = await createClient()
  const doc = await getVisiblePageDocument(supabase, 'clients', opgPreview === '1')
  const copy = getPageCopy(doc?.content, CLIENTS_COPY_SECTIONS)
  const featuredTestimonials = clientTestimonials.map((testimonial, index) => {
    const key = `testimonial${index + 1}`
    return {
      ...testimonial,
      companyName: copy[`${key}CompanyName`],
      headline: copy[`${key}Headline`],
      authorName: copy[`${key}AuthorName`],
      authorRole: copy[`${key}AuthorRole`],
      metricBadge: copy[`${key}MetricBadge`],
      industry: copy[`${key}Industry`],
      quote: copy[`${key}Quote`],
    }
  })
  let dbTestimonials: Testimonial[] = []
  let publishedArticles: Article[] = []
  let dbClients: Client[] | null = null
  let blogConfig: ClientsBlogConfig | null = null
  let siteFeaturedSlug: string | null = null
  try {
    const [
      testimonials,
      articlesResult,
      clientsResult,
      resolvedBlog,
      resolvedFeaturedSlug,
    ] = await Promise.all([
      getPublishedTestimonials(),
      getPublishedArticles({ page: 1, pageSize: 30 }),
      getVisibleClients(),
      getClientsBlogConfig(supabase),
      getFeaturedArticleSlug(supabase),
    ])
    dbTestimonials = testimonials
    publishedArticles = articlesResult.articles
    dbClients = clientsResult
    blogConfig = resolvedBlog
    siteFeaturedSlug = resolvedFeaturedSlug
  } catch {
    dbTestimonials = []
    publishedArticles = []
    dbClients = null
    blogConfig = await getClientsBlogConfig(supabase)
  }

  const partnerSource = dbClients ?? clientPartners
  const partnerProfiles: PartnerProfileItem[] = partnerSource.map(
    (partnerOrClient, index) => {
      const key = `partner${index + 1}`
      if ('is_visible' in partnerOrClient) {
        const c = partnerOrClient as Client
        return {
          id: c.id,
          name: c.name,
          badge: c.type_of_company || copy[`${key}Badge`] || 'Strategic Partner',
          industry:
            c.hero_domain ||
            c.type_of_company ||
            copy[`${key}Industry`] ||
            'Technology & Services',
          region:
            c.operational_base ||
            copy[`${key}Region`] ||
            'Global Distributed Hub',
          podCapability:
            c.dedicated_capability ||
            copy[`${key}PodCapability`] ||
            'Dedicated Team',
          tagline: c.tagline || copy[`${key}Tagline`] || '',
          description: c.description || copy[`${key}Description`] || '',
          website: c.website_url || '',
          social: c.linkedin_url || undefined,
          facebook: c.facebook_url || undefined,
          instagram: c.instagram_url || undefined,
          x: c.x_url || undefined,
          logoUrl: c.logo_url || undefined,
          logoType: getCompanyLogoType(c.name),
        }
      }
      const p = partnerOrClient as PartnerProfileItem
      return {
        ...p,
        name: copy[`${key}Name`] || p.name,
        badge: copy[`${key}Badge`] || p.badge,
        industry: copy[`${key}Industry`] || p.industry,
        region: copy[`${key}Region`] || p.region,
        podCapability: copy[`${key}PodCapability`] || p.podCapability,
        tagline: copy[`${key}Tagline`] || p.tagline,
        description: copy[`${key}Description`] || p.description,
      }
    },
  )

  const editorialArticles = featuredArticles
  const articleMap = new Map<string, Article>()
  for (const article of [...editorialArticles, ...publishedArticles]) {
    if (!articleMap.has(article.slug)) articleMap.set(article.slug, article)
  }
  const allArticles = [...articleMap.values()].sort(
    (a, b) =>
      new Date(b.published_at || b.created_at).getTime() -
      new Date(a.published_at || a.created_at).getTime(),
  )
  const featuredArticle = blogConfig.showFeaturedArticle
    ? blogConfig.featuredArticleMode === 'custom' &&
      blogConfig.featuredArticleSlug
      ? allArticles.find(
          (article) => article.slug === blogConfig.featuredArticleSlug,
        ) || allArticles[0]
      : (siteFeaturedSlug &&
          allArticles.find((article) => article.slug === siteFeaturedSlug)) ||
        allArticles[0]
    : undefined

  const heroBlogImage = resolveSafeBlogImageProps(blogConfig.heroImageUrl)
  const authorAvatarImage = resolveSafeBlogImageProps(blogConfig.authorAvatarUrl)
  const firstRichBlockId =
    blogConfig.blocks.find((block) => block.type === 'rich_text')?.id || null

  const fallbackMap = new Map<string, (typeof featuredTestimonials)[number]>()
  featuredTestimonials.forEach((item) => {
    fallbackMap.set(item.companyName.toLowerCase(), item)
    fallbackMap.set(item.authorName.toLowerCase(), item)
  })

  const mappedDbItems: CarouselTestimonialItem[] = dbTestimonials.map((dbItem) => {
    const compName =
      dbItem.client?.name || dbItem.author_company || 'Partner Enterprise'
    const fallbackItem =
      fallbackMap.get(compName.toLowerCase()) ||
      fallbackMap.get(dbItem.author_name.toLowerCase())

    const logoType =
      (!dbItem.client?.logo_url ? fallbackItem?.logoType : undefined) ||
      getCompanyLogoType(compName)

    return {
      id: dbItem.id,
      companyName: compName,
      headline:
        dbItem.headline ||
        fallbackItem?.headline ||
        'Exceptional Pod Performance & Velocity',
      quote: dbItem.quote,
      authorName: dbItem.author_name,
      authorRole: dbItem.author_role,
      companyId: dbItem.client_id || fallbackItem?.companyId || 'client-partner',
      logoType,
      logoUrl: dbItem.client?.logo_url || null,
      metricBadge: fallbackItem?.metricBadge || 'Verified Partner',
      industry: fallbackItem?.industry || 'Enterprise Client',
      rating: dbItem.rating ?? 5,
      photoUrl:
        dbItem.photo_url ||
        fallbackItem?.photoUrl ||
        '/images/testimonial-marcus-vance.jpg',
    }
  })

  const combinedTestimonials: CarouselTestimonialItem[] =
    mappedDbItems.length > 0 ? mappedDbItems : [...featuredTestimonials]

  return (
    <div className="clients-page">
      <ClientsRealtimeSync />
      <ClientsBlogRealtimeSync />
      <PageVisualRuntime page="clients" config={getPageVisualConfig(doc?.content)} />
      {/* 1. Enhanced Modern Hero Section with Interactive 3D Dotted Network Globe */}
      <ClientsGlobeHero
        title={doc?.title || CLIENT_PAGE_DEFAULTS.title}
        summary={doc?.summary || CLIENT_PAGE_DEFAULTS.summary}
        copy={copy}
      />

      {/* 2. Unified Showcase Band: Blog Playbooks + Client Testimonials + Partner Directory */}
      <div className="clients-showcase-band">
        {/* 2A. Editorial Client Insights & Methodology Blog Section */}
        <section
          className="clients-blog-section"
          aria-labelledby="clients-blog-heading"
        >
          <div className="container clients-blog-container">
            {/* Header: Date/Read Time Eyebrow, Editorial Title, and Lead Description */}
            <header className="clients-blog-header">
              <div className="clients-blog-meta">
                <span className="clients-blog-meta__date">
                  {blogConfig.publishedLabel}
                </span>
                <span className="clients-blog-meta__sep">—</span>
                <span className="clients-blog-meta__read-time">
                  {blogConfig.readTimeLabel}
                </span>
              </div>

              <h2 id="clients-blog-heading" className="clients-blog-title">
                {blogConfig.title}
              </h2>

              <p className="clients-blog-lead">{blogConfig.lead}</p>
            </header>

            {/* Widescreen Hero Featured Image Showcase (Optional & Removable) */}
            {heroBlogImage && (
              <div className="clients-blog-hero-showcase">
                <Image
                  src={heroBlogImage.src}
                  alt={
                    blogConfig.heroImageAlt ||
                    'OPG Global Pod Architecture and Distributed Operational Excellence'
                  }
                  width={1344}
                  height={756}
                  priority
                  className="clients-blog-hero-img"
                  unoptimized={heroBlogImage.unoptimized}
                />
                <div
                  className="clients-blog-hero-showcase__glare"
                  aria-hidden="true"
                />
              </div>
            )}

            {/* 2-Column Editorial Article Grid */}
            <div className="clients-blog-article-grid">
              {/* Left Column: Author, Social Share, Mini Related Card */}
              <aside
                className="clients-blog-sidebar"
                aria-label="Article metadata & share"
              >
                <div className="clients-blog-sidebar__section">
                  <span className="clients-blog-sidebar__label">
                    WRITTEN BY
                  </span>
                  <div className="clients-blog-author-card">
                    <div className="clients-blog-author-avatar">
                      {authorAvatarImage ? (
                        <Image
                          alt={blogConfig.authorName}
                          className="clients-blog-author-avatar__img"
                          fill
                          sizes="48px"
                          src={authorAvatarImage.src}
                          unoptimized={authorAvatarImage.unoptimized}
                        />
                      ) : (
                        <span>{blogConfig.authorMonogram || 'OPG'}</span>
                      )}
                    </div>
                    <div className="clients-blog-author-info">
                      <span className="clients-blog-author-name">
                        {blogConfig.authorName}
                      </span>
                      <span className="clients-blog-author-role">
                        {blogConfig.authorRole}
                      </span>
                    </div>
                  </div>
                </div>

                {blogConfig.showShareButtons && (
                  <div className="clients-blog-sidebar__section">
                    <span className="clients-blog-sidebar__label">
                      SHARE THIS
                    </span>
                    <BlogShareButtons />
                  </div>
                )}

                {/* Featured Article from Articles page */}
                {featuredArticle && (
                  <div className="clients-blog-sidebar-card">
                    <div className="clients-blog-sidebar-card__media">
                      {(() => {
                        const coverImg = resolveSafeArticleImage(
                          featuredArticle.cover_image_url,
                        )
                        return (
                          <Image
                            src={coverImg.src}
                            alt={featuredArticle.title}
                            fill
                            sizes="(max-width: 64rem) 100vw, 360px"
                            className="clients-blog-sidebar-card__img"
                            unoptimized={coverImg.unoptimized}
                          />
                        )
                      })()}
                      <span className="clients-blog-sidebar-card__tag">
                        {blogConfig.featuredArticleBadgeLabel ||
                          'Featured Article'}
                      </span>
                    </div>
                    <div className="clients-blog-sidebar-card__body">
                      <div className="clients-blog-sidebar-card__meta">
                        <span className="clients-blog-sidebar-card__date">
                          {formatArticleDate(
                            featuredArticle.published_at ||
                              featuredArticle.created_at,
                          )}
                        </span>
                        <span
                          className="clients-blog-sidebar-card__bullet"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <span className="clients-blog-sidebar-card__read-time">
                          {featuredArticle.reading_time_minutes} min read
                        </span>
                      </div>
                      <h4 className="clients-blog-sidebar-card__title">
                        {featuredArticle.title}
                      </h4>
                      {featuredArticle.excerpt && (
                        <p className="clients-blog-sidebar-card__excerpt">
                          {featuredArticle.excerpt}
                        </p>
                      )}
                      <Link
                        href={`/articles/${featuredArticle.slug}`}
                        className="clients-blog-sidebar-card__btn"
                      >
                        Read Article →
                      </Link>
                    </div>
                  </div>
                )}

                {/* View More Articles Link Button */}
                <Link
                  href="/articles"
                  className="clients-blog-sidebar__view-more-btn"
                >
                  <span>
                    {blogConfig.viewMoreArticlesLabel || 'View more articles'}
                  </span>
                  <span
                    aria-hidden="true"
                    className="clients-blog-sidebar__view-more-arrow"
                  >
                    →
                  </span>
                </Link>
              </aside>

              {/* Right Column: Dynamic Canva Canvas Blocks (Rich Text & Photo Banners) */}
              <div className="clients-blog-content">
                {blogConfig.blocks.map((block) => {
                  if (block.type === 'rich_text') {
                    return (
                      <ClientsBlogRichBlock
                        isLeadBlock={block.id === firstRichBlockId}
                        key={block.id}
                        markdown={block.markdown}
                      />
                    )
                  }

                  const imgProps = resolveSafeBlogImageProps(block.url)
                  if (!imgProps) return null

                  return (
                    <figure
                      className="clients-blog-secondary-figure"
                      key={block.id}
                    >
                      <div className="clients-blog-secondary-banner">
                        <Image
                          alt={block.alt || 'OPG Blog visual showcase'}
                          className="clients-blog-secondary-img"
                          height={480}
                          src={imgProps.src}
                          unoptimized={imgProps.unoptimized}
                          width={960}
                        />
                      </div>
                      {block.caption && (
                        <figcaption className="clients-blog-secondary-caption">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2B. Testimonials Header Block (Clean Header on Cream Background) */}
        <section
          className="clients-testimonials-header-section"
          aria-labelledby="clients-testimonials-heading"
        >
          <div className="container">
            <div className="clients-section-heading clients-section-heading--centered clients-testimonials-heading">
              <p className="eyebrow eyebrow--gold">
                {copy.testimonialsEyebrow}
              </p>
              <h2 id="clients-testimonials-heading">
                {copy.testimonialsTitle}
              </h2>
              <p>{copy.testimonialsLead}</p>
            </div>
          </div>
        </section>

        {/* 2C. Testimonials Carousel Section (Full-Width, Unnested) */}
        <section
          className="clients-testimonials-carousel-section"
          aria-label="Executive Client Endorsements Carousel"
        >
          <ClientsTestimonialCarousel testimonials={combinedTestimonials} />
        </section>

        {/* 2D. Partner Company Directory Section (Sticky Process Architecture matching About page) */}
        <section
          className="clients-directory"
          aria-labelledby="clients-directory-heading"
        >
          <ClientsPartnerProfiles partners={partnerProfiles} copy={copy} />
        </section>

        {/* 3. Conversion CTA: Continuous dotted field with a soft transition */}
        <section
          className="clients-cta"
          aria-label="Become an OPG client partner"
        >
          <div className="container">
            <div className="clients-cta__glass">
              {/* Dotted ASCII style map elements on bottom corners */}
              <ClientsCtaAsciiMapCorners />

              <div className="clients-cta__copy">
                <h2>{copy.ctaTitle}</h2>
                <p>{copy.ctaBody}</p>
              </div>
              <div className="clients-cta__actions">
                <ButtonLink href="/contact" className="clients-cta__button">
                  {copy.ctaPrimary}
                </ButtonLink>
                <ButtonLink
                  href="/about#what-we-offer"
                  variant="secondary"
                  className="clients-cta__button clients-cta__button--secondary"
                >
                  {copy.ctaSecondary}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
