import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { Aurora } from '@/components/ui/aurora'
import { ButtonLink } from '@/components/ui/button-link'
import { DotField } from '@/components/ui/dot-field'
import { OffshoreMapSection } from '@/components/ui/offshore-map'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { Threads } from '@/components/ui/threads'
import {
  getPublishedTestimonials,
  getVisibleClients,
} from '@/lib/content/clients'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPageCopy, HOME_COPY_SECTIONS } from '@/lib/content/page-copy'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

const ABOUT_IMAGE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/hero/rs-1789740267024.png'

export const revalidate = 3600 // 1 hour ISR

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

  const [homeDoc, clients, testimonials] = await Promise.all([
    getVisiblePageDocument(supabase, 'home', opgPreview === '1'),
    getVisibleClients(),
    getPublishedTestimonials(),
  ])

  const heroTitle =
    homeDoc?.title || 'The right people can move every business forward.'
  const heroSummary =
    homeDoc?.summary ||
    'Outsourced Pro Global helps organizations build strong teams and helps professionals discover their next opportunity.'
  const copy = getPageCopy(homeDoc?.content, HOME_COPY_SECTIONS)

  const featuredTestimonial = testimonials[0]

  return (
    <>
      <PageVisualRuntime page="home" config={getPageVisualConfig(homeDoc?.content)} />
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
          <div className="hero__badge" role="text">
            <span aria-hidden="true" className="hero__badge-dot" />
            <span>{copy.heroBadge}</span>
          </div>
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
                <span className="stat-card__tag">{copy.card1Tag}</span>
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
                <span className="stat-card__tag">{copy.card2Tag}</span>
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
                <span className="stat-card__tag">{copy.card3Tag}</span>
              </div>
              <div className="stat-card__metric">{copy.card3Metric}</div>
              <h3 className="stat-card__title">{copy.card3Title}</h3>
              <p className="stat-card__desc">{copy.card3Description}</p>
            </SpotlightCard>
          </div>
        </div>
      </section>

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
              <ButtonLink href="/about">{copy.aboutCta}</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Global Showcase Band: Unified Background extending across Offshore Map, Mission, Vision & Core Values */}
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
          layout="two-column"
          variant="overview"
          ctaHref="/about"
          ctaText={copy.networkCta}
          title={
            <>
              {copy.networkTitlePrefix}{' '}
              <span className="offshore-hub__title-accent">
                {copy.networkTitleAccent}
              </span>
            </>
          }
          summary={copy.networkLead}
          copy={copy}
        />
      </div>

      {/* Social Proof Strip */}
      {clients.length > 0 && (
        <section
          className="section section--proof"
          aria-label="Client Trust Banner"
        >
          <div className="container">
            <p className="proof-label">{copy.proofLabel}</p>
            <div className="proof-strip">
              {clients.slice(0, 5).map((client) => (
                <span className="proof-mark" key={client.id}>
                  {client.name}
                </span>
              ))}
              <Link className="proof-link" href="/clients">
                {copy.proofCta}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Testimonial Quote */}
      {featuredTestimonial && (
        <section
          className="section section--ink"
          aria-labelledby="testimonial-heading"
        >
          <div className="container split-panel">
            <div>
              <p className="eyebrow eyebrow--light">
                {copy.testimonialEyebrow}
              </p>
              <h2 id="testimonial-heading">
                &ldquo;{featuredTestimonial.quote}&rdquo;
              </h2>
              <p className="testimonial-author">
                — {featuredTestimonial.author_name},{' '}
                {featuredTestimonial.author_role} (
                {featuredTestimonial.author_company})
              </p>
            </div>
            <div>
              <p>{copy.testimonialBody}</p>
              <ButtonLink href="/clients" variant="secondary">
                {copy.testimonialCta}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* Final Dual-Conversion CTA Section — Liquid Glass + Photo Layout */}
      <section className="cta-section" aria-labelledby="cta-heading">
        <div aria-hidden="true" className="cta-section__threads">
          <Threads
            color={[1, 1, 1]}
            amplitude={1.35}
            distance={0.25}
            enableMouseInteraction={true}
          />
        </div>
        <div className="container cta-section__container">
          <div className="cta-liquid-card">
            {/* Left: Photo Panel */}
            <div className="cta-liquid-card__photo" aria-hidden="true">
              <Image
                src="https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/logo-1789740351319.png"
                alt="Outsource Pro Global"
                fill
                className="cta-liquid-card__img"
                sizes="(max-width: 62rem) 100vw, 45vw"
              />
              {/* Liquid glass glare overlay on photo */}
              <div
                aria-hidden="true"
                className="cta-liquid-card__photo-glare"
              />
            </div>

            {/* Right: Content Panel */}
            <div className="cta-liquid-card__body">
              <div className="cta-glass-card__badge">
                <span
                  aria-hidden="true"
                  className="cta-glass-card__badge-dot"
                />
                <span>{copy.ctaEyebrow}</span>
              </div>
              <h2
                id="cta-heading"
                className="cta-liquid-card__title"
                style={{ whiteSpace: 'pre-line' }}
              >
                {copy.ctaTitle}
              </h2>
              <p className="cta-liquid-card__desc">{copy.ctaBody}</p>
              <div className="cta-liquid-card__actions">
                <ButtonLink
                  href="/contact"
                  className="cta-pill-btn cta-pill-btn--primary"
                >
                  {copy.ctaPrimary}
                </ButtonLink>
                <ButtonLink
                  href="/careers"
                  variant="secondary"
                  className="cta-pill-btn cta-pill-btn--ghost"
                >
                  {copy.ctaSecondary}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
