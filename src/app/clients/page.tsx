import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getPublishedTestimonials,
  getVisibleClients,
} from '@/lib/content/clients'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600 // 1 hour ISR

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/clients', siteUrl).toString()
  const title = `Clients & Testimonials | ${siteConfig.shortName}`
  const description =
    'See how ambitious global organizations scale their technical and operational capacity with Outsourced Pro Global.'
  const indexable = isSiteIndexable()

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
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

export default async function ClientsPage() {
  const [clients, testimonials] = await Promise.all([
    getVisibleClients(),
    getPublishedTestimonials(),
  ])

  return (
    <main className="clients-page">
      <div className="container">
        {/* Accessible Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Clients</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="clients-hero">
          <p className="eyebrow">Trusted Partnerships</p>
          <h1 className="clients-hero__title">
            Empowering Ambitious Organizations Across Borders
          </h1>
          <p className="clients-hero__lead">
            From emerging high-growth tech firms to established multinational
            enterprises, our partners rely on OPG talent to accelerate product
            roadmaps, safeguard uptime, and streamline operations.
          </p>
        </header>

        {/* Client Logos Grid */}
        <section aria-label="Client Organizations" className="clients-showcase">
          <h2 className="sr-only">Featured Client Partners</h2>
          {clients.length > 0 ? (
            <div className="clients-grid">
              {clients.map((client) => (
                <div className="client-badge" key={client.id}>
                  <div className="client-badge__logo-mark" aria-hidden="true">
                    🏢
                  </div>
                  <span className="client-badge__name">{client.name}</span>
                  {client.website_url && (
                    <a
                      className="client-badge__link"
                      href={client.website_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Visit site ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              action={<ButtonLink href="/contact">Partner with OPG</ButtonLink>}
              description="Client showcase stories are being prepared with client authorization."
              title="Client Showcase in Preparation"
            />
          )}
        </section>

        {/* Client Testimonials Section */}
        {testimonials.length > 0 && (
          <section aria-labelledby="testimonials-heading" className="clients-testimonials">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Verified Endorsements</p>
                <h2 id="testimonials-heading">What Our Partners Say About OPG</h2>
              </div>
            </div>

            <div className="card-grid">
              {testimonials.map((item) => (
                <Card
                  className="testimonial-card"
                  eyebrow={item.author_company || 'Enterprise Partner'}
                  key={item.id}
                  title={`${item.author_name} · ${item.author_role}`}
                >
                  <blockquote className="testimonial-quote">
                    <p>&ldquo;{item.quote}&rdquo;</p>
                  </blockquote>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Security & Confidentiality Commitment */}
        <section
          aria-labelledby="security-heading"
          className="section section--ink clients-security"
        >
          <div className="container split-panel">
            <div>
              <p className="eyebrow eyebrow--light">Enterprise Security</p>
              <h2 id="security-heading">
                Confidentiality & Compliance at Every Layer
              </h2>
            </div>
            <div>
              <p>
                All team members operate under rigorous mutual NDAs, securely
                configured hardware environments, and strict role-based access
                governance designed to align with ISO 27001 and SOC 2
                compliance expectations.
              </p>
            </div>
          </div>
        </section>

        {/* Conversion CTA */}
        <section aria-label="Next Steps" className="clients-cta">
          <div className="final-cta">
            <div>
              <p className="eyebrow">Start Your Journey</p>
              <h2>Join Our Global Network of Leaders</h2>
            </div>
            <div className="button-row">
              <ButtonLink href="/contact" variant="primary">
                Inquire With Our Team
              </ButtonLink>
              <ButtonLink href="/services" variant="secondary">
                View Engagement Models
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

