import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { RichText } from '@/components/ui/rich-text'
import { getAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR default, revalidated on publish action

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select('title, summary, seo_title, seo_description, canonical_url, og_image_url, status')
    .eq('slug', 'mission-and-vision')
    .maybeSingle<PageDocument>()

  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/mission-and-vision', siteUrl).toString()

  const title = doc?.seo_title
    ? doc.seo_title
    : doc?.title
      ? `${doc.title} | ${siteConfig.shortName}`
      : `Mission & Vision | ${siteConfig.shortName}`

  const description =
    doc?.seo_description ||
    doc?.summary ||
    'Discover the mission, vision, and core operating principles of Outsourced Pro Global.'

  const isPublished = doc?.status === 'published'
  const indexable = isSiteIndexable() && isPublished

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

export default async function MissionAndVisionPage() {
  const supabase = await createClient()
  const session = await getAdminSession()

  const { data: doc } = await supabase
    .from('page_documents')
    .select('*')
    .eq('slug', 'mission-and-vision')
    .maybeSingle<PageDocument>()

  const hasStaffAccess = session ? canViewContent(session.profile.roleKey) : false
  const isPublished = doc?.status === 'published'

  // If no document exists, or if document is unpublished and viewer is not admin
  if (!doc || (!isPublished && !hasStaffAccess)) {
    return (
      <main className="container status-page">
        <EmptyState
          action={<ButtonLink href="/">Return to Homepage</ButtonLink>}
          description="Our official mission and vision statement is being finalized and will be published shortly."
          title="Mission & Vision Coming Soon"
        />
      </main>
    )
  }

  return (
    <main className="mission-page">
      <div className="container">
        {/* Admin Draft Preview Notice */}
        {!isPublished && hasStaffAccess && (
          <Notice
            className="mission-preview-notice"
            title="Internal Preview Mode"
            variant="warning"
          >
            You are viewing this document in staff preview mode. The current status is{' '}
            <strong>{doc.status}</strong> (v{doc.version}). It is not visible to the public.
          </Notice>
        )}

        {/* Accessible Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Mission & Vision</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="mission-hero">
          <p className="eyebrow">Our Purpose & Direction</p>
          <h1 className="mission-hero__title">{doc.title}</h1>
          {doc.summary && <p className="mission-hero__lead">{doc.summary}</p>}
        </header>

        {/* Main Content Body */}
        <section aria-label="Statements and Principles" className="mission-content">
          <RichText content={doc.content} />
        </section>

        {/* Strategic Conversion Pathway */}
        <section aria-label="Next Steps" className="mission-cta">
          <div className="card-grid">
            <div className="card">
              <p className="eyebrow">For Enterprise Partners</p>
              <h2>Build Your Global Team</h2>
              <p>
                Learn how Outsourced Pro Global helps ambitious companies scale with
                dedicated talent, transparent operations, and measurable outcomes.
              </p>
              <div className="button-row">
                <ButtonLink href="/contact" variant="primary">
                  Partner With Us
                </ButtonLink>
                <ButtonLink href="/services" variant="secondary">
                  Explore Services
                </ButtonLink>
              </div>
            </div>

            <div className="card">
              <p className="eyebrow">For Professionals</p>
              <h2>Grow Your Career Globally</h2>
              <p>
                Connect with world-class international companies offering high-trust,
                rewarding roles and long-term career progression.
              </p>
              <div className="button-row">
                <ButtonLink href="/careers" variant="primary">
                  View Open Roles
                </ButtonLink>
                <ButtonLink href="/about" variant="secondary">
                  About OPG
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

