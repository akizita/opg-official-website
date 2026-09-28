import type { Metadata } from 'next'
import Image from 'next/image'

import { ButtonLink } from '@/components/ui/button-link'
import { ColorBends } from '@/components/ui/color-bends'
import { DotField } from '@/components/ui/dot-field'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

export const revalidate = 3600

export type ClientPartner = {
  id: string
  name: string
  badge: string
  industry: string
  region: string
  podCapability: string
  talentCount: string
  tagline: string
  description: string
  website: string
  social: string
  logoType: 'northstar' | 'meridian' | 'harborline' | 'atlas' | 'veridian'
}

const clientPartners: readonly ClientPartner[] = [
  {
    id: 'northstar-labs',
    name: 'Northstar Labs',
    badge: 'Enterprise Software',
    industry: 'Enterprise SaaS & Cloud Systems',
    region: 'North America (San Francisco, CA)',
    podCapability: 'Full-Stack Engineering & QA Automation Pod',
    talentCount: '14 Specialists Placed',
    tagline: 'Cloud-native enterprise workflow intelligence',
    description:
      'Northstar Labs engineers secure, cloud-native workflow automation platforms and distributed collaboration software serving high-growth technology scaleups and global enterprise clients.',
    website: 'https://northstarlabs.example.com',
    social: 'https://www.linkedin.com/company/northstar-labs',
    logoType: 'northstar',
  },
  {
    id: 'meridian-health',
    name: 'Meridian Health',
    badge: 'Digital Health',
    industry: 'Healthcare Technology & Telehealth',
    region: 'Australia (Sydney, NSW)',
    podCapability: '24/7 Care Coordination & Medical Ops Pod',
    talentCount: '18 Specialists Placed',
    tagline: 'Coordinated telehealth and patient-first access',
    description:
      'A premier digital healthcare collective improving clinical access across Australasia through synchronized telehealth support, 24/7 triage workflows, and compassionate care navigation.',
    website: 'https://meridianhealth.example.com',
    social: 'https://www.linkedin.com/company/meridian-health',
    logoType: 'meridian',
  },
  {
    id: 'harborline-finance',
    name: 'Harborline Finance',
    badge: 'Fintech & Compliance',
    industry: 'Financial Services & Risk Management',
    region: 'United Kingdom (London)',
    podCapability: 'AML/KYC Compliance & Settlement Pod',
    talentCount: '9 Specialists Placed',
    tagline: 'Transparent cross-border algorithmic wealth tech',
    description:
      'A regulated fintech firm providing transparent cross-border asset management, algorithmic settlement infrastructure, and institutional-grade regulatory reporting systems.',
    website: 'https://harborlinefinance.example.com',
    social: 'https://www.linkedin.com/company/harborline-finance',
    logoType: 'harborline',
  },
  {
    id: 'atlas-commerce',
    name: 'Atlas Commerce',
    badge: 'E-Commerce & Retail',
    industry: 'Omnichannel Commerce & Logistics',
    region: 'Southeast Asia (Singapore)',
    podCapability: 'Catalog Ops, Retention & Growth Pod',
    talentCount: '16 Specialists Placed',
    tagline: 'Omnichannel marketplace scaling for lifestyle brands',
    description:
      'A fast-scaling multi-channel commerce platform enabling ambitious consumer brands to synchronize catalog feeds, streamline fulfillment pipelines, and accelerate regional marketplace growth.',
    website: 'https://atlascommerce.example.com',
    social: 'https://www.linkedin.com/company/atlas-commerce',
    logoType: 'atlas',
  },
  {
    id: 'veridian-operations',
    name: 'Veridian Operations',
    badge: 'Professional Services',
    industry: 'Management Consulting & Shared Services',
    region: 'Middle East (Dubai, UAE)',
    podCapability: 'Executive Shared Services & BI Pod',
    talentCount: '11 Specialists Placed',
    tagline: 'Resilient operating models and strategic execution',
    description:
      'A leading corporate advisory and management consultancy designing high-agility shared services, automated business intelligence pipelines, and resilient operating models for multinational enterprises.',
    website: 'https://veridianops.example.com',
    social: 'https://www.linkedin.com/company/veridian-operations',
    logoType: 'veridian',
  },
] as const

