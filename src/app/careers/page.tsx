import {
  ArrowDown01Icon,
  Globe02Icon,
  Rocket01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { Metadata } from 'next'

import { CareerOpeningsExplorer } from '@/app/careers/career-openings-explorer'
import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { ButtonLink } from '@/components/ui/button-link'
import { Notice } from '@/components/ui/notice'
import { CAREERS_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getCareersFeed } from '@/lib/jazzhr/client'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 900

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

  return (
    <main id="main-content" className="careers-page">
      <PageVisualRuntime
        page="careers"
        config={getPageVisualConfig(doc?.content)}
      />

      <section className="careers-hero">
        <div className="container careers-hero__layout">
          <div className="careers-hero__content">
            <p className="careers-eyebrow">Careers at OPG</p>
            <h1 className="careers-hero__title">{copy.heroTitle}</h1>
            <p className="careers-hero__lead">{copy.heroLead}</p>
            <div className="careers-hero__actions">
              <ButtonLink href="#open-roles-title">
                Explore open roles
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowDown01Icon}
                  size={18}
                />
              </ButtonLink>
              <ButtonLink href="/about" variant="secondary">
                Discover life at OPG
              </ButtonLink>
            </div>
            <p className="careers-hero__microcopy">
              Global teams · Meaningful work · Long-term growth
            </p>
          </div>

          <aside
            aria-label="Careers at a glance"
            className="careers-hero__panel"
          >
            <div className="careers-hero__panel-heading">
              <span>Open opportunities</span>
              <strong>{feed.jobs.length}</strong>
              <p>Current roles across our growing global teams.</p>
            </div>
            <div className="careers-hero__panel-list">
              <div>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Globe02Icon}
                  size={22}
                />
                <span>
                  <strong>Global collaboration</strong>
                  Work with international teams and clients.
                </span>
              </div>
              <div>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Rocket01Icon}
                  size={22}
                />
                <span>
                  <strong>Room to grow</strong>
                  Develop your craft through meaningful work.
                </span>
              </div>
              <div>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={UserGroupIcon}
                  size={22}
                />
                <span>
                  <strong>People-first culture</strong>
                  Join a team that values your contribution.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="careers-openings" aria-labelledby="open-roles-title">
        <div className="container">
          <div className="careers-openings__heading">
            <div>
              <p className="careers-eyebrow">Open positions</p>
              <h2 id="open-roles-title">{copy.openingsTitle}</h2>
              <p>{copy.openingsLead}</p>
            </div>
            <span className="careers-openings__count">
              {feed.jobs.length} {feed.jobs.length === 1 ? 'role' : 'roles'}
            </span>
          </div>

          {!feed.configured ? (
            <Notice
              className="careers-config-notice"
              title="Live role sync is being configured"
              variant="warning"
            >
              <p>
                The live careers connection is not configured yet. Please check
                back shortly or contact our recruitment team for assistance.
              </p>
              <a href="mailto:recruitment@opglobal.com.hk">
                Contact recruitment
              </a>
            </Notice>
          ) : (
            <CareerOpeningsExplorer
              applyLabel={copy.applyCta}
              detailsLabel={copy.detailsCta}
              emptyMessage={copy.emptyMessage}
              emptyTitle={copy.emptyTitle}
              jobs={feed.jobs}
            />
          )}
        </div>
      </section>

      <section className="careers-benefits" aria-labelledby="why-join-title">
        <div className="container">
          <div className="careers-section-heading careers-section-heading--split">
            <div>
              <p className="careers-eyebrow">Why join us</p>
              <h2 id="why-join-title">{copy.benefitsTitle}</h2>
            </div>
            <p>
              Join a culture where your ideas matter, your ambitions are
              supported, and your growth has no limits.
            </p>
          </div>

          <div className="careers-benefits__grid">
            <article className="careers-benefit-card">
              <span className="careers-benefit-card__icon">
                <HugeiconsIcon icon={Globe02Icon} size={25} />
              </span>
              <div>
                <h3>{copy.benefit1Title}</h3>
                <p>{copy.benefit1Body}</p>
              </div>
            </article>
            <article className="careers-benefit-card">
              <span className="careers-benefit-card__icon">
                <HugeiconsIcon icon={Rocket01Icon} size={25} />
              </span>
              <div>
                <h3>{copy.benefit2Title}</h3>
                <p>{copy.benefit2Body}</p>
              </div>
            </article>
            <article className="careers-benefit-card">
              <span className="careers-benefit-card__icon">
                <HugeiconsIcon icon={UserGroupIcon} size={25} />
              </span>
              <div>
                <h3>{copy.benefit3Title}</h3>
                <p>{copy.benefit3Body}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="careers-process-title"
        className="careers-process"
      >
        <div className="container careers-process__layout">
          <div className="careers-process__intro">
            <p className="careers-eyebrow">What happens next</p>
            <h2 id="careers-process-title">A straightforward path to OPG.</h2>
            <p>
              We keep the application experience clear, focused, and respectful
              of your time.
            </p>
          </div>
          <ol className="careers-process__steps">
            <li>
              <span>01</span>
              <div>
                <h3>Find your role</h3>
                <p>Review the opportunity, requirements, and working setup.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Apply online</h3>
                <p>Send your résumé and answers securely through this website.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Connect with us</h3>
                <p>
                  Our recruitment team reviews suitable applications and follows
                  up.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="careers-closing">
        <div className="container careers-closing__inner">
          <div>
            <p className="careers-eyebrow">Stay connected</p>
            <h2>Do not see the right role yet?</h2>
            <p>
              Our opportunities evolve with our global partners. Check back soon
              or introduce yourself to our recruitment team.
            </p>
          </div>
          <div className="button-row">
            <ButtonLink href="#open-roles-title">
              Review current openings
            </ButtonLink>
            <ButtonLink
              href="mailto:recruitment@opglobal.com.hk"
              variant="secondary"
            >
              Contact recruitment
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  )
}
