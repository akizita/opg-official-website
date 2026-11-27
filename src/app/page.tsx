import type { Metadata } from 'next'
import Image from 'next/image'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { Aurora } from '@/components/ui/aurora'
import { ButtonLink } from '@/components/ui/button-link'
import { DotField } from '@/components/ui/dot-field'
import { HomeCareersCarousel } from '@/components/home/home-careers-carousel'
import { HomeCandidateTestimonialsSection } from '@/components/home/home-candidate-testimonials-section'
import { HomeContactCtaSection } from '@/components/home/home-contact-cta-section'
import { HomeInitialScrollGuard } from '@/components/home/home-initial-scroll-guard'
import { HomeTeamMasonrySection } from '@/components/home/home-team-masonry-section'
import { HomeTestimonialsSection } from '@/components/home/home-testimonials-section'
import { OffshoreMapSection } from '@/components/ui/offshore-map'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { TeamRealtimeSync } from '@/components/ui/team-realtime-sync'
import type { PageDocument } from '@/lib/content/page-documents'
import { getHomeCandidateTestimonials } from '@/lib/content/home-candidate-testimonials'
import { getPageCopy, HOME_COPY_SECTIONS } from '@/lib/content/page-copy'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getPublicTeamMembers } from '@/lib/content/team'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getCareersFeed } from '@/lib/jazzhr/client'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

const ABOUT_IMAGE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/hero/rs-1789740267024.png'

