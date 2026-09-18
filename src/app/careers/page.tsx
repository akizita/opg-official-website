import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getPublishedJobOpenings,
  type WorkArrangement,
} from '@/lib/content/careers'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600 // 1 hour ISR

type CareersPageProps = {
  searchParams: Promise<{
    arrangement?: string
  }>
}

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/careers', siteUrl).toString()

  return {
    title: `Careers & Opportunities | ${siteConfig.shortName}`,
    description:
      'Join our global team of engineers, operations specialists, and consultants. Explore high-impact remote and flexible career opportunities with Outsourced Pro Global.',
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title: `Careers at ${siteConfig.name}`,
      description:
        'Join our global distributed team. Competitive compensation, career growth, and flexible remote work.',
      url: pageUrl,
      type: 'website',
    },
  }
}

export default async function CareersPage({ searchParams }: CareersPageProps) {
  const params = await searchParams
  const arrangement = (params.arrangement as WorkArrangement) || undefined

  const openings = await getPublishedJobOpenings({
    workArrangement: arrangement,
  })

  return (
    <main id="main-content" className="careers-page container">
      <header className="careers-hero">
        <h1 className="careers-hero__title">Build Your Career with OPG</h1>
        <p className="careers-hero__lead">
          We connect high-performing professionals with forward-thinking global
          enterprises. Enjoy remote flexibility, competitive compensation, and
          meaningful career acceleration.
        </p>
      </header>

      {/* Benefits grid */}
      <section className="careers-benefits" aria-labelledby="why-join-title">
        <h2 id="why-join-title" className="sr-only">
          Why Join OPG
        </h2>
        <div className="careers-benefits__grid">
          <Card className="careers-benefit-card">
            <h3>🌍 Truly Global & Flexible</h3>
            <p>
              Work from anywhere with asynchronous-friendly practices and
              respect for work-life integration.
            </p>
          </Card>
          <Card className="careers-benefit-card">
            <h3>🚀 High-Impact Enterprise Projects</h3>
            <p>
              Collaborate directly with top-tier multinational clients on modern
              tech stacks and mission-critical workflows.
            </p>
          </Card>
          <Card className="careers-benefit-card">
            <h3>📈 Accelerated Professional Growth</h3>
            <p>
              Continuous skill development, technical mentorship, and clear
              pathways to leadership roles.
            </p>
          </Card>
        </div>
      </section>

      {/* Openings Section */}
      <section className="careers-openings" aria-labelledby="open-roles-title">
        <div className="section-heading">
          <div>
            <h2 id="open-roles-title">Open Positions ({openings.length})</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.5rem' }}>
              All applications are processed securely via our official talent
              channel.
            </p>
          </div>

          <nav
            aria-label="Work arrangement filter"
            className="careers-filter-nav"
          >
            <Link
              href="/careers"
              className={`articles-filter-chip ${!arrangement ? 'articles-filter-chip--active' : ''}`}
            >
              All Roles
            </Link>
            <Link
              href="/careers?arrangement=remote"
              className={`articles-filter-chip ${arrangement === 'remote' ? 'articles-filter-chip--active' : ''}`}
            >
              Remote
            </Link>
            <Link
              href="/careers?arrangement=hybrid"
              className={`articles-filter-chip ${arrangement === 'hybrid' ? 'articles-filter-chip--active' : ''}`}
            >
              Hybrid
            </Link>
          </nav>
        </div>

        {openings.length === 0 ? (
          <EmptyState
            title="No open positions right now"
            message="We do not have active openings matching your criteria at this moment. You can still send your CV to recruitment@opglobal.com.hk."
          />
        ) : (
          <div className="job-openings-list">
            {openings.map((job) => (
              <Card key={job.id} className="job-opening-card">
                <div className="job-opening-card__info">
                  <div className="job-opening-card__badges">
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

                  <h3 className="job-opening-card__title">
                    <Link href={`/careers/${job.slug}`}>{job.title}</Link>
                  </h3>

                  <p className="job-opening-card__meta">📍 {job.location}</p>

                  {job.summary && (
                    <p className="job-opening-card__summary">{job.summary}</p>
                  )}
                </div>

                <div className="job-opening-card__actions">
                  <ButtonLink
                    href={job.external_apply_url}
                    variant="primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply Now ↗
                  </ButtonLink>
                  <ButtonLink href={`/careers/${job.slug}`} variant="secondary">
                    View Details
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
