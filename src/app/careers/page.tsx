import type { Metadata } from 'next'
import Link from 'next/link'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getPublishedJobOpenings,
  type WorkArrangement,
} from '@/lib/content/careers'
import { CAREERS_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

type CareersPageProps = {
  searchParams: Promise<{
    arrangement?: string
    opgPreview?: string
  }>
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
      'Join our global team of engineers, operations specialists, and consultants. Explore high-impact remote and flexible career opportunities with Outsourced Pro Global.',
    alternates: {
      canonical: doc?.canonical_url || pageUrl,
    },
    robots: {
      index: isSiteIndexable(),
      follow: isSiteIndexable(),
    },
    openGraph: {
      title: doc?.seo_title || `Careers at ${siteConfig.name}`,
      description:
        doc?.seo_description ||
        'Join our global distributed team. Competitive compensation, career growth, and flexible remote work.',
      url: doc?.canonical_url || pageUrl,
      type: 'website',
      images: doc?.og_image_url ? [{ url: doc.og_image_url }] : undefined,
    },
  }
}

export default async function CareersPage({ searchParams }: CareersPageProps) {
  const params = await searchParams
  const arrangement = (params.arrangement as WorkArrangement) || undefined

  const supabase = await createClient()
  const [doc, openings] = await Promise.all([
    getVisiblePageDocument(supabase, 'careers', params.opgPreview === '1'),
    getPublishedJobOpenings({ workArrangement: arrangement }),
  ])
  const copy = getPageCopy(doc?.content, CAREERS_COPY_SECTIONS)

  return (
    <main id="main-content" className="careers-page container">
      <PageVisualRuntime page="careers" config={getPageVisualConfig(doc?.content)} />
      <header className="careers-hero">
        <h1 className="careers-hero__title">{copy.heroTitle}</h1>
        <p className="careers-hero__lead">{copy.heroLead}</p>
      </header>

      {/* Benefits grid */}
      <section className="careers-benefits" aria-labelledby="why-join-title">
        <h2 id="why-join-title" className="sr-only">
          {copy.benefitsTitle}
        </h2>
        <div className="careers-benefits__grid">
          <Card className="careers-benefit-card">
            <h3>{copy.benefit1Title}</h3>
            <p>{copy.benefit1Body}</p>
          </Card>
          <Card className="careers-benefit-card">
            <h3>{copy.benefit2Title}</h3>
            <p>{copy.benefit2Body}</p>
          </Card>
          <Card className="careers-benefit-card">
            <h3>{copy.benefit3Title}</h3>
            <p>{copy.benefit3Body}</p>
          </Card>
        </div>
      </section>

      {/* Openings Section */}
      <section className="careers-openings" aria-labelledby="open-roles-title">
        <div className="section-heading">
          <div>
            <h2 id="open-roles-title">
              {copy.openingsTitle} ({openings.length})
            </h2>
            <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.5rem' }}>
              {copy.openingsLead}
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
              {copy.filterAll}
            </Link>
            <Link
              href="/careers?arrangement=remote"
              className={`articles-filter-chip ${arrangement === 'remote' ? 'articles-filter-chip--active' : ''}`}
            >
              {copy.filterRemote}
            </Link>
            <Link
              href="/careers?arrangement=hybrid"
              className={`articles-filter-chip ${arrangement === 'hybrid' ? 'articles-filter-chip--active' : ''}`}
            >
              {copy.filterHybrid}
            </Link>
          </nav>
        </div>

        {openings.length === 0 ? (
          <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
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
                    {copy.applyCta}
                  </ButtonLink>
                  <ButtonLink href={`/careers/${job.slug}`} variant="secondary">
                    {copy.detailsCta}
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
