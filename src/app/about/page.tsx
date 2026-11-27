import type { Metadata } from 'next'
import Image from 'next/image'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { AboutCtaCard } from '@/components/ui/about-cta-card'
import { AboutHeroSection } from '@/components/ui/about-hero-section'
import { AboutServicesSection } from '@/components/ui/about-services-section'
import { AboutTeamShowcase } from '@/components/ui/about-team-showcase'
import { AboutWhyWorkWithUsSection } from '@/components/ui/about-why-work-with-us-section'
import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { DotField } from '@/components/ui/dot-field'
import { MissionVisionSection } from '@/components/ui/mission-vision-section'
import { OffshoreMapSection } from '@/components/ui/offshore-map'
import { ResponsiveImage } from '@/components/ui/responsive-image'
import { TeamRealtimeSync } from '@/components/ui/team-realtime-sync'
import { TextLoop } from '@/components/ui/text-loop'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import type { PageDocument } from '@/lib/content/page-documents'
import { getAboutPageCopy } from '@/lib/content/page-copy'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { ABOUT_PAGE_DEFAULTS } from '@/lib/content/site-page-defaults'
import {
  getActiveDepartmentsWithMembers,
  getPublicTeamMembers,
} from '@/lib/content/team'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

import styles from './about.module.css'

export const dynamic = 'force-dynamic'

