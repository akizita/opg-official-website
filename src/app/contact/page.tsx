import type { Metadata } from 'next'
import Link from 'next/link'

import { ContactForm } from '@/app/contact/contact-form'
import { Card } from '@/components/ui/card'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600 // 1 hour ISR

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/contact', siteUrl).toString()
  const title = `Contact Us | ${siteConfig.shortName}`
  const description =
    'Connect with Outsourced Pro Global. Submit client staffing inquiries or reach our talent acquisition operations team.'
  const indexable = isSiteIndexable()

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
  }
}

export default function ContactPage() {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/contact', siteUrl).toString()

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Outsourced Pro Global',
    url: pageUrl,
    description:
      'Official contact channels and inquiry form for Outsourced Pro Global institutional clients and candidates.',
    mainEntity: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteUrl.toString(),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'inquiries@opglobal.com.hk',
          availableLanguage: ['English'],
        },
        {
          '@type': 'ContactPoint',
          contactType: 'human resources',
          email: 'recruitment@opglobal.com.hk',
          availableLanguage: ['English'],
        },
      ],
    },
  }

  return (
    <main className="contact-page">
      {/* Schema.org ContactPage JSON-LD */}
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
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
          <p className="eyebrow">Get In Touch</p>
          <h1 className="contact-hero__title">Start a Conversation with OPG</h1>
          <p className="contact-hero__lead">
            Whether you are evaluating dedicated cross-border pods or exploring your next
            career move, our global team is ready to assist.
          </p>
        </header>

        {/* Two-Column Grid: Left Info / Right Interactive Form */}
        <div className="contact-layout-grid">
          <div className="contact-info-column">
            <Card eyebrow="Official Channels" title="Direct Communication">
              <div className="contact-channel-item">
                <span className="contact-channel-label">Client & Institutional Inquiries:</span>
                <a
                  className="contact-channel-value"
                  href="mailto:inquiries@opglobal.com.hk"
                >
                  inquiries@opglobal.com.hk
                </a>
                <p className="contact-channel-desc">
                  For staffing scopes, dedicated teams, and commercial agreements.
                </p>
              </div>

              <div className="contact-channel-item">
                <span className="contact-channel-label">Talent & Recruitment:</span>
                <a
                  className="contact-channel-value"
                  href="mailto:recruitment@opglobal.com.hk"
                >
                  recruitment@opglobal.com.hk
                </a>
                <p className="contact-channel-desc">
                  For candidate inquiries and application verifications.
                </p>
              </div>
            </Card>

            <Card eyebrow="Headquarters & Presence" title="Global Operations">
              <div className="contact-channel-item">
                <span className="contact-channel-label">Registered Office:</span>
                <address className="contact-address">
                  Outsourced Pro Global Ltd.
                  <br />
                  Central, Hong Kong SAR
                </address>
              </div>

              <div className="contact-channel-item">
                <span className="contact-channel-label">Operational Coverage:</span>
                <p className="contact-channel-desc">
                  Active delivery centers across APAC, EMEA, and the Americas ensuring 24/5
                  cross-time-zone synchronization.
                </p>
              </div>

              <div className="contact-channel-item">
                <span className="contact-channel-label">Service Level Agreement:</span>
                <p className="contact-channel-desc">
                  All inquiries submitted through our verified portal are acknowledged and assigned
                  within <strong>1 business day</strong>.
                </p>
              </div>
            </Card>

            <div className="contact-faq-teaser">
              <h3>Have a quick question?</h3>
              <p>
                Browse our curated answers regarding remote staffing, compliance, onboarding, and
                delivery models.
              </p>
              <Link className="button-link button-link--secondary" href="/faqs">
                View Frequently Asked Questions →
              </Link>
            </div>
          </div>

          <div className="contact-form-column">
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  )
}

