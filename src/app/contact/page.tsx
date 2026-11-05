import type { Metadata } from 'next'
import { ArrowUpRight01Icon, Mail01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { PageVisualRuntime } from '@/components/site/page-visual-runtime'
import { OpgSocialLinks } from '@/components/site/opg-social-links'
import { ContactForm } from '@/app/contact/contact-form'
import { Aurora } from '@/components/ui/aurora'
import { SpotlightCard } from '@/components/ui/spotlight-card'
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
          amplitude={0.78}
          blend={0.35}
          colorStops={['#d99a00', '#f29f04', '#f2b705', '#ffd000', '#ffe27a']}
          speed={0.5}
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
        <div className="contact-layout-grid">
          <div className="contact-info-column">
            <header className="contact-hero">
              <h1 className="contact-hero__title">{copy.heroTitle}</h1>
              <p className="contact-hero__lead">{copy.heroLead}</p>
            </header>

            <section aria-label="Contact details" className="contact-details">
              <div className="contact-channel-item">
                <a
                  aria-label={`Email us: ${copy.talentEmail}`}
                  className="contact-channel-link"
                  href={`mailto:${copy.talentEmail}`}
                >
                  <span aria-hidden="true" className="contact-channel-icon">
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      size={21}
                      strokeWidth={1.8}
                    />
                  </span>
                  <span className="contact-channel-value">
                    {copy.talentEmail}
                  </span>
                  <span aria-hidden="true" className="contact-link-arrow">
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={16}
                      strokeWidth={2}
                    />
                  </span>
                </a>
              </div>
              <OpgSocialLinks />
            </section>
          </div>

          <div className="contact-form-column">
            <SpotlightCard
              className="contact-form-spotlight"
              spotlightColor="rgba(245, 182, 24, 0.26)"
              tabIndex={-1}
              trackPointerWhileFocused
            >
              <ContactForm
                copy={copy}
                signedInEmail={visitor?.email || ''}
              />
            </SpotlightCard>
          </div>
        </div>
      </div>
    </main>
  )
}
