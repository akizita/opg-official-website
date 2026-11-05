import {
  Briefcase01Icon,
  Calendar03Icon,
  Location01Icon,
  Money01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { CareerApplicationForm } from '@/app/careers/[slug]/apply/application-form'
import { JobDescription } from '@/app/careers/[slug]/job-description'
import { getCareerJobBySlug, getCareerQuestions } from '@/lib/jazzhr/client'
import { formatCareerCompensation } from '@/lib/jazzhr/normalize'
import type { CareerEmploymentType } from '@/lib/jazzhr/types'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

import styles from './job-detail.module.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

type JobDetailPageProps = {
  params: Promise<{ slug: string }>
}

const SCHEMA_EMPLOYMENT_TYPE: Record<CareerEmploymentType, string> = {
  contract: 'CONTRACTOR',
  contract_to_full_time: 'CONTRACTOR',
  full_time: 'FULL_TIME',
  internship: 'INTERN',
  internship_to_full_time: 'INTERN',
  other: 'OTHER',
  part_time: 'PART_TIME',
  part_time_to_full_time: 'PART_TIME',
  seasonal: 'TEMPORARY',
  temporary: 'TEMPORARY',
  temporary_to_full_time: 'TEMPORARY',
  volunteer: 'VOLUNTEER',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value))
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await getCareerJobBySlug(slug)

  if (!job) return { robots: { follow: false, index: false } }

  const pageUrl = new URL(`/careers/${job.slug}`, getSiteUrl()).toString()
  const title = `${job.title} | Careers at ${siteConfig.shortName}`
  const description =
    job.summary || `Explore the ${job.title} opportunity at ${siteConfig.name}.`

  return {
    alternates: { canonical: pageUrl },
    description,
    openGraph: {
      description,
      title,
      type: 'website',
      url: pageUrl,
    },
    robots: {
      follow: isSiteIndexable(),
      index: isSiteIndexable(),
    },
    title,
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params
  const job = await getCareerJobBySlug(slug)
  if (!job) notFound()
  if (job.slug !== slug) permanentRedirect(`/careers/${job.slug}`)

  const questions = await getCareerQuestions(job)
  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/careers/${job.slug}`, siteUrl).toString()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    applicantLocationRequirements:
      job.workArrangement === 'remote' && job.country
        ? { '@type': 'Country', name: job.country }
        : undefined,
    datePosted: job.publishedAt || undefined,
    description: job.descriptionText || job.summary || job.title,
    directApply: true,
    employmentType: SCHEMA_EMPLOYMENT_TYPE[job.employmentType],
    hiringOrganization: {
      '@type': 'Organization',
      name: siteConfig.name,
      sameAs: siteUrl.toString(),
    },
    jobLocation:
      job.workArrangement === 'remote'
        ? undefined
        : {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressCountry: job.country || undefined,
              addressLocality: job.city || undefined,
              addressRegion: job.state || undefined,
            },
          },
    jobLocationType:
      job.workArrangement === 'remote' ? 'TELECOMMUTE' : undefined,
    title: job.title,
    url: pageUrl,
  }

  return (
    <div className={`${styles.page} career-detail-page`}>
      {/* Ambient background glows matching Articles page with rich golden auroras */}
      <div className={styles.glowPrimary} aria-hidden="true" />
      <div className={styles.glowSecondary} aria-hidden="true" />
      <div className={styles.glowTertiary} aria-hidden="true" />
      <div className={styles.glowQuaternary} aria-hidden="true" />
      <div className={styles.glowMiddleRight} aria-hidden="true" />
      <div className={styles.glowMiddleLeft} aria-hidden="true" />
      <div className={styles.glowLowerCenter} aria-hidden="true" />
      <div className={styles.glowBottomPrimary} aria-hidden="true" />
      <div className={styles.glowBottomSecondary} aria-hidden="true" />
      <div className={styles.glowBottomCenter} aria-hidden="true" />

      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />

      <header className={styles.hero}>
        <div className={styles.contentContainer}>
          {/* Back button on top left, separated from tags */}
          <div className={styles.topNav}>
            <Link className={styles.backLink} href="/careers">
              <span className={styles.backArrow} aria-hidden="true">
                ←
              </span>
              <span>Back to all opportunities</span>
            </Link>
          </div>

          <div className={styles.heroContent}>
            {/* Single department tag retained only (no redundant tags) */}
            {job.department ? (
              <div className={styles.badges}>
                <span className={`${styles.badge} ${styles.badgeDept}`}>
                  {job.department}
                </span>
              </div>
            ) : null}

            {/* One-lined job title header */}
            <h1 className={styles.title}>{job.title}</h1>
          </div>

          {/* Quick metadata strip in 1 row with see-through glassmorphic style */}
          <div className={styles.metaBar}>
            <div className={styles.metaItems}>
              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>
                  <HugeiconsIcon icon={Location01Icon} size={18} />
                </span>
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Location</span>
                  <span className={styles.metaValue}>{job.location}</span>
                </div>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaIcon}>
                  <HugeiconsIcon icon={Briefcase01Icon} size={18} />
                </span>
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Employment</span>
                  <span className={styles.metaValue}>
                    {job.employmentTypeLabel}
                  </span>
                </div>
              </div>

              {job.compensation ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>
                    <HugeiconsIcon icon={Money01Icon} size={18} />
                  </span>
                  <div className={styles.metaText}>
                    <span className={styles.metaLabel}>Compensation</span>
                    <span className={styles.metaValue}>
                      {formatCareerCompensation(job.compensation)}
                    </span>
                  </div>
                </div>
              ) : null}

              {job.publishedAt ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>
                    <HugeiconsIcon icon={Calendar03Icon} size={18} />
                  </span>
                  <div className={styles.metaText}>
                    <span className={styles.metaLabel}>Posted</span>
                    <span className={styles.metaValue}>
                      {formatDate(job.publishedAt)}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main unified section: Details & Application Form side by side */}
      <section className={styles.mainSection}>
        <div className={`${styles.contentContainer} ${styles.layout}`}>
          {/* Left: Organized Job Description in See-Through Glassmorphic Card */}
          <div className={styles.descriptionColumn}>
            <article className={styles.descriptionCard}>
              <div className={styles.descriptionHeader}>
                <p className={styles.descriptionEyebrow}>Role Specification</p>
                <h2 className={styles.descriptionHeading}>
                  About This Position
                </h2>
              </div>

              <JobDescription text={job.descriptionText} />
            </article>
          </div>

          {/* Right: Application Form (Unboxed - Not in a double card) */}
          <aside className={styles.applyColumn} id="apply">
            <div className={styles.applyHeader}>
              <span className={styles.applyBadge}>Direct Application</span>
              <h2 className={styles.applyTitle}>Submit Application</h2>
              <p className={styles.applySubtitle}>
                Apply directly for {job.title}. Our talent acquisition team
                reviews every candidate profile.
              </p>
            </div>

            <CareerApplicationForm
              jobSlug={job.slug}
              jobTitle={job.title}
              questions={questions}
            />
          </aside>
        </div>
      </section>

      {/* Security notice as a subtle subtext instead of a disruptive bar */}
      <div className={`${styles.contentContainer} ${styles.securitySubtext}`}>
        <p>
          <strong className={styles.securityBadge}>Security note:</strong>{' '}
          OutPro Global conducts recruitment exclusively through verified{' '}
          <code>@opglobal.com.hk</code> email addresses and this official website.
          We never charge recruitment or placement fees.
        </p>
      </div>
    </div>
  )
}