function ClientLogo({
  type,
  className = '',
}: {
  type: ClientPartner['logoType']
  className?: string
}) {
  switch (type) {
    case 'northstar':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-nl-primary"
              x1="4"
              y1="4"
              x2="44"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f2b705" />
              <stop offset="1" stopColor="#f29f04" />
            </linearGradient>
            <linearGradient
              id="client-logo-nl-facet"
              x1="12"
              y1="12"
              x2="36"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fde047" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M24 3L28.8 19.2L45 24L28.8 28.8L24 45L19.2 28.8L3 24L19.2 19.2L24 3Z"
            fill="url(#client-logo-nl-primary)"
          />
          <path
            d="M24 11L27.2 20.8L37 24L27.2 27.2L24 37L20.8 27.2L11 24L20.8 20.8L24 11Z"
            fill="url(#client-logo-nl-facet)"
          />
          <circle cx="24" cy="24" r="2.5" fill="#0d0d0d" />
        </svg>
      )
    case 'meridian':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-mh-border"
              x1="6"
              y1="6"
              x2="42"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
            <linearGradient
              id="client-logo-mh-pulse"
              x1="10"
              y1="24"
              x2="38"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#059669" />
              <stop offset="1" stopColor="#f2b705" />
            </linearGradient>
          </defs>
          <rect
            x="6"
            y="6"
            width="36"
            height="36"
            rx="12"
            stroke="url(#client-logo-mh-border)"
            strokeWidth="3"
          />
          <path
            d="M13 24H18L21.5 15L26.5 33L30 24H35"
            stroke="url(#client-logo-mh-pulse)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26.5" cy="24" r="2.5" fill="#f29f04" />
        </svg>
      )
    case 'harborline':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-hf-shield"
              x1="8"
              y1="4"
              x2="40"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4f46e5" />
              <stop offset="1" stopColor="#312e81" />
            </linearGradient>
            <linearGradient
              id="client-logo-hf-pillars"
              x1="18"
              y1="16"
              x2="30"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f2b705" />
              <stop offset="1" stopColor="#f29f04" />
            </linearGradient>
          </defs>
          <path
            d="M24 5L41 14V28C41 36.5 33.8 42.5 24 45C14.2 42.5 7 36.5 7 28V14L24 5Z"
            stroke="url(#client-logo-hf-shield)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M19 18V30M24 15V33M29 18V30"
            stroke="url(#client-logo-hf-pillars)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'atlas':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-ac-prism"
              x1="6"
              y1="6"
              x2="42"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <linearGradient
              id="client-logo-ac-fill"
              x1="6"
              y1="6"
              x2="42"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#fef3c7" stopOpacity="0.4" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <polygon
            points="24,5 42,15.5 42,32.5 24,43 6,32.5 6,15.5"
            fill="url(#client-logo-ac-fill)"
            stroke="url(#client-logo-ac-prism)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M24 5V43M6 15.5L42 32.5M6 32.5L42 15.5"
            stroke="url(#client-logo-ac-prism)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="3.5" fill="#f29f04" />
        </svg>
      )
    case 'veridian':
      return (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="client-logo-vo-grad"
              x1="8"
              y1="8"
              x2="40"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path
            d="M24 7L39 19.5L24 32L9 19.5L24 7Z"
            stroke="url(#client-logo-vo-grad)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M13 25L24 35L35 25"
            stroke="#f29f04"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 32L24 39L30.5 32"
            stroke="#f2b705"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="19.5" r="3" fill="#0d0d0d" />
        </svg>
      )
  }
}

function GlobeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="client-pill-link__icon"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="client-pill-link__icon"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const pageUrl = new URL('/clients', siteUrl).toString()
  const title = `Clients & Strategic Partnerships | ${siteConfig.shortName}`
  const description =
    'Discover the forward-thinking organizations that partner with Outsource Pro Global to build dedicated offshore talent pods, scale operations, and accelerate sustainable growth.'
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

