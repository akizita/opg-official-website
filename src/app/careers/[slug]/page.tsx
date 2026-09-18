import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { Notice } from '@/components/ui/notice'
import { RichText } from '@/components/ui/rich-text'
import { getJobOpeningBySlug } from '@/lib/content/careers'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createStaticClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

type JobDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data: jobs } = await supabase
    .from('job_openings')
    .select('slug')
    .eq('status', 'published')

  return (jobs || []).map((j) => ({ slug: j.slug }))
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await getJobOpeningBySlug(slug)

  if (!job) {
    return { robots: { index: false, follow: false } }
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/careers/${slug}`, siteUrl).toString()

  const title = `${job.title} | Careers at ${siteConfig.shortName}`
  const description =
    job.summary || `Join OPG as ${job.title}. ${job.work_arrangement} role.`

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
    },
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params
  const job = await getJobOpeningBySlug(slug)

  if (!job) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(`/careers/${slug}`, siteUrl).toString()

  // JobPosting JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    url: pageUrl,
    title: job.title,
    description: job.summary || job.title,
    datePosted: job.published_at,
    validThrough: job.close_date || undefined,
    employmentType:
      job.employment_type === 'full_time'
        ? 'FULL_TIME'
        : job.employment_type === 'part_time'
          ? 'PART_TIME'
          : 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: siteConfig.name,
      sameAs: siteUrl.toString(),
    },
    jobLocationType:
      job.work_arrangement === 'remote' ? 'TELECOMMUTE' : undefined,
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    directApply: true,
  }

  return (
    <main id="main-content" className="job-detail-page container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumbs" className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/careers">Careers</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{job.title}</span>
      </nav>

      <header className="job-detail__header">
        <div className="job-detail__badges">
          {job.department && (
            <span className="job-badge job-badge--dept">
              {job.department.name}
            </span>
          )}
          <span className="job-badge job-badge--arrangement">
            {job.work_arrangement.toUpperCase()}
          </span>
          <span className="job-badge job-badge--type">
            {job.employment_type.replace('_', ' ')}
          </span>
        </div>

        <h1 className="job-detail__title">{job.title}</h1>
        <p className="job-detail__location">📍 {job.location}</p>

        {job.summary && <p className="job-detail__lead">{job.summary}</p>}

        <div className="job-detail__cta-bar">
          <ButtonLink
            href={job.external_apply_url}
            variant="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply for this Position ↗
          </ButtonLink>
        </div>
      </header>

      <div className="job-detail__content">
        <RichText content={job.description} />
      </div>

      <Notice variant="info" title="Application Security Notice">
        Outsourced Pro Global conducts all recruitment communications through
        verified `@opglobal.com.hk` email addresses and our official application
        portal. We will never ask candidates for banking details or recruitment
        fees.
      </Notice>

      <footer className="job-detail__footer">
        <Card className="spotlight-card">
          <div>
            <h2>Not the right fit?</h2>
            <p>
              Explore our other open positions or join our talent pool to be
              notified when matching roles become available.
            </p>
          </div>
          <div className="button-row">
            <ButtonLink href="/careers" variant="secondary">
              View All Open Positions
            </ButtonLink>
            <ButtonLink
              href="mailto:recruitment@opglobal.com.hk"
              variant="secondary"
            >
              Email CV to Recruitment
            </ButtonLink>
          </div>
        </Card>
      </footer>
    </main>
  )
}
