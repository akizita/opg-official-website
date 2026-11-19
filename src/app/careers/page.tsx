import type { Metadata } from 'next'

import { CareerOpeningsExplorer } from '@/app/careers/career-openings-explorer'
import {
  ApplicationSteps,
  RecruitmentCTA,
} from '@/app/careers/careers-sections'
import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { Notice } from '@/components/ui/notice'
import { CAREERS_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getCareersFeed } from '@/lib/jazzhr/client'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

import styles from './careers.module.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CareersPageProps = {
  searchParams: Promise<{ opgPreview?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select(
      'title, seo_title, seo_description, canonical_url, og_image_url, status',
    )
    .eq('slug', 'careers')
    .eq('status', 'published')
    .maybeSingle<PageDocument>()
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/careers', siteUrl).toString()

  return {
    title:
      doc?.seo_title ||
      doc?.title ||
      `Careers & Opportunities | ${siteConfig.shortName}`,
    description:
      doc?.seo_description ||
      'Build a meaningful global career with Outsourced Pro Global. Explore current remote and flexible opportunities.',
    alternates: { canonical: doc?.canonical_url || pageUrl },
    robots: {
      follow: isSiteIndexable(),
      index: isSiteIndexable(),
    },
    openGraph: {
      description:
        doc?.seo_description ||
        'Explore current opportunities and build a meaningful global career with OPG.',
      images: doc?.og_image_url ? [{ url: doc.og_image_url }] : undefined,
      title: doc?.seo_title || `Careers at ${siteConfig.name}`,
      type: 'website',
      url: doc?.canonical_url || pageUrl,
    },
  }
}

export default async function CareersPage({ searchParams }: CareersPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const [doc, feed] = await Promise.all([
    getVisiblePageDocument(supabase, 'careers', params.opgPreview === '1'),
    getCareersFeed(),
  ])
  const copy = getPageCopy(doc?.content, CAREERS_COPY_SECTIONS)

  const openingsHeading = copy.openingsTitle || 'Explore Open Roles'
  const openingsLead =
    !copy.openingsLead || copy.openingsLead.includes('verified talent portal')
      ? 'Explore open roles across our global partner network. All applications are reviewed directly by our recruitment team.'
      : copy.openingsLead
  const emptyMessage =
    !copy.emptyMessage ||
    copy.emptyMessage.includes('active openings matching your criteria')
      ? 'We do not have any open positions at the moment. You can still share your CV or introduce yourself to recruitment@opglobal.com.hk for upcoming opportunities.'
      : copy.emptyMessage

  return (
    <div className={`${styles.page} careers-page`}>
      {/* Subtle, restrained ambient warmth */}
      <div className={styles.careersGlow} aria-hidden="true" />
      <div className={styles.careersGlowSecondary} aria-hidden="true" />

      <PageVisualRuntime
        page="careers"
        config={getPageVisualConfig(doc?.content)}
      />

      <section className={styles.openings} aria-labelledby="open-roles-title">
        {/* Vibrant aurora gradients behind glassmorphic job cards and filters */}
        <div className={styles.openingsGlowTopRight} aria-hidden="true" />
        <div className={styles.openingsGlowTopLeft} aria-hidden="true" />
        <div className={styles.openingsGlowCenter} aria-hidden="true" />
        <div className={styles.openingsGlowMidLeft} aria-hidden="true" />
        <div className={styles.openingsGlowMidRight} aria-hidden="true" />

        {/* Seamless bottom soft-blend dissolve into Application Steps */}
        <div className={styles.openingsBottomBlend} aria-hidden="true" />

        <div className="container">
          {!feed.configured ? (
            <>
              <header className={styles.pageHeader}>
                <div className={styles.pageHeaderContent}>
                  <p className={styles.eyebrow}>Careers at OPG</p>
                  <h1 className={styles.pageTitle} id="open-roles-title">
                    {openingsHeading}
                  </h1>
                  <p className={styles.pageLead}>{openingsLead}</p>
                </div>
                <div
                  className={`${styles.openingsCountBadge} ${styles.openingsCountBadgeEmpty}`}
                >
                  <span className={styles.openingsPulseIdle} aria-hidden="true" />
                  <span>Sync pending</span>
                </div>
              </header>
              <Notice
                className={styles.configNotice}
                title="Live role sync is being configured"
                variant="warning"
              >
                <p>
                  The live careers connection is not configured yet. Please
                  check back shortly or contact our recruitment team for
                  assistance.
                </p>
                <a href="mailto:recruitment@opglobal.com.hk">
                  Contact recruitment
                </a>
              </Notice>
            </>
          ) : (
            <CareerOpeningsExplorer
              applyLabel={copy.applyCta}
              detailsLabel={copy.detailsCta}
              emptyMessage={emptyMessage}
              emptyTitle={copy.emptyTitle}
              heading={openingsHeading}
              jobs={feed.jobs}
              lead={openingsLead}
            />
          )}
        </div>
      </section>

      <div className={styles.processAndCtaWrapper}>
        <ApplicationSteps />
        <RecruitmentCTA hasOpenRoles={feed.jobs.length > 0} />
      </div>
    </div>
  )
}
