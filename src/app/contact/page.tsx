import type { Metadata } from 'next'
import {
  ArrowUpRight01Icon,
  Clock01Icon,
  Globe02Icon,
  Mail01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { OpgSocialLinks } from '@/components/site/opg-social-links'
import { ContactForm } from '@/app/contact/contact-form'
import { Aurora } from '@/components/ui/aurora'
import { CONTACT_COPY_SECTIONS, getPageCopy } from '@/lib/content/page-copy'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPageVisualConfig } from '@/lib/content/page-visual'
import { getVisiblePageDocument } from '@/lib/content/visible-page-document'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'
import { getVisitorSession } from '@/lib/auth/visitor-session'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR
export const dynamic = 'force-dynamic'

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
  const rawTitle = doc?.seo_title || doc?.title || 'Contact Us'
  const title = rawTitle.replace(/\s*\|\s*OPG$/i, '').trim() || 'Contact Us'
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
  const visitor = await getVisitorSession()
  const doc = await getVisiblePageDocument(
    supabase,
    'contact',
    opgPreview === '1',
  )
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
          contactType: 'general inquiries',
          email: copy.talentEmail,
          availableLanguage: ['English'],
        },
      ],
    },
  }

  return (
    <main className="contact-page">
      <div aria-hidden="true" className="contact-page__aurora">
        <Aurora
          amplitude={0.85}
          blend={0.44}
          colorStops={['#f29f04', '#facc15', '#f2b705', '#fde047', '#f59e0b']}
          speed={0.45}
        />
      </div>
      <PageVisualRuntime
        page="contact"
        config={getPageVisualConfig(doc?.content)}
      />
      {/* Schema.org ContactPage JSON-LD */}
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />

      <div className="container">
        <div className="contact-unified-card">
          <div className="contact-info-column">
            <header className="contact-hero">
              <h1 className="contact-hero__title">{copy.heroTitle}</h1>
              <p className="contact-hero__lead">{copy.heroLead}</p>
            </header>

            <div className="contact-highlights" aria-label="Global operations overview">
              <div className="contact-highlight-item">
                <span aria-hidden="true" className="contact-highlight-icon">
                  <HugeiconsIcon icon={Globe02Icon} size={17} strokeWidth={1.8} />
                </span>
                <div className="contact-highlight-copy">
                  <span className="contact-highlight-label">Global Presence</span>
                  <span className="contact-highlight-value">
                    Philippines HQ · AU · US · UK · SG
                  </span>
                </div>
              </div>
              <div className="contact-highlight-item">
                <span aria-hidden="true" className="contact-highlight-icon">
                  <HugeiconsIcon icon={Clock01Icon} size={17} strokeWidth={1.8} />
                </span>
                <div className="contact-highlight-copy">
                  <span className="contact-highlight-label">Response Cadence</span>
                  <span className="contact-highlight-value">
                    Dedicated routing within 1 business day
                  </span>
                </div>
              </div>
            </div>

            <section aria-label="Contact details" className="contact-details">
              <a
                aria-label={`Email us: ${copy.talentEmail}`}
                className="contact-channel-link"
                href={`mailto:${copy.talentEmail}`}
              >
                <span aria-hidden="true" className="contact-channel-icon">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>
                <span className="contact-channel-meta">
                  <span className="contact-channel-label">Direct inquiries</span>
                  <span className="contact-channel-value">
                    {copy.talentEmail}
                  </span>
                </span>
                <span aria-hidden="true" className="contact-link-arrow">
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    size={16}
                    strokeWidth={2}
                  />
                </span>
              </a>
              <OpgSocialLinks />
            </section>
          </div>

          <div className="contact-form-column">
            <ContactForm
              copy={copy}
              signedInEmail={visitor?.email || ''}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
