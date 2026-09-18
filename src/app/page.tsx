import Link from 'next/link'

import { Aurora } from '@/components/ui/aurora'
import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'
import {
  getPublishedTestimonials,
  getVisibleClients,
} from '@/lib/content/clients'
import type { PageDocument } from '@/lib/content/page-documents'
import { getPublishedServices } from '@/lib/content/services'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour ISR

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: homeDoc }, services, clients, testimonials] =
    await Promise.all([
      supabase
        .from('page_documents')
        .select('*')
        .eq('slug', 'home')
        .maybeSingle<PageDocument>(),
      getPublishedServices(),
      getVisibleClients(),
      getPublishedTestimonials(),
    ])

  const heroTitle =
    homeDoc?.title || 'The right people can move every business forward.'
  const heroSummary =
    homeDoc?.summary ||
    'Outsourced Pro Global helps organizations build strong teams and helps professionals discover their next opportunity.'

  const featuredServices = services.slice(0, 3)
  const featuredTestimonial = testimonials[0]

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <Aurora
          amplitude={0.7}
          blend={0.3}
          colorStops={['#fbe2b4', '#fbe9b4', '#f4e2bf']}
          lightMode
          speed={0.2}
        />
        <div aria-hidden="true" className="hero__scrim" />
        <div className="container hero__content">
          <div className="hero__badge" role="text">
            <span aria-hidden="true" className="hero__badge-dot" />
            <span>Global talent. Thoughtful partnerships.</span>
          </div>
          <h1>{heroTitle}</h1>
          <p className="hero__summary">{heroSummary}</p>
          <div aria-label="Choose your path" className="button-row">
            <ButtonLink href="/services">I’m building a team</ButtonLink>
            <ButtonLink href="/careers" variant="secondary">
              I’m looking for a role
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="section" aria-labelledby="services-heading">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">What we do</p>
              <h2 id="services-heading">People solutions made for real work</h2>
            </div>
            <ButtonLink href="/services" variant="secondary">
              View all services
            </ButtonLink>
          </div>
          <div className="card-grid">
            {featuredServices.map((service, index) => (
              <Card
                eyebrow={`0${index + 1} · Service`}
                key={service.id}
                title={service.title}
              >
                <p>{service.summary}</p>
                <div className="service-card__action">
                  <Link
                    className="text-link"
                    href={`/services/${service.slug}`}
                  >
                    Learn more →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Purpose & Mission Spotlight */}
      <section
        className="section section--light"
        aria-labelledby="purpose-heading"
      >
        <div className="container">
          <div className="spotlight-card">
            <div>
              <p className="eyebrow">Our Mission & Purpose</p>
              <h2 id="purpose-heading">
                Bridging Global Capability with Enduring Human Partnerships
              </h2>
              <p>
                We envision a global workplace where borders do not limit
                capability, where companies scale seamlessly with dedicated
                talent, and where professionals thrive in high-trust roles.
              </p>
            </div>
            <div>
              <ButtonLink href="/mission-and-vision" variant="primary">
                Explore Mission & Vision →
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      {clients.length > 0 && (
        <section
          className="section section--proof"
          aria-label="Client Trust Banner"
        >
          <div className="container">
            <p className="proof-label">Trusted by high-yield global teams</p>
            <div className="proof-strip">
              {clients.slice(0, 5).map((client) => (
                <span className="proof-mark" key={client.id}>
                  {client.name}
                </span>
              ))}
              <Link className="proof-link" href="/clients">
                View all partners →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Testimonial Quote */}
      {featuredTestimonial && (
        <section
          className="section section--ink"
          aria-labelledby="testimonial-heading"
        >
          <div className="container split-panel">
            <div>
              <p className="eyebrow eyebrow--light">Client Endorsement</p>
              <h2 id="testimonial-heading">
                &ldquo;{featuredTestimonial.quote}&rdquo;
              </h2>
              <p className="testimonial-author">
                — {featuredTestimonial.author_name},{' '}
                {featuredTestimonial.author_role} (
                {featuredTestimonial.author_company})
              </p>
            </div>
            <div>
              <p>
                Our partners experience genuine ownership, direct communication
                cadence, and technical alignment from their remote teams.
              </p>
              <ButtonLink href="/clients" variant="secondary">
                Read All Testimonials
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* Final Dual-Conversion CTA */}
      <section className="section" aria-labelledby="cta-heading">
        <div className="container final-cta">
          <div>
            <p className="eyebrow">Start a conversation</p>
            <h2 id="cta-heading">Your next hire. Your next role.</h2>
          </div>
          <div className="button-row">
            <ButtonLink href="/contact">Contact OPG</ButtonLink>
            <ButtonLink href="/careers" variant="secondary">
              View open roles
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
