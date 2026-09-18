import Image from 'next/image'
import Link from 'next/link'

import { Aurora } from '@/components/ui/aurora'
import { ButtonLink } from '@/components/ui/button-link'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import {
  getPublishedTestimonials,
  getVisibleClients,
} from '@/lib/content/clients'
import type { PageDocument } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

const ABOUT_IMAGE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/hero/rs-1789740267024.png'

export const revalidate = 3600 // 1 hour ISR

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: homeDoc }, clients, testimonials] = await Promise.all([
    supabase
      .from('page_documents')
      .select('*')
      .eq('slug', 'home')
      .maybeSingle<PageDocument>(),
    getVisibleClients(),
    getPublishedTestimonials(),
  ])

  const heroTitle =
    homeDoc?.title || 'The right people can move every business forward.'
  const heroSummary =
    homeDoc?.summary ||
    'Outsourced Pro Global helps organizations build strong teams and helps professionals discover their next opportunity.'

  const featuredTestimonial = testimonials[0]

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        {/* Full-width Aurora Wave */}
        <div aria-hidden="true" className="hero__aurora">
          <Aurora
            amplitude={0.8}
            blend={0.35}
            colorStops={['#ea580c', '#f29f04', '#f2b705', '#ffd000', '#f59e0b']}
            speed={1.0}
          />
        </div>

        <div aria-hidden="true" className="hero__scrim" />
        <div className="container hero__content">
          <div className="hero__badge" role="text">
            <span aria-hidden="true" className="hero__badge-dot" />
            <span>Global talent. Thoughtful partnerships.</span>
          </div>
          <h1>{heroTitle}</h1>
          <p className="hero__summary">{heroSummary}</p>
          <div
            aria-label="Choose your path"
            className="button-row hero__cta-row"
          >
            <ButtonLink href="/services">I’m building a team</ButtonLink>
            <ButtonLink href="/careers" variant="secondary">
              I’m looking for a role
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Hero Stats Divider Section (3 React Bits SpotlightCards) */}
      <section className="hero-stats-divider" aria-label="Key highlights">
        <div className="container hero-stats-container">
          <div className="hero-stats-grid">
            {/* Card 1: Over 1000+ Talents */}
            <SpotlightCard className="stat-card">
              <div className="stat-card__badge-row">
                <span className="stat-card__icon-wrapper" aria-hidden="true">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="stat-card__tag">Talent Pool</span>
              </div>
              <div className="stat-card__metric">1,000+</div>
              <h3 className="stat-card__title">Over 1,000+ Talents</h3>
              <p className="stat-card__desc">
                Rigorously vetted professionals and specialized teams matched
                with leading international organizations.
              </p>
            </SpotlightCard>

            {/* Card 2: Over 3+ Years in Service */}
            <SpotlightCard className="stat-card">
              <div className="stat-card__badge-row">
                <span className="stat-card__icon-wrapper" aria-hidden="true">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="stat-card__tag">Proven Track Record</span>
              </div>
              <div className="stat-card__metric">3+ Years</div>
              <h3 className="stat-card__title">Over 3+ Years in Service</h3>
              <p className="stat-card__desc">
                Delivering sustained operational excellence, reliable cadence,
                and seamless remote team integration.
              </p>
            </SpotlightCard>

            {/* Card 3: Client Trust & Retention */}
            <SpotlightCard className="stat-card">
              <div className="stat-card__badge-row">
                <span className="stat-card__icon-wrapper" aria-hidden="true">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m11 17 2 2a1 1 0 0 0 1.42 0l6.58-6.59a1 1 0 0 0 0-1.41l-2.58-2.59a1 1 0 0 0-1.42 0L15 10.59" />
                    <path d="m7 7 5 5" />
                    <path d="M14 6.5 12.5 5a1 1 0 0 0-1.42 0L4.17 11.91a1 1 0 0 0 0 1.41l2.59 2.59a1 1 0 0 0 1.41 0L10.5 13.5" />
                  </svg>
                </span>
                <span className="stat-card__tag">Partnership Trust</span>
              </div>
              <div className="stat-card__metric">98%</div>
              <h3 className="stat-card__title">Over 98% Client Retention</h3>
              <p className="stat-card__desc">
                Building enduring human partnerships that transcend typical
                transactions to drive lasting business growth.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* About Us Overview Section */}
      <section
        className="about-overview"
        aria-labelledby="about-overview-heading"
      >
        <div className="container about-overview__grid">
          {/* Left Side: Team Image from Data Storage */}
          <div className="about-overview__visual">
            <div className="about-overview__image-glow" aria-hidden="true" />
            <div className="about-overview__image-container">
              <Image
                alt="Outsourced Pro Global team"
                className="about-overview__image"
                height={790}
                priority
                sizes="(max-width: 62rem) 100vw, 50vw"
                src={ABOUT_IMAGE_URL}
                width={1120}
              />
            </div>
          </div>

          {/* Right Side: About Us Header, Text Description, and Know More Button */}
          <div className="about-overview__content">
            <p className="eyebrow">Who we are</p>
            <h2 id="about-overview-heading" className="about-overview__title">
              About Us
            </h2>
            <p className="about-overview__text">
              At Outsourced Pro Global Limited, we connect businesses with the
              right people — and people with the right opportunities. With a
              global reach and a personal touch, we make recruitment simple,
              smart, and effective. Our mission is to help companies grow
              stronger and professionals achieve their potential.
            </p>
            <p className="about-overview__text about-overview__text--emphasis">
              More than filling roles, we build lasting partnerships that drive
              success.
            </p>
            <div className="about-overview__action">
              <ButtonLink href="/about">Know more</ButtonLink>
            </div>
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