const ABOUT_IMAGE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/hero/rs-1789740267024.png'

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

  const [{ data: doc }, { data: legacyMission }, departments, teamMembers] =
    await Promise.all([
      supabase
        .from('page_documents')
        .select('*')
        .eq('slug', 'about')
        .eq('status', 'published')
        .maybeSingle<PageDocument>(),
      supabase
        .from('page_documents')
        .select('title, summary, content, status')
        .eq('slug', 'mission-and-vision')
        .eq('status', 'published')
        .maybeSingle<PageDocument>(),
      getActiveDepartmentsWithMembers(),
      getPublicTeamMembers(supabase),
    ])

  const heroTitle = doc?.title || ABOUT_PAGE_DEFAULTS.title
  const heroSummary = doc?.summary || ABOUT_PAGE_DEFAULTS.summary
  const defaults = getAboutPageCopy(null, null)
  const rawCopy = getAboutPageCopy(doc?.content, legacyMission)
  const hasLegacyServicesCopy =
    rawCopy.service1Title === 'Candidate Sourcing' ||
    rawCopy.servicesTitleAccent === 'Talent Acquisition' ||
    rawCopy.processTitle.includes('first search to long-term success')
  const hasLegacyValuesCopy =
    rawCopy.value1Name === 'Integrity' &&
    rawCopy.value1Description.includes('honesty, openness')
  const copy: Record<string, string> = {
    ...rawCopy,
    whoEyebrow:
      rawCopy.whoEyebrow === 'Who We Are' ? 'About Us' : rawCopy.whoEyebrow,
    whoTitle:
      rawCopy.whoTitle === 'Connecting Businesses with the Right People'
        ? 'Connecting Growing Businesses with the Right People'
        : rawCopy.whoTitle,
    ...(hasLegacyServicesCopy
      ? {
          servicesTitlePrefix: defaults.servicesTitlePrefix,
          servicesTitleAccent: defaults.servicesTitleAccent,
          servicesLead: defaults.servicesLead,
          processEyebrow: defaults.processEyebrow,
          processTitle: defaults.processTitle,
          processLead: defaults.processLead,
          service1Label: defaults.service1Label,
          service1Tag: defaults.service1Tag,
          service1Title: defaults.service1Title,
          service1Summary: defaults.service1Summary,
          service1Bullets: defaults.service1Bullets,
          service2Label: defaults.service2Label,
          service2Tag: defaults.service2Tag,
          service2Title: defaults.service2Title,
          service2Summary: defaults.service2Summary,
          service2Bullets: defaults.service2Bullets,
          service3Label: defaults.service3Label,
          service3Tag: defaults.service3Tag,
          service3Title: defaults.service3Title,
          service3Summary: defaults.service3Summary,
          service3Bullets: defaults.service3Bullets,
        }
      : {}),
    ...(hasLegacyValuesCopy
      ? {
          value1Name: defaults.value1Name,
          value1Description: defaults.value1Description,
          value2Name: defaults.value2Name,
          value2Description: defaults.value2Description,
          value3Name: defaults.value3Name,
          value3Description: defaults.value3Description,
          value4Name: defaults.value4Name,
          value4Description: defaults.value4Description,
          value5Name: defaults.value5Name,
          value5Description: defaults.value5Description,
        }
      : {}),
  }
  const story = (Array.isArray(doc?.content) ? doc.content : []).flatMap(
    (block) =>
      block.type === 'paragraph' && !block.key ? [block.content] : [],
  )
  const hasLegacyStory =
    story.length > 0 &&
    (story[0].includes('connect businesses with the right people') ||
      story.some((p) =>
        p.includes('More than filling roles, we build lasting partnerships'),
      ))
  const storyParagraphs =
    story.length > 0 && !hasLegacyStory
      ? story
      : ABOUT_PAGE_DEFAULTS.body.split(/\n\n+/)

  return (
    <main className="about-page">
      <TeamRealtimeSync />
      <PageVisualRuntime page="about" config={getPageVisualConfig(doc?.content)} />
      {/* 1. Hero Section - Bento Showcase */}
      <AboutHeroSection
        copy={copy}
        featuredMembers={teamMembers}
        heroTitle={heroTitle}
        heroSummary={heroSummary}
      />

      {/* Unified Showcase Band */}
      <div className="about-showcase-band about-showcase-band--who">
        {/* 2. Who Are We Section */}
        <section
          id="who-we-are"
          className="about-who-section"
          aria-labelledby="about-who-heading"
        >
          <div className="container">
            <div className={`about-who-section__header ${styles.whoHeader}`}>
              <div className="about-who-section__badge">
                <span className="eyebrow">{copy.whoEyebrow}</span>
              </div>
              <h2
                id="about-who-heading"
                className={`about-who-section__title ${styles.whoTitle}`}
              >
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
                {(() => {
                  const secondParagraph = storyParagraphs[1] || ''
                  const sentenceMatch = /^([^.!?]+[.!?])\s+(.*)$/.exec(
                    secondParagraph,
                  )
                  return sentenceMatch ? (
                    <p className="about-who-section__text">
                      <span className={styles.leadAccent}>
                        {sentenceMatch[1]}
                      </span>{' '}
                      {sentenceMatch[2]}
                    </p>
                  ) : (
                    <p className="about-who-section__text">{secondParagraph}</p>
                  )
                })()}
                {storyParagraphs.slice(2).map((paragraph, index) => (
                  <p className="about-who-section__text" key={index}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* React Bits Curved SVG Text Loop Ribbon */}
          <div className="about-text-loop-wrap">
            <TextLoop text="OUTSOURCED PRO GLOBAL" />
          </div>
        </section>

        {/* 2.2 Why Work With Us Section */}
        <AboutWhyWorkWithUsSection copy={copy} />
      </div>

      {/* 2.5 What We Offer (Talent Acquisition Services) Section */}
      <AboutServicesSection copy={copy} leadMember={teamMembers[0]} />

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
            frameless
            hideDotField
            layout="one-column"
            variant="detailed"
            showEyebrow={false}
            title={
              <>
                {copy.networkTitlePrefix} {copy.networkTitleAccent}
              </>
            }
            summary={copy.networkLead}
            copy={copy}
          />
        </section>
      </div>

      {/* 5. Team Showcase Section: 2-Column with 3D Depth Carousel (Our People) */}
      <AboutTeamShowcase copy={copy} members={teamMembers} />

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
                              (() => {
                                const safePhoto = resolveSafeArticleImage(
                                  member.photo_url,
                                )
                                return (
                                  <div className="team-card__avatar">
                                    <ResponsiveImage
                                      alt={`${member.full_name}, ${member.position}`}
                                      height={120}
                                      src={safePhoto.src}
                                      unoptimized={safePhoto.unoptimized}
                                      width={120}
                                    />
                                  </div>
                                )
                              })()
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

      {/* 6. Strategic Conversion CTA Section with Aurora-Toned Gradient Background */}
      <section aria-label="Get in Touch" className="about-cta-section">
        <DotField
          bulgeOnly={true}
          bulgeStrength={85}
          className="about-cta-section__dot-field"
          cursorRadius={460}
          dotRadius={2.4}
          dotSpacing={20}
          glowColor="#ffe773"
          glowRadius={220}
          gradientFrom="rgba(217, 130, 0, 0.78)"
          gradientTo="rgba(242, 175, 5, 0.68)"
          sparkle={true}
          waveAmplitude={2.5}
        />
        <div className="container about-cta-container">
          <AboutCtaCard copy={copy} />
        </div>
      </section>
    </main>
  )
}