export default function ClientsPage() {
  return (
    <main className="clients-page">
      {/* 1. Hero Section: Underlaps Nav, Ambient Dark Base with React Bits ColorBends & Centered 3D Emblem */}
      <section className="clients-hero" aria-labelledby="clients-hero-title">
        <ColorBends
          colors={['#f29f04', '#f2b705', '#d48a00', '#251706', '#ffd159']}
          rotation={45}
          speed={0.22}
          frequency={0.85}
          warpStrength={1.2}
          intensity={1.3}
          scale={1.1}
          bandWidth={5.2}
          noise={0.1}
          transparent={true}
          autoRotate={1.5}
        />

        <div className="clients-hero__vignette" aria-hidden="true" />

        <div className="container clients-hero__container">
          <div className="clients-hero__content">
            <div className="clients-hero__badge" role="text">
              <span
                aria-hidden="true"
                className="clients-hero__badge-pulse"
              />
              <span>Strategic Partnerships &amp; Clients</span>
            </div>

            <h1 id="clients-hero-title" className="clients-hero__title">
              Powering Teams for Industry Leaders{' '}
              <span className="clients-hero__title-accent">Worldwide.</span>
            </h1>

            <p className="clients-hero__lead">
              We collaborate with ambitious organizations across technology,
              healthcare, finance, and commerce to build dedicated,
              high-impact offshore teams that integrate seamlessly with daily
              operations.
            </p>

            <div className="clients-hero__actions">
              <ButtonLink
                href="/contact"
                variant="primary"
                className="clients-hero__btn-primary"
              >
                Partner with Us
              </ButtonLink>
              <a
                href="#client-logos-heading"
                className="clients-hero__btn-secondary"
              >
                Explore Client Work
              </a>
            </div>

            {/* Centered 3D Sculptural Emblem (OPG dynamic dual curved arrows) */}
            <div className="clients-hero__centerpiece" aria-hidden="true">
              <div className="clients-hero__centerpiece-halo" />
              <Image
                src="/images/opg-3d-centerpiece.jpg"
                alt="Outsource Pro Global 3D Emblem"
                width={960}
                height={540}
                priority
                className="clients-hero__centerpiece-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Unified Showcase Band: Horizontal Stats Divider + Interactive DotField + Logos & Directory */}
      <div className="clients-showcase-band">
        <DotField
          dotRadius={2.4}
          dotSpacing={22}
          cursorRadius={460}
          bulgeOnly={true}
          bulgeStrength={80}
          glowRadius={220}
          waveAmplitude={2.2}
          sparkle={true}
          gradientFrom="rgba(217, 130, 0, 0.72)"
          gradientTo="rgba(242, 175, 5, 0.62)"
          glowColor="#ffe773"
        />

        {/* 2A. Horizontal Stats Divider (Spotlight Cards serving as Divider) */}
        <section
          className="clients-stats-divider"
          aria-label="Client partnership metrics"
        >
          <div className="container clients-stats-container">
            <div className="clients-stats-grid">
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
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <span className="stat-card__tag">Scale</span>
                </div>
                <div className="stat-card__metric">05</div>
                <h3 className="stat-card__title">Active Partnerships</h3>
                <p className="stat-card__desc">
                  Long-term dedicated pods embedded directly into core workflows.
                </p>
              </SpotlightCard>

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
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </span>
                  <span className="stat-card__tag">Domains</span>
                </div>
                <div className="stat-card__metric">05</div>
                <h3 className="stat-card__title">Core Industries</h3>
                <p className="stat-card__desc">
                  High-compliance talent specializing in SaaS, Fintech, Health, Commerce &amp; Ops.
                </p>
              </SpotlightCard>

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
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  <span className="stat-card__tag">Retention</span>
                </div>
                <div className="stat-card__metric">98%</div>
                <h3 className="stat-card__title">Partner Retention</h3>
                <p className="stat-card__desc">
                  Consistently renewed multi-year contracts rooted in measurable ROI.
                </p>
              </SpotlightCard>

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
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span className="stat-card__tag">Availability</span>
                </div>
                <div className="stat-card__metric">24/7</div>
                <h3 className="stat-card__title">Global Coverage</h3>
                <p className="stat-card__desc">
                  Synchronized follow-the-sun execution spanning US, UK, APAC, and EMEA.
                </p>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* 2B. Client Logos Showcase */}
        <section
          className="clients-logo-section"
          aria-labelledby="client-logos-heading"
        >
          <div className="container">
            <div className="clients-section-heading clients-section-heading--centered">
              <p className="eyebrow">Enterprise Trust</p>
              <h2 id="client-logos-heading">
                Five Organizations. One Shared Standard of Excellence.
              </h2>
              <p>
                Our client partners rely on Outsource Pro Global to deploy
                vetted, high-performing offshore pods engineered for operational
                longevity, seamless communication, and measurable business
                outcomes.
              </p>
            </div>

            <div className="clients-logo-grid">
              {clientPartners.map((client) => (
                <div
                  className="client-logo-tile client-logo-tile--liquid"
                  key={client.id}
                >
                  <div className="client-logo-tile__shine" aria-hidden="true" />
                  <div className="client-logo-tile__icon-box">
                    <ClientLogo
                      type={client.logoType}
                      className="client-logo-svg"
                    />
                  </div>
                  <span className="client-logo-tile__name">{client.name}</span>
                  <span className="client-logo-tile__badge">
                    {client.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2B. Partner Company Information Directory */}
        <section
          className="clients-directory"
          aria-labelledby="clients-directory-heading"
        >
          <div className="clients-directory__glow" aria-hidden="true" />
          <div className="container clients-directory__container">
            <div className="clients-section-heading">
              <p className="eyebrow">Partner Profiles</p>
              <h2 id="clients-directory-heading">
                Client Directory & Operational Footprint
              </h2>
              <p>
                A comprehensive view of each partner company, their industry
                specialization, the dedicated offshore pod powering their
                growth, and direct links to connect with their brand.
              </p>
            </div>

            <div className="client-profile-grid">
              {clientPartners.map((client, index) => (
                <article
                  className="client-profile-card client-profile-card--liquid"
                  key={client.id}
                >
                  <div
                    className="client-profile-card__shine"
                    aria-hidden="true"
                  />

                  <header className="client-profile-card__header">
                    <div className="client-profile-card__brand">
                      <div className="client-profile-card__logo-wrapper">
                        <ClientLogo
                          type={client.logoType}
                          className="client-profile-card__logo-svg"
                        />
                      </div>
                      <div>
                        <span className="client-profile-card__status">
                          Client Partner
                        </span>
                        <h3 className="client-profile-card__name">
                          {client.name}
                        </h3>
                      </div>
                    </div>
                    <div
                      className="client-profile-card__number"
                      aria-label={`Partner ${index + 1} of ${clientPartners.length}`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </header>

                  <div className="client-profile-card__body">
                    <p className="client-profile-card__tagline">
                      {client.tagline}
                    </p>
                    <p className="client-profile-card__description">
                      {client.description}
                    </p>
                  </div>

                  <dl className="client-profile-card__details">
                    <div className="client-profile-card__detail-item">
                      <dt>Industry Domain</dt>
                      <dd>{client.industry}</dd>
                    </div>
                    <div className="client-profile-card__detail-item">
                      <dt>Headquarters / Region</dt>
                      <dd>{client.region}</dd>
                    </div>
                    <div className="client-profile-card__detail-item">
                      <dt>OPG Dedicated Pod</dt>
                      <dd>{client.podCapability}</dd>
                    </div>
                    <div className="client-profile-card__detail-item">
                      <dt>Talent Footprint</dt>
                      <dd>{client.talentCount}</dd>
                    </div>
                  </dl>

                  <footer className="client-profile-card__links">
                    <a
                      href={client.website}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="client-pill-link"
                      aria-label={`Visit ${client.name} official website (opens in a new tab)`}
                    >
                      <GlobeIcon />
                      <span>Company Website</span>
                      <span
                        aria-hidden="true"
                        className="client-pill-link__arrow"
                      >
                        ↗
                      </span>
                    </a>
                    <a
                      href={client.social}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="client-pill-link client-pill-link--social"
                      aria-label={`Visit ${client.name} on LinkedIn (opens in a new tab)`}
                    >
                      <LinkedInIcon />
                      <span>LinkedIn Profile</span>
                      <span
                        aria-hidden="true"
                        className="client-pill-link__arrow"
                      >
                        ↗
                      </span>
                    </a>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 3. Conversion CTA: Liquid Glass Card, Amber Ambient Glow, Action Buttons */}
      <section
        className="clients-cta"
        aria-label="Become an OPG client partner"
      >
        <div className="container">
          <div className="clients-cta__glass">
            <div className="clients-cta__copy">
              <p className="eyebrow eyebrow--light">Build With OPG</p>
              <h2>Ready to Build Your Dedicated Offshore Team?</h2>
              <p>
                Whether you need specialized software engineers, 24/7 customer
                support champions, or compliance professionals, OPG designs
                bespoke offshore pods ready to deliver from day one.
              </p>
            </div>
            <div className="clients-cta__actions">
              <ButtonLink href="/contact" className="clients-cta__button">
                Start a Conversation
              </ButtonLink>
              <ButtonLink
                href="/services"
                variant="secondary"
                className="clients-cta__button clients-cta__button--secondary"
              >
                Explore Pod Services
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
