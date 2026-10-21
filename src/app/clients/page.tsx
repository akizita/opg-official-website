import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { BlogShareButtons } from '@/components/ui/blog-share-buttons'
import { ButtonLink } from '@/components/ui/button-link'
import type { ClientLogoType } from '@/components/ui/client-logo'
import {
  ClientsPartnerProfiles,
  type PartnerProfileItem,
} from '@/components/ui/clients-partner-profiles'
import {
  ClientsTestimonialCarousel,
  type CarouselTestimonialItem,
} from '@/components/ui/clients-testimonial-carousel'
import { ClientsGlobeHero } from '@/components/ui/clients-globe-hero'
import {
  getPublishedTestimonials,
  type Testimonial,
} from '@/lib/content/clients'
import {
  CLIENT_PAGE_DEFAULTS,
  extractClientPageContent,
} from '@/lib/content/client-page'
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
      'Outsource Pro Global integrated seamlessly into our GitHub and Jira workflows within two weeks. Their QA and full-stack engineering pod didn’t just execute sprint tickets—they overhauled our automated CI/CD pipeline, reducing release regression cycles by 65%. It feels like having our own senior in-house engineers down the hall.',
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

function ArticleListItem({ text }: { text: string }) {
  const separator = text.indexOf(': ')
  if (separator < 0) return <li>{text}</li>
  return (
    <li>
      <strong>{text.slice(0, separator + 1)}</strong>{' '}
      {text.slice(separator + 2)}
    </li>
  )
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
    'Discover the forward-thinking organizations that partner with Outsource Pro Global to build dedicated offshore talent pods, scale operations, and accelerate sustainable growth.'
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

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ opgPreview?: string }>
}) {
  const { opgPreview } = await searchParams
  const supabase = await createClient()
  const doc = await getVisiblePageDocument(supabase, 'clients', opgPreview === '1')
  const editorial = extractClientPageContent(doc?.content)
  const copy = getPageCopy(doc?.content, CLIENTS_COPY_SECTIONS)
  const partnerProfiles = clientPartners.map((partner, index) => {
    const key = `partner${index + 1}`
    return {
      ...partner,
      name: copy[`${key}Name`],
      badge: copy[`${key}Badge`],
      industry: copy[`${key}Industry`],
      region: copy[`${key}Region`],
      podCapability: copy[`${key}PodCapability`],
      talentCount: copy[`${key}TalentCount`],
      tagline: copy[`${key}Tagline`],
      description: copy[`${key}Description`],
    }
  })
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
  try {
    dbTestimonials = await getPublishedTestimonials()
  } catch {
    dbTestimonials = []
  }

  const combinedTestimonials: CarouselTestimonialItem[] = [
    ...featuredTestimonials,
    ...dbTestimonials.map((dbItem) => ({
      id: dbItem.id,
      companyName: dbItem.author_company || 'Partner Enterprise',
      headline: 'Exceptional Pod Performance & Velocity',
      quote: dbItem.quote,
      authorName: dbItem.author_name,
      authorRole: dbItem.author_role,
      companyId: 'client-partner',
      logoType: 'northstar' as ClientLogoType,
      metricBadge: 'Verified Partner',
      industry: 'Enterprise Client',
      rating: 5,
      photoUrl: '/images/testimonial-marcus-vance.jpg',
    })),
  ]

  return (
    <div className="clients-page">
      <PageVisualRuntime page="clients" config={getPageVisualConfig(doc?.content)} />
      {/* 1. Enhanced Modern Hero Section with Interactive 3D Dotted Network Globe & Featured Partner Cards Dock */}
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
                  {copy.articleDate}
                </span>
                <span className="clients-blog-meta__sep">—</span>
                <span className="clients-blog-meta__read-time">
                  {copy.articleReadTime}
                </span>
              </div>

              <h2 id="clients-blog-heading" className="clients-blog-title">
                {editorial.editorialTitle}
              </h2>

              <p className="clients-blog-lead">{editorial.editorialLead}</p>
            </header>

            {/* Widescreen Hero Featured Image Showcase */}
            <div className="clients-blog-hero-showcase">
              <Image
                src="/images/clients-blog-hero.jpg"
                alt="OPG Global Pod Architecture and Distributed Operational Excellence"
                width={1344}
                height={756}
                priority
                className="clients-blog-hero-img"
              />
              <div
                className="clients-blog-hero-showcase__glare"
                aria-hidden="true"
              />
            </div>

            {/* 2-Column Editorial Article Grid */}
            <div className="clients-blog-article-grid">
              {/* Left Column: Author, Social Share, Mini Related Card, Quick Metrics */}
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
                      <span>OPG</span>
                    </div>
                    <div className="clients-blog-author-info">
                      <span className="clients-blog-author-name">
                        {copy.authorName}
                      </span>
                      <span className="clients-blog-author-role">
                        {copy.authorRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="clients-blog-sidebar__section">
                  <span className="clients-blog-sidebar__label">
                    SHARE THIS
                  </span>
                  <BlogShareButtons />
                </div>

                {/* Mini Related Playbook Card */}
                <div className="clients-blog-sidebar-card">
                  <div className="clients-blog-sidebar-card__media">
                    <Image
                      src="/images/opg-3d-centerpiece.jpg"
                      alt="Dedicated Talent Economics"
                      width={400}
                      height={225}
                      className="clients-blog-sidebar-card__img"
                    />
                  </div>
                  <div className="clients-blog-sidebar-card__body">
                    <span className="clients-blog-sidebar-card__date">
                      {copy.relatedDate}
                    </span>
                    <h4 className="clients-blog-sidebar-card__title">
                      {copy.relatedTitle}
                    </h4>
                    <Link
                      href="/articles"
                      className="clients-blog-sidebar-card__btn"
                    >
                      {copy.relatedCta}
                    </Link>
                  </div>
                </div>

                {/* At-a-Glance Partnership Stats */}
                <div className="clients-blog-sidebar-stats">
                  <div className="clients-blog-stat-item">
                    <span className="clients-blog-stat-val">
                      {copy.stat1Value}
                    </span>
                    <span className="clients-blog-stat-lbl">
                      {copy.stat1Label}
                    </span>
                  </div>
                  <div className="clients-blog-stat-item">
                    <span className="clients-blog-stat-val">
                      {copy.stat2Value}
                    </span>
                    <span className="clients-blog-stat-lbl">
                      {copy.stat2Label}
                    </span>
                  </div>
                  <div className="clients-blog-stat-item">
                    <span className="clients-blog-stat-val">
                      {copy.stat3Value}
                    </span>
                    <span className="clients-blog-stat-lbl">
                      {copy.stat3Label}
                    </span>
                  </div>
                </div>
              </aside>

              {/* Right Column: Editorial Article Body */}
              <div className="clients-blog-content">
                <p className="clients-blog-paragraph clients-blog-paragraph--lead">
                  {copy.articleIntro}
                </p>

                <h3 className="clients-blog-h3">{copy.articleSection1Title}</h3>
                <p className="clients-blog-paragraph">
                  {copy.articleSection1Body}
                </p>

                <ol className="clients-blog-feature-list">
                  {copy.articleSection1Items
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((item, index) => (
                      <ArticleListItem key={index} text={item} />
                    ))}
                </ol>

                {/* Secondary Featured Visual Ribbon Banner */}
                <div className="clients-blog-secondary-banner">
                  <Image
                    src="/images/clients-blog-secondary.jpg"
                    alt="OPG Fluid Collaboration and Infinite Scalability"
                    width={960}
                    height={480}
                    className="clients-blog-secondary-img"
                  />
                </div>

                <h3 className="clients-blog-h3">{copy.articleSection2Title}</h3>
                <p className="clients-blog-paragraph">
                  {copy.articleSection2Body}
                </p>

                <ol className="clients-blog-feature-list">
                  {copy.articleSection2Items
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((item, index) => (
                      <ArticleListItem key={index} text={item} />
                    ))}
                </ol>
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
              <div className="clients-cta__copy">
                <div className="clients-cta__eyebrow-row">
                  <span aria-hidden="true" />
                  <p className="eyebrow eyebrow--light">{copy.ctaEyebrow}</p>
                  <span aria-hidden="true" />
                </div>
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
