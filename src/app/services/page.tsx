import type { Metadata } from 'next'
import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getPublishedServices } from '@/lib/content/services'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600 // 1 hour ISR

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/services', siteUrl).toString()
  const title = `Services & Delivery Models | ${siteConfig.shortName}`
  const description =
    'Explore Outsourced Pro Global services: Dedicated Remote Teams, Staff Augmentation, and Managed Offshore Operations.'
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

export default async function ServicesPage() {
  const services = await getPublishedServices()

  return (
    <main className="services-page">
      <div className="container">
        {/* Accessible Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Services</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="services-hero">
          <p className="eyebrow">What We Do</p>
          <h1 className="services-hero__title">
            Engineered for Performance. Managed for Scale.
          </h1>
          <p className="services-hero__lead">
            We provide structured global workforce solutions designed to meet
            rigorous enterprise standards, whether you need dedicated squads or
            specialized individual capability.
          </p>
        </header>

        {/* Services Grid */}
        <section aria-label="Service Offerings" className="services-catalog">
          {services.length > 0 ? (
            <div className="card-grid">
              {services.map((service, index) => (
                <Card
                  eyebrow={`0${index + 1} · Service Offering`}
                  key={service.id}
                  title={service.title}
                >
                  <p>{service.summary}</p>
                  <div className="service-card__action">
                    <ButtonLink
                      href={`/services/${service.slug}`}
                      variant="secondary"
                    >
                      {service.cta_text || 'Learn more'} →
                    </ButtonLink>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              action={<ButtonLink href="/contact">Inquire with Us</ButtonLink>}
              description="Our comprehensive service catalog is being updated. Contact our team directly to discuss your requirements."
              title="Services Catalog Updating"
            />
          )}
        </section>

        {/* Delivery Standards & Operational Model */}
        <section
          aria-labelledby="delivery-model-heading"
          className="section section--ink delivery-standards"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow eyebrow--light">Operational Assurance</p>
                <h2 id="delivery-model-heading">
                  How We Ensure High-Yield Engagements
                </h2>
              </div>
            </div>
            <div className="card-grid">
              <Card
                eyebrow="Integration"
                title="Seamless Tool & Workflow Embedding"
              >
                <p>
                  Your remote specialists adopt your communication stack (Slack,
                  Teams), sprint cycles (Jira, Linear), and code review
                  standards from day one.
                </p>
              </Card>
              <Card
                eyebrow="Timezone Alignment"
                title="Guaranteed Overlap Hours"
              >
                <p>
                  We structure shift schedules to provide core business hour
                  overlap, enabling synchronous standups, immediate feedback,
                  and agile velocity.
                </p>
              </Card>
              <Card
                eyebrow="Quality Oversight"
                title="Dedicated Account Management"
              >
                <p>
                  Regular performance reviews, proactive retention management,
                  and transparent SLA metrics maintain consistent delivery
                  across engagement lifecycles.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Conversion CTA */}
        <section aria-label="Next Steps" className="services-cta">
          <div className="final-cta">
            <div>
              <p className="eyebrow">Ready to Build?</p>
              <h2>Schedule a Workforce Assessment</h2>
              <p>
                Tell us about your technical and operational requirements. We
                will design a tailored team structure and talent profile.
              </p>
            </div>
            <div className="button-row">
              <ButtonLink href="/contact" variant="primary">
                Contact Our Solutions Team
              </ButtonLink>
              <ButtonLink href="/clients" variant="secondary">
                View Client Stories
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
