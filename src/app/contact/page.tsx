import type { Metadata } from 'next'
import Link from 'next/link'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { ContactForm } from '@/app/contact/contact-form'
import { Card } from '@/components/ui/card'
import { CONTACT_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: doc } = await supabase
    .from('page_documents')
    .select(
      'title, seo_title, seo_description, canonical_url, og_image_url, status',
    )
    .eq('slug', 'contact')
    .eq('status', 'published')
    .maybeSingle<PageDocument>()
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/contact', siteUrl).toString()
  const title =
    doc?.seo_title || doc?.title || `Contact Us | ${siteConfig.shortName}`
  const description =
    doc?.seo_description ||
    'Connect with Outsourced Pro Global. Submit client staffing inquiries or reach our talent acquisition operations team.'
  const indexable = isSiteIndexable()

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

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ opgPreview?: string }>
}) {
  const { opgPreview } = await searchParams
  const supabase = await createClient()
  const doc = await getVisiblePageDocument(supabase, 'contact', opgPreview === '1')
  const copy = getPageCopy(doc?.content, CONTACT_COPY_SECTIONS)
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/contact', siteUrl).toString()

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: copy.heroTitle,
    url: pageUrl,
    description: copy.heroLead,
    mainEntity: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteUrl.toString(),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: copy.clientEmail,
          availableLanguage: ['English'],
        },
        {
          '@type': 'ContactPoint',
          contactType: 'human resources',
          email: copy.talentEmail,
          availableLanguage: ['English'],
        },
      ],
    },
  }

  return (
    <main className="contact-page">
      <PageVisualRuntime page="contact" config={getPageVisualConfig(doc?.content)} />
      {/* Schema.org ContactPage JSON-LD */}
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />

      <div className="container">
        {/* Accessible Breadcrumb */}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Contact</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="contact-hero">
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h1 className="contact-hero__title">{copy.heroTitle}</h1>
          <p className="contact-hero__lead">{copy.heroLead}</p>
        </header>

        {/* Two-Column Grid: Left Info / Right Interactive Form */}
        <div className="contact-layout-grid">
          <div className="contact-info-column">
            <Card eyebrow={copy.channelsEyebrow} title={copy.channelsTitle}>
              <div className="contact-channel-item">
                <span className="contact-channel-label">
                  {copy.clientLabel}
                </span>
                <a
                  className="contact-channel-value"
                  href={`mailto:${copy.clientEmail}`}
                >
                  {copy.clientEmail}
                </a>
                <p className="contact-channel-desc">{copy.clientDescription}</p>
              </div>

              <div className="contact-channel-item">
                <span className="contact-channel-label">
                  {copy.talentLabel}
                </span>
                <a
                  className="contact-channel-value"
                  href={`mailto:${copy.talentEmail}`}
                >
                  {copy.talentEmail}
                </a>
                <p className="contact-channel-desc">{copy.talentDescription}</p>
              </div>
            </Card>

            <Card eyebrow={copy.operationsEyebrow} title={copy.operationsTitle}>
              <div className="contact-channel-item">
                <span className="contact-channel-label">
                  {copy.officeLabel}
                </span>
                <address className="contact-address">
                  {copy.officeName}
                  <br />
                  {copy.officeLocation}
                </address>
              </div>

              <div className="contact-channel-item">
                <span className="contact-channel-label">
                  {copy.coverageLabel}
                </span>
                <p className="contact-channel-desc">{copy.coverageBody}</p>
              </div>

              <div className="contact-channel-item">
                <span className="contact-channel-label">{copy.slaLabel}</span>
                <p className="contact-channel-desc">{copy.slaBody}</p>
              </div>
            </Card>

            <div className="contact-faq-teaser">
              <h3>{copy.teaserTitle}</h3>
              <p>{copy.teaserBody}</p>
              <Link
                className="button-link button-link--secondary"
                href="/articles"
              >
                {copy.teaserCta}
              </Link>
            </div>
          </div>

          <div className="contact-form-column">
            <ContactForm copy={copy} />
          </div>
        </div>
      </div>
    </main>
  )
}
