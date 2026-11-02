import {
  Briefcase01Icon,
  Building03Icon,
  Calendar03Icon,
  Location01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button-link'
import { Notice } from '@/components/ui/notice'
import { RichText } from '@/components/ui/rich-text'
import { getCareerJobBySlug, getCareersFeed } from '@/lib/jazzhr/client'
import type { CareerEmploymentType } from '@/lib/jazzhr/types'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 900

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

export async function generateStaticParams() {
  try {
    const { jobs } = await getCareersFeed()
    return jobs.map((job) => ({ slug: job.slug }))
  } catch {
    return []
  }
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

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/careers/${job.slug}`, siteUrl).toString()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    directApply: true,
    applicantLocationRequirements:
      job.workArrangement === 'remote' && job.country
        ? { '@type': 'Country', name: job.country }
        : undefined,
    datePosted: job.publishedAt || undefined,
    description: job.descriptionText || job.summary || job.title,
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
    <main id="main-content" className="job-detail-page">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />

      <section className="job-detail-hero">
        <div className="container">
          <nav aria-label="Breadcrumbs" className="breadcrumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/careers">Careers</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{job.title}</span>
          </nav>

          <div className="job-detail-hero__layout">
            <div>
              <div className="job-detail__badges">
                {job.department ? (
                  <span className="job-badge job-badge--dept">
                    {job.department}
                  </span>
                ) : null}
                {job.workArrangement !== 'unspecified' ? (
                  <span className="job-badge job-badge--arrangement">
                    {job.workArrangement === 'onsite'
                      ? 'On-site'
                      : job.workArrangement}
                  </span>
                ) : null}
                <span className="job-badge job-badge--type">
                  {job.employmentTypeLabel}
                </span>
              </div>
              <h1 className="job-detail__title">{job.title}</h1>
              {job.summary ? (
                <p className="job-detail__lead">{job.summary}</p>
              ) : null}
            </div>

            <div className="job-detail__cta-card">
              <p>Ready to make an impact?</p>
              <ButtonLink href={job.applyPath}>
                Apply for this position →
              </ButtonLink>
              <small>Apply securely without leaving the OPG website.</small>
            </div>
          </div>

          <div className="job-detail__meta">
            <span>
              <HugeiconsIcon icon={Location01Icon} size={19} />
              <span>
                <small>Location</small>
                {job.location}
              </span>
            </span>
            {job.department ? (
              <span>
                <HugeiconsIcon icon={Building03Icon} size={19} />
                <span>
                  <small>Department</small>
                  {job.department}
                </span>
              </span>
            ) : null}
            <span>
              <HugeiconsIcon icon={Briefcase01Icon} size={19} />
              <span>
                <small>Employment</small>
                {job.employmentTypeLabel}
              </span>
            </span>
            {job.publishedAt ? (
              <span>
                <HugeiconsIcon icon={Calendar03Icon} size={19} />
                <span>
                  <small>Posted</small>
                  {formatDate(job.publishedAt)}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="job-detail-body">
        <div className="container job-detail-body__layout">
          <article className="job-detail__content">
            <p className="careers-eyebrow">The opportunity</p>
            <h2>About this role</h2>
            {job.descriptionText ? (
              <RichText content={job.descriptionText} />
            ) : (
              <p>
                Full role details are available on the official application
                page.
              </p>
            )}
          </article>

          <aside className="job-detail__aside">
            <div className="job-detail__sticky-card">
              <h2>Join OPG</h2>
              <p>
                Build a meaningful career alongside global teams that value
                growth, integrity, and excellent work.
              </p>
              <ButtonLink href={job.applyPath}>Apply now →</ButtonLink>
              <Link href="/careers">← View all open roles</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="container job-detail__security">
        <Notice variant="info" title="Application security notice">
          OPG conducts recruitment through verified `@opglobal.com.hk` email
          addresses and this official OPG website. We never charge recruitment
          fees or ask candidates to transfer money. Submitted applications are
          stored in our JazzHR recruitment workspace.
        </Notice>
      </section>
    </main>
  )
}
