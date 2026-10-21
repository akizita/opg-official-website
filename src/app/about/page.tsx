import type { Metadata } from 'next'
import Image from 'next/image'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { AboutCtaCard } from '@/components/ui/about-cta-card'
import { AboutHeroGlobe } from '@/components/ui/about-hero-globe'
import { AboutServicesSection } from '@/components/ui/about-services-section'
import { AboutTeamShowcase } from '@/components/ui/about-team-showcase'
import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MissionVisionSection } from '@/components/ui/mission-vision-section'
import { Notice } from '@/components/ui/notice'
import { OffshoreMapSection } from '@/components/ui/offshore-map'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { getAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import { getAboutPageCopy } from '@/lib/content/page-copy'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { ABOUT_PAGE_DEFAULTS } from '@/lib/content/site-page-defaults'
import { getActiveDepartmentsWithMembers } from '@/lib/content/team'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

const ABOUT_IMAGE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/hero/rs-1789740267024.png'

const ABOUT_HERO_BG_URL = '/images/about-corporate-hero-mock.png'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select(
      'title, summary, seo_title, seo_description, canonical_url, og_image_url, status',
    )
    .eq('slug', 'about')
    .maybeSingle<PageDocument>()

  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/about', siteUrl).toString()

  const title = doc?.seo_title
    ? doc.seo_title
    : doc?.title
      ? `${doc.title} | ${siteConfig.shortName}`
      : `About Us | ${siteConfig.shortName}`

  const description =
    doc?.seo_description ||
    doc?.summary ||
    'Learn about Outsourced Pro Global, our mission, vision, core values, global offshore hubs, and leadership.'

  const isPublished = doc?.status === 'published'
  const indexable = isSiteIndexable() && (doc ? isPublished : true)

  return {
    title,
    description,
    alternates: {
      canonical: doc?.canonical_url || pageUrl,
    },
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

export default async function AboutPage() {
  const supabase = await createClient()
  const session = await getAdminSession()

  const [{ data: doc }, { data: legacyMission }, departments] =
    await Promise.all([
      supabase
        .from('page_documents')
        .select('*')
        .eq('slug', 'about')
        .maybeSingle<PageDocument>(),
      supabase
        .from('page_documents')
        .select('title, summary, content, status')
        .eq('slug', 'mission-and-vision')
        .eq('status', 'published')
        .maybeSingle<PageDocument>(),
      getActiveDepartmentsWithMembers(),
    ])

  const hasStaffAccess = session
    ? canViewContent(session.profile.roleKey)
    : false

  // If doc exists and is draft, require staff access
  if (doc && doc.status !== 'published' && !hasStaffAccess) {
    return (
      <main className="container status-page">
        <EmptyState
          action={<ButtonLink href="/">Return to Homepage</ButtonLink>}
          description="The official About Us statement is being updated and will be published shortly."
          title="About OPG Coming Soon"
        />
      </main>
    )
  }

  const isDraft = doc && doc.status !== 'published'

  const heroTitle = doc?.title || ABOUT_PAGE_DEFAULTS.title
  const heroSummary = doc?.summary || ABOUT_PAGE_DEFAULTS.summary
  const copy = getAboutPageCopy(doc?.content, legacyMission)
  const story = (Array.isArray(doc?.content) ? doc.content : []).flatMap(
    (block) =>
      block.type === 'paragraph' && !block.key ? [block.content] : [],
  )
  const storyParagraphs = story.length
    ? story
    : ABOUT_PAGE_DEFAULTS.body.split(/\n\n+/)

  const [summaryLead, summaryDetail] = heroSummary.includes('—')
    ? heroSummary.split('—').map((s) => s.trim())
    : [heroSummary, '']

  return (
    <main className="about-page">
      <PageVisualRuntime page="about" config={getPageVisualConfig(doc?.content)} />
      {/* 1. Hero Section */}
      <section className="about-hero-banner" aria-labelledby="about-hero-title">
        <div aria-hidden="true" className="about-hero-banner__bg">
          <div className="about-hero-banner__overlay" />
          <div className="about-hero-banner__glow" />
          <AboutHeroGlobe />
        </div>

        <div className="container about-hero-banner__container">
          {/* Keep draft feedback visible without breaking the hero/nav overlap. */}
          {isDraft && hasStaffAccess && (
            <Notice
              className="about-hero-banner__preview"
              title="Internal Preview Mode"
              variant="warning"
            >
              You are viewing the About page in staff preview mode. Status:{' '}
              <strong>{doc.status}</strong> (v{doc.version}).
            </Notice>
          )}
          <div className="about-hero-banner__grid">
            <div className="about-hero-banner__left">
              <div className="about-hero-banner__badge" role="text">
                <span
                  aria-hidden="true"
                  className="about-hero-banner__badge-dot"
                />
                <span>{copy.heroBadge}</span>
              </div>

              <h1 id="about-hero-title" className="about-hero-banner__title">
                {heroTitle.toLowerCase().startsWith('about ') ? (
                  <>
                    <span className="about-hero-banner__title-prefix">
                      About
                    </span>{' '}
                    <span className="about-hero-banner__title-accent">
                      {heroTitle.slice(6)}
                    </span>
                  </>
                ) : (
                  <span className="about-hero-banner__title-prefix">
                    {heroTitle}
                  </span>
                )}
              </h1>

              <p className="about-hero-banner__lead">
                <span className="about-hero-banner__lead-primary">
                  {summaryLead}
                </span>
                {summaryDetail && (
                  <span className="about-hero-banner__lead-secondary">
                    {summaryDetail}
                  </span>
                )}
              </p>

              <div className="about-hero-banner__actions">
                <ButtonLink
                  className="about-hero-banner__primary-action"
                  href="/contact"
                >
                  {copy.heroCta}
                  <span aria-hidden="true">↗</span>
                </ButtonLink>
                <a
                  className="about-hero-banner__scroll-indicator"
                  href="#who-we-are"
                >
                  <span className="about-hero-banner__scroll-text">
                    {copy.heroScroll}
                  </span>
                  <span
                    aria-hidden="true"
                    className="about-hero-banner__scroll-icon"
                  >
                    <svg
                      fill="none"
                      height="16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      width="16"
                    >
                      <path d="M7 10l5 5 5-5" />
                    </svg>
                  </span>
                </a>
              </div>

              <dl
                className="about-hero-banner__proof"
                aria-label="OPG at a glance"
              >
                <div>
                  <dt>{copy.heroProof1Value}</dt>
                  <dd>{copy.heroProof1Label}</dd>
                </div>
                <div>
                  <dt>{copy.heroProof2Value}</dt>
                  <dd>{copy.heroProof2Label}</dd>
                </div>
                <div>
                  <dt>{copy.heroProof3Value}</dt>
                  <dd>{copy.heroProof3Label}</dd>
                </div>
              </dl>
            </div>

            <div className="about-hero-banner__media">
              <Image
                alt="A global business team collaborating around a conference table"
                className="about-hero-banner__image"
                fill
                priority
                sizes="(max-width: 62rem) 100vw, 48vw"
                src={ABOUT_HERO_BG_URL}
              />
              <div
                aria-hidden="true"
                className="about-hero-banner__media-overlay"
              />
              <div className="about-hero-banner__media-caption">
                <span>{copy.heroCaption}</span>
                <strong>{copy.heroCaptionStrong}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Showcase Band */}
      <div className="about-showcase-band about-showcase-band--who">
        {/* 2. Who Are We Section */}
        <section
          id="who-we-are"
          className="about-who-section"
          aria-labelledby="about-who-heading"
        >
          <div className="container">
            <div className="about-who-section__header">
              <div className="about-who-section__badge">
                <span className="eyebrow">{copy.whoEyebrow}</span>
              </div>
              <h2 id="about-who-heading" className="about-who-section__title">
                {copy.whoTitle}
              </h2>
            </div>

            <div className="about-who-section__grid">
              {/* Left: OPG Team Visual (No glow/shadow, soft-blended bottom edge) */}
              <div className="about-who-section__visual">
                <div className="about-who-section__frame">
                  <Image
                    alt="Outsourced Pro Global leadership and core talent team"
                    className="about-who-section__image"
                    height={790}
                    priority
                    sizes="(max-width: 62rem) 100vw, 48vw"
                    src={ABOUT_IMAGE_URL}
                    width={1120}
                  />
                </div>
              </div>

              {/* Right: Narrative & Highlights */}
              <div className="about-who-section__content">
                <p className="about-who-section__text">{storyParagraphs[0]}</p>
                <p className="about-who-section__text about-who-section__text--highlight">
                  {storyParagraphs[1]}
                </p>
                {storyParagraphs.slice(2).map((paragraph, index) => (
                  <p className="about-who-section__text" key={index}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Centered Individual Spotlight Metric Cards Grid */}
            <div className="about-metrics-grid">
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
      </div>

      {/* 2.5 What We Offer (Talent Acquisition Services) Section */}
      <AboutServicesSection copy={copy} />

      {/* Unified Showcase Band: Mission/Vision & Map */}
      <div className="about-showcase-band about-showcase-band--purpose-map">
        {/* 3. Mission, Vision & Core Values Section */}
        <section
          id="our-purpose"
          className="about-purpose-section"
          aria-label="Mission, Vision and Core Values"
        >
          <MissionVisionSection copy={copy} />
        </section>

        {/* 4. Detailed One-Column Interactive Map Section with Operational Pillars */}
        <section
          className="about-map-section"
          aria-label="Global Offshore Network"
        >
          <OffshoreMapSection
            hideDotField
            layout="one-column"
            variant="detailed"
            showEyebrow={false}
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
        </section>

        {/* 5. Team Showcase Section: 2-Column with 3D Depth Carousel (Our People) */}
        <AboutTeamShowcase copy={copy} />

        {/* 5.1 Leadership & Departments Directory (if available) */}
        {departments.length > 0 && (
          <section
            aria-label="Leadership and Departments"
            className="about-team-section"
          >
            <div className="container">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{copy.directoryEyebrow}</p>
                  <h2>{copy.directoryTitle}</h2>
                </div>
                <ButtonLink href="/careers" variant="secondary">
                  {copy.directoryCta}
                </ButtonLink>
              </div>

              <div className="departments-list">
                {departments.map((dept) => (
                  <div className="department-group" key={dept.id}>
                    <h3 className="department-group__title">{dept.name}</h3>
                    {dept.members.length > 0 ? (
                      <div className="team-grid">
                        {dept.members.map((member) => (
                          <Card
                            className="team-card"
                            eyebrow={member.position}
                            key={member.id}
                            title={member.full_name}
                          >
                            {member.photo_url && (
                              <div className="team-card__avatar">
                                <ResponsiveImage
                                  alt={`${member.full_name}, ${member.position}`}
                                  height={120}
                                  src={member.photo_url}
                                  width={120}
                                />
                              </div>
                            )}
                            {member.bio && (
                              <p className="team-card__bio">{member.bio}</p>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="department-group__empty">
                        {copy.directoryEmpty}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* 6. Strategic Conversion CTA Section with Aurora-Toned Gradient Background */}
      <section aria-label="Get in Touch" className="about-cta-section">
        <div className="container about-cta-container">
          <AboutCtaCard copy={copy} />
        </div>
      </section>
    </main>
  )
}