const TRUSTED_CLIENT_LOGOS = [
  {
    id: 'compass',
    name: 'Compass',
    logoUrl:
      'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/compass_logo_white.png',
  },
  {
    id: 'fpi',
    name: 'FPI',
    logoUrl:
      'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/fpi_logo_white.png',
  },
] as const

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select(
      'title, summary, seo_title, seo_description, canonical_url, og_image_url, status',
    )
    .eq('slug', 'home')
    .eq('status', 'published')
    .maybeSingle<PageDocument>()
  const title = doc?.seo_title || doc?.title || siteConfig.name
  const description =
    doc?.seo_description || doc?.summary || siteConfig.description
  const url = doc?.canonical_url || getSiteUrl().toString()
  const indexable = isSiteIndexable()
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
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
    robots: { index: indexable, follow: indexable },
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ opgPreview?: string }>
}) {
  const { opgPreview } = await searchParams
  const supabase = await createClient()

  const [homeDoc, careersFeed, candidateTestimonials, teamMembers] =
    await Promise.all([
      getVisiblePageDocument(supabase, 'home', opgPreview === '1'),
      getCareersFeed().catch(() => ({
        configured: false,
        fetchedAt: null,
        jobs: [],
      })),
      getHomeCandidateTestimonials(4).catch(() => []),
      getPublicTeamMembers(supabase).catch(() => []),
    ])

  const heroTitle =
    homeDoc?.title || 'The right people can move every business forward.'
  const heroSummary =
    homeDoc?.summary ||
    'Outsourced Pro Global helps organizations build strong teams and helps professionals discover their next opportunity.'
  const copy = getPageCopy(homeDoc?.content, HOME_COPY_SECTIONS)

  return (
    <div className="home-snap-flow">
      <TeamRealtimeSync />
      <HomeInitialScrollGuard />
      <PageVisualRuntime page="home" config={getPageVisualConfig(homeDoc?.content)} />
      {/* Hero + Highlight Cards Viewport Frame */}
      <div className="home-hero-band">
        {/* Hero Section */}
        <section className="hero">
        {/* Full-width Aurora Wave */}
        <div aria-hidden="true" className="hero__aurora">
          <Aurora
            amplitude={0.8}
            blend={0.35}
            colorStops={['#ea580c', '#f29f04', '#f2b705', '#ffd000', '#f59e0b']}
            speed={1.0}
          />
        </div>

        <div aria-hidden="true" className="hero__scrim" />
        <div className="container hero__content">
          <p className="hero__eyebrow">{copy.heroBadge}</p>
          <h1>{heroTitle}</h1>
          <p className="hero__summary">{heroSummary}</p>
          <div
            aria-label="Choose your path"
            className="button-row hero__cta-row"
          >
            <ButtonLink href="/contact">{copy.heroPrimary}</ButtonLink>
            <ButtonLink href="/careers" variant="secondary">
              {copy.heroSecondary}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Hero Stats Divider Section (3 React Bits SpotlightCards) */}
      <section className="hero-stats-divider" aria-label="Key highlights">
        {/* Ambient Aurora Glow Patches */}
        <div
          aria-hidden="true"
          className="hero-stats__aurora-blob hero-stats__aurora-blob--left"
        />
        <div
          aria-hidden="true"
          className="hero-stats__aurora-blob hero-stats__aurora-blob--right"
        />

        <div className="container hero-stats-container">
          <div className="hero-stats-grid">
            {/* Card 1: Over 1000+ Talents */}
            <SpotlightCard className="stat-card">
              <div className="stat-card__badge-row">
                <span className="stat-card__icon-wrapper" aria-hidden="true">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
              </div>
              <div className="stat-card__metric">{copy.card1Metric}</div>
              <h3 className="stat-card__title">{copy.card1Title}</h3>
              <p className="stat-card__desc">{copy.card1Description}</p>
            </SpotlightCard>

            {/* Card 2: Over 3+ Years in Service */}
            <SpotlightCard className="stat-card">
              <div className="stat-card__badge-row">
                <span className="stat-card__icon-wrapper" aria-hidden="true">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
              </div>
              <div className="stat-card__metric">{copy.card2Metric}</div>
              <h3 className="stat-card__title">{copy.card2Title}</h3>
              <p className="stat-card__desc">{copy.card2Description}</p>
            </SpotlightCard>

            {/* Card 3: Client Trust & Retention */}
            <SpotlightCard className="stat-card">
              <div className="stat-card__badge-row">
                <span className="stat-card__icon-wrapper" aria-hidden="true">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m11 17 2 2a1 1 0 0 0 1.42 0l6.58-6.59a1 1 0 0 0 0-1.41l-2.58-2.59a1 1 0 0 0-1.42 0L15 10.59" />
                    <path d="m7 7 5 5" />
                    <path d="M14 6.5 12.5 5a1 1 0 0 0-1.42 0L4.17 11.91a1 1 0 0 0 0 1.41l2.59 2.59a1 1 0 0 0 1.41 0L10.5 13.5" />
                  </svg>
                </span>
              </div>
              <div className="stat-card__metric">{copy.card3Metric}</div>
              <h3 className="stat-card__title">{copy.card3Title}</h3>
              <p className="stat-card__desc">{copy.card3Description}</p>
            </SpotlightCard>
          </div>
        </div>
      </section>
      </div>

      {/* About Us Overview Section */}
      <section
        className="about-overview"
        aria-labelledby="about-overview-heading"
      >
        {/* Ambient Aurora Glow Patches */}
        <div
          aria-hidden="true"
          className="about-overview__aurora-blob about-overview__aurora-blob--left"
        />
        <div
          aria-hidden="true"
          className="about-overview__aurora-blob about-overview__aurora-blob--right"
        />

        <div className="container about-overview__grid">
          {/* Left Side: Team Image from Data Storage */}
          <div className="about-overview__visual">
            <div className="about-overview__image-glow" aria-hidden="true" />
            <div className="about-overview__image-container">
              <Image
                alt="Outsourced Pro Global team"
                className="about-overview__image"
                height={790}
                priority
                sizes="(max-width: 62rem) 100vw, 50vw"
                src={ABOUT_IMAGE_URL}
                width={1120}
              />
            </div>
          </div>

          {/* Right Side: About Us Header, Text Description, and Know More Button */}
          <div className="about-overview__content">
            <p className="eyebrow">{copy.aboutEyebrow}</p>
            <h2 id="about-overview-heading" className="about-overview__title">
              {copy.aboutTitle}
            </h2>
            <p className="about-overview__text">{copy.aboutBody}</p>
            <p className="about-overview__text about-overview__text--emphasis">
              {copy.aboutEmphasis}
            </p>
            <div className="about-overview__action">
              <ButtonLink className="about-overview__glass-btn" href="/about">
                {copy.aboutCta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Team Overview Section: 2-Column with Header/Copy and React Bits Masonry Gallery */}
      <section
        aria-label="Our Specialists and Leadership"
        className="about-team-band"
      >
        <HomeTeamMasonrySection members={teamMembers} />
      </section>

      {/* Global Showcase Band: Unified Background extending across Offshore Map */}
      <div className="global-showcase-band">
        <DotField
          dotRadius={2.4}
          dotSpacing={20}
          cursorRadius={460}
          bulgeOnly={true}
          bulgeStrength={85}
          glowRadius={220}
          waveAmplitude={2.5}
          sparkle={true}
          gradientFrom="rgba(217, 130, 0, 0.78)"
          gradientTo="rgba(242, 175, 5, 0.68)"
          glowColor="#ffe773"
          className="global-showcase-band__dot-field"
        />

        {/* Global Offshore Hub Overview Map Section */}
        <OffshoreMapSection
          hideDotField
          frameless
          layout="one-column"
          variant="overview"
          showEyebrow={false}
          showTabs={false}
          ctaHref="/about"
          ctaText={copy.networkCta}
          title={
            <>
              {copy.networkTitlePrefix} {copy.networkTitleAccent}
            </>
          }
          summary={copy.networkLead}
          copy={copy}
        />
      </div>

      {/* Careers Overview Section (Modern Carousel right after Global Reach) */}
      <HomeCareersCarousel initialJobs={careersFeed.jobs} />

      {/* Testimonials Section (Cascading Inspo Design right after Careers) */}
      <HomeTestimonialsSection />

      {/* Candidate Testimonials Section (Live stories synced with /testimonials) */}
      <HomeCandidateTestimonialsSection testimonials={candidateTestimonials} />

      {/* Strategic Contact Us CTA Section (Matching Inspo with DotField and Sweeping Golden Torus Arcs) */}
      <HomeContactCtaSection
        description={copy.ctaBody}
        primaryCtaText={copy.ctaPrimary}
        title={copy.ctaTitle}
      />

      {/* Social Proof Strip */}
      <section
        className="section section--proof"
        aria-label="Client Trust Banner"
      >
        <div className="container">
          <p className="proof-label">{copy.proofLabel}</p>
          <div className="proof-strip">
            {TRUSTED_CLIENT_LOGOS.map((client) => (
              <div className="proof-mark proof-mark--logo" key={client.id}>
                <span className="proof-mark__media">
                  <Image
                    alt={`${client.name} logo`}
                    className="proof-mark__img"
                    fill
                    sizes="(max-width: 640px) 140px, 180px"
                    src={client.logoUrl}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
