import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

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
import { DotField } from '@/components/ui/dot-field'
import {
  getPublishedTestimonials,
  type Testimonial,
} from '@/lib/content/clients'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

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

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/clients', siteUrl).toString()
  const title = `Clients & Strategic Partnerships | ${siteConfig.shortName}`
  const description =
    'Discover the forward-thinking organizations that partner with Outsource Pro Global to build dedicated offshore talent pods, scale operations, and accelerate sustainable growth.'
  const indexable = isSiteIndexable()

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
  }
}

export default async function ClientsPage() {
  let dbTestimonials: Testimonial[] = []
  try {
    dbTestimonials = await getPublishedTestimonials()
  } catch {
    dbTestimonials = []
  }

  const combinedTestimonials: CarouselTestimonialItem[] = [
    ...clientTestimonials,
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
      {/* 1. Enhanced Modern Hero Section with Interactive 3D Dotted Network Globe & Featured Partner Cards Dock */}
      <ClientsGlobeHero />

      {/* 2. Unified Showcase Band: Interactive DotField + Blog Playbooks + Client Testimonials + Partner Directory */}
      <div className="clients-showcase-band">
        <DotField
          dotRadius={2.4}
          dotSpacing={22}
          cursorRadius={460}
          bulgeOnly={true}
          bulgeStrength={80}
          glowRadius={220}
          waveAmplitude={2.2}
          sparkle={true}
          gradientFrom="rgba(217, 130, 0, 0.72)"
          gradientTo="rgba(242, 175, 5, 0.62)"
          glowColor="#ffe773"
        />

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
                  Published Autumn 2026
                </span>
                <span className="clients-blog-meta__sep">—</span>
                <span className="clients-blog-meta__read-time">5 min read</span>
              </div>

              <h2 id="clients-blog-heading" className="clients-blog-title">
                How OPG Handles Client Partnerships: Inside Our High-Touch Pod
                Governance &amp; Client Archetypes
              </h2>

              <p className="clients-blog-lead">
                In the ever-evolving distributed economy, ambitious
                organizations must move beyond transactional staffing to
                captivate markets and drive sustainable growth. At the heart of
                this transformation lies the power of dedicated, high-retention
                offshore talent pods.
              </p>
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
                        OPG Strategic Advisory
                      </span>
                      <span className="clients-blog-author-role">
                        Global Pod Operations
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
                      OCTOBER 2026 — 4 MIN READ
                    </span>
                    <h4 className="clients-blog-sidebar-card__title">
                      The Future of Dedicated Talent: Pod Economics &amp;
                      Retention Playbooks
                    </h4>
                    <Link
                      href="/articles"
                      className="clients-blog-sidebar-card__btn"
                    >
                      Read Now
                    </Link>
                  </div>
                </div>

                {/* At-a-Glance Partnership Stats */}
                <div className="clients-blog-sidebar-stats">
                  <div className="clients-blog-stat-item">
                    <span className="clients-blog-stat-val">98%</span>
                    <span className="clients-blog-stat-lbl">
                      Partner Retention
                    </span>
                  </div>
                  <div className="clients-blog-stat-item">
                    <span className="clients-blog-stat-val">4+ Hrs</span>
                    <span className="clients-blog-stat-lbl">
                      Daily Timezone Overlap
                    </span>
                  </div>
                  <div className="clients-blog-stat-item">
                    <span className="clients-blog-stat-val">14 Days</span>
                    <span className="clients-blog-stat-lbl">
                      Zero-Friction Ramp
                    </span>
                  </div>
                </div>
              </aside>

              {/* Right Column: Editorial Article Body */}
              <div className="clients-blog-content">
                <p className="clients-blog-paragraph clients-blog-paragraph--lead">
                  In the modern digital landscape, businesses must stay ahead of
                  the curve to captivate their target audience and drive
                  operational expansion. Enter Outsource Pro Global—a dedicated
                  operating partner that empowers founders and department
                  leaders to scale their vision with unprecedented velocity and
                  precision. In this playbook, we explore how our pod model is
                  revolutionizing offshore management and why it has become the
                  tool of choice for market leaders.
                </p>

                <h3 className="clients-blog-h3">
                  The Power of OPG: Unleashing Operational Velocity
                </h3>
                <p className="clients-blog-paragraph">
                  OPG is more than just a remote staffing agency; it is an
                  integrated operational platform that merges rigorous vetting,
                  hands-on governance, and culture alignment into a seamless
                  workflow. Here is how Outsource Pro Global handles client
                  partnerships:
                </p>

                <ol className="clients-blog-feature-list">
                  <li>
                    <strong>Dedicated Pod Delivery Leads:</strong> Every client
                    is paired with an embedded Pod Delivery Lead who manages
                    daily ceremonies, resolves logistical blockers, and
                    guarantees continuous communication alignment between
                    onshore stakeholders and offshore specialists.
                  </li>
                  <li>
                    <strong>Synchronized Timezone Overlap:</strong> In a
                    fast-paced market, real-time collaboration is
                    non-negotiable. We configure a guaranteed 4-hour core
                    overlap with your primary operating timezone (US, UK,
                    Australasia, or EMEA), eliminating frustrating 24-hour
                    feedback delays.
                  </li>
                  <li>
                    <strong>Custom Workflows &amp; Tooling Integration:</strong>{' '}
                    With OPG, adding high-caliber specialists to your existing
                    stack is effortless. Our pods embed natively into your
                    Slack, Jira, GitHub, Linear, and internal ERP systems
                    without forcing you to adapt to rigid vendor software.
                  </li>
                  <li>
                    <strong>
                      Transparent Governance &amp; Bi-Weekly KPI Reviews:
                    </strong>{' '}
                    Real-time metric transparency allows for dynamic iteration.
                    We provide bi-weekly sprint dashboards tracking velocity,
                    accuracy, and SLA adherence, reinforced by quarterly
                    executive reviews.
                  </li>
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

                <h3 className="clients-blog-h3">
                  Who Are Our Clients? The Anatomy of an OPG Partner
                </h3>
                <p className="clients-blog-paragraph">
                  We are deeply intentional about the organizations we partner
                  with. OPG builds dedicated teams for businesses where talent
                  quality, security discipline, and operational longevity
                  directly impact enterprise valuation:
                </p>

                <ol className="clients-blog-feature-list">
                  <li>
                    <strong>High-Growth Technology &amp; SaaS:</strong>{' '}
                    Venture-backed scaleups scaling distributed engineering
                    pods, automated QA, cloud DevOps, and technical support
                    without Silicon Valley burn rates.
                  </li>
                  <li>
                    <strong>Digital Health &amp; Telehealth Innovators:</strong>{' '}
                    Healthcare networks requiring HIPAA-compliant 24/7 care
                    coordination, patient triage support, and compassionate
                    clinical workflow management.
                  </li>
                  <li>
                    <strong>Fintech &amp; Asset Management Platforms:</strong>{' '}
                    Regulated financial firms that require strict SOC 2
                    compliance, quantitative modeling, AML/KYC verification, and
                    algorithmic settlement operations.
                  </li>
                  <li>
                    <strong>Omnichannel E-Commerce &amp; Logistics:</strong>{' '}
                    High-volume marketplace brands needing 24/7 catalog feeds,
                    multi-hub vendor reconciliation, and global customer
                    retention.
                  </li>
                  <li>
                    <strong>
                      Multinational Consultancies &amp; Shared Services:
                    </strong>{' '}
                    Corporate advisory firms seeking automated business
                    intelligence, financial modeling, and resilient shared
                    operating pipelines.
                  </li>
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
                Verified Executive Endorsements
              </p>
              <h2 id="clients-testimonials-heading">
                Hear from Brands That Trust Us
              </h2>
              <p>
                Our clients&rsquo; success stories showcase the value we bring
                to every project. Here&rsquo;s what they have to say about
                working with us.
              </p>
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
          <ClientsPartnerProfiles partners={clientPartners} />
        </section>
      </div>

      {/* 3. Conversion CTA: Liquid Glass Card, Amber Ambient Glow, Action Buttons */}
      <section
        className="clients-cta"
        aria-label="Become an OPG client partner"
      >
        <div className="container">
          <div className="clients-cta__glass">
            <div className="clients-cta__copy">
              <p className="eyebrow eyebrow--light">Build With OPG</p>
              <h2>Ready to Build Your Dedicated Offshore Team?</h2>
              <p>
                Whether you need specialized software engineers, 24/7 customer
                support champions, or compliance professionals, OPG designs
                bespoke offshore pods ready to deliver from day one.
              </p>
            </div>
            <div className="clients-cta__actions">
              <ButtonLink href="/contact" className="clients-cta__button">
                Start a Conversation
              </ButtonLink>
              <ButtonLink
                href="/services"
                variant="secondary"
                className="clients-cta__button clients-cta__button--secondary"
              >
                Explore Pod Services
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
