'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'

import { ButtonLink } from '@/components/ui/button-link'

const HANNAH_IMAGE_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/hannah-1789806689447.png'

interface ServiceFeature {
  title: string
  tag: string
  summary: string
  bullets: string[]
  icon: ReactNode
}

const SERVICE_FEATURES: ServiceFeature[] = [
  {
    title: 'Candidate Sourcing',
    tag: 'Global Discovery',
    summary:
      'We turn a broad global search into a focused shortlist built around your role, stack, and working culture.',
    bullets: [
      'Pre-vetted network of 45,000+ specialized offshore professionals',
      'Curated candidate shortlists matched to your stack in 72 hours',
      'Dedicated talent partner managing end-to-end recruitment',
    ],
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="24"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <circle cx="17.5" cy="11.5" r="3.5" />
        <path d="m20 14 2 2" />
      </svg>
    ),
  },
  {
    title: 'Screening & Technical Vetting',
    tag: 'Technical Rigor',
    summary:
      'Every shortlisted professional is assessed for technical depth, communication, and real-world problem solving.',
    bullets: [
      'Live architecture reviews, pair coding, and problem-solving evaluations',
      'CEFR C2 English fluency checks for synchronous collaboration',
      'Strict top 1.5% acceptance threshold across domain applicants',
    ],
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="24"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Turnkey Onboarding Support',
    tag: 'Turnkey Logistics',
    summary:
      'From contracts and equipment to the first team sync, we coordinate the details that make day one productive.',
    bullets: [
      'Hardware logistics, configured laptops, and security setup',
      'Compliant local contracts, payroll, and IP protection',
      'Day-one integration, sprint planning, and manager welcome sync',
    ],
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="24"
      >
        <rect height="14" rx="2" width="20" x="2" y="7" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
  {
    title: 'Ongoing Talent Pipeline & Retention',
    tag: 'Long-Term Scale',
    summary:
      'The partnership continues after placement with active support for performance, retention, and team growth.',
    bullets: [
      'Dedicated Client Success Director and performance check-ins',
      'Continuous professional development and upskilling support',
      'Replacement guarantee and proactive capacity scaling',
    ],
    icon: (
      <svg
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="24"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
  },
]

function renderHeadingWithAccent(title: string) {
  if (!title) return null

  // If title has an ampersand like "Screening & Technical Vetting"
  if (title.includes('&')) {
    const parts = title.split('&')
    return (
      <>
        <span>{parts[0].trim()}</span> &amp;{' '}
        <span className="about-sticky-process__title-accent">
          {parts.slice(1).join('&').trim()}
        </span>
      </>
    )
  }

  // If title includes "long-term success"
  if (title.toLowerCase().includes('long-term success')) {
    const parts = title.split(/long-term success/i)
    return (
      <>
        <span>{parts[0]}</span>{' '}
        <span className="about-sticky-process__title-accent">
          long-term success{parts[1] || ''}
        </span>
      </>
    )
  }

  // General fallback: accent on the last 1-2 words
  const words = title.trim().split(/\s+/)
  if (words.length > 2) {
    const prefix = words.slice(0, -2).join(' ')
    const accent = words.slice(-2).join(' ')
    return (
      <>
        <span>{prefix}</span>{' '}
        <span className="about-sticky-process__title-accent">{accent}</span>
      </>
    )
  }

  if (words.length === 2) {
    return (
      <>
        <span>{words[0]}</span>{' '}
        <span className="about-sticky-process__title-accent">{words[1]}</span>
      </>
    )
  }

  return <span className="about-sticky-process__title-accent">{title}</span>
}

export function AboutServicesSection({
  copy,
}: {
  copy: Record<string, string>
}) {
  const [activeStep, setActiveStep] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  /* ------------------------------------------------------------------ */
  /*  Scroll-progress driven step detection                              */
  /*  Maps page scroll position through the track to 4 equal stages      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Skip sticky progress on mobile (< 58rem) — stages are controlled via tabs
    const mql = window.matchMedia('(max-width: 58rem)')
    let isDesktop = !mql.matches
    let ticking = false

    const update = () => {
      ticking = false
      if (!isDesktop) return

      const rect = track.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return

      // Sticky active range: begins when rect.top <= 0, completes when rect.bottom <= window.innerHeight
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable))
      const step = Math.min(3, Math.floor(progress * 4))
      setActiveStep(step)
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => {
      isDesktop = !mql.matches
      update()
    }
    window.addEventListener('resize', onResize)
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const scrollToStep = useCallback((index: number) => {
    setActiveStep(index)
    const track = trackRef.current
    if (!track) return

    const mql = window.matchMedia('(max-width: 58rem)')
    if (mql.matches) return // on mobile viewport, just switch the active slide

    const rect = track.getBoundingClientRect()
    const scrollable = rect.height - window.innerHeight
    if (scrollable <= 0) return

    const targetScroll =
      window.scrollY + rect.top + (index / 3.99) * scrollable
    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }, [])

  const features = SERVICE_FEATURES.map((feature, index) => {
    const number = index + 1
    return {
      ...feature,
      tag: copy[`service${number}Tag`] || feature.tag,
      title: copy[`service${number}Title`] || feature.title,
      summary: copy[`service${number}Summary`] || feature.summary,
      bullets: copy[`service${number}Bullets`]
        ? copy[`service${number}Bullets`].split(/\r?\n/).filter(Boolean)
        : feature.bullets,
    }
  })
  const activeFeature = features[activeStep]
  const processLabels = features.map(
    (_, index) =>
      copy[`service${index + 1}Label`] ||
      ['Sourcing', 'Vetting', 'Onboarding', 'Retention'][index],
  )

  return (
    <section
      aria-labelledby="about-services-heading"
      className="about-services-section is-visible"
      id="what-we-offer"
    >
      {/* ── 1. WHAT WE OFFER HERO SECTION ── */}
      <div className="about-services-hero-wrap">
        <div className="container about-services-hero-container">
          <div className="about-services-hero">
            <div className="about-services-hero__text">
              <div className="about-services-anim-item">
                <div className="about-services-section__badge">
                  <span className="eyebrow">{copy.servicesEyebrow}</span>
                </div>
              </div>
              <div className="about-services-anim-item">
                <h2
                  className="about-services-section__title"
                  id="about-services-heading"
                >
                  {copy.servicesTitlePrefix}{' '}
                  <span className="about-services-section__title-accent">
                    {copy.servicesTitleAccent}
                  </span>
                </h2>
              </div>
              <div className="about-services-anim-item">
                <p className="about-services-section__lead">
                  {copy.servicesLead}
                </p>
              </div>

              {/* Metric chips to anchor the narrative column */}
              <div className="about-services-hero__metrics about-services-anim-item">
                <div className="about-services-metric-chip">
                  <span
                    className="about-services-metric-chip__icon"
                    aria-hidden="true"
                  >
                    ⚡
                  </span>
                  <div>
                    <strong>72 Hours</strong>
                    <span>Rapid Shortlist</span>
                  </div>
                </div>
                <div className="about-services-metric-chip">
                  <span
                    className="about-services-metric-chip__icon"
                    aria-hidden="true"
                  >
                    🌐
                  </span>
                  <div>
                    <strong>45,000+</strong>
                    <span>Pre-Vetted Network</span>
                  </div>
                </div>
                <div className="about-services-metric-chip">
                  <span
                    className="about-services-metric-chip__icon"
                    aria-hidden="true"
                  >
                    🏆
                  </span>
                  <div>
                    <strong>98%</strong>
                    <span>Retention Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cutout Portrait Visual (No Card Wrapper, Smooth Feathered Soft-Blend Bottom Edge) */}
            <div className="about-services-hero__visual about-services-anim-item">
              <div className="about-services-cutout-frame">
                <Image
                  alt="Hannah Reyes - Director of Global Talent Acquisition at Outsourced Pro Global"
                  className="about-services-cutout-image"
                  height={800}
                  priority
                  sizes="(max-width: 62rem) 100vw, 42vw"
                  src={HANNAH_IMAGE_URL}
                  width={800}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. HOW OUR PROCESS WORKS: STICKY SCROLL TRACK ── */}
      <div className="about-process-wrap" id="how-our-process-works">
        <div className="about-sticky-process__track" ref={trackRef}>
          <div className="about-sticky-process__sticky">
            <div className="container about-sticky-process__inner">
              <header className="about-sticky-process__intro">
                <p className="about-sticky-process__eyebrow">
                  {copy.processEyebrow}
                </p>
                <h3>{renderHeadingWithAccent(copy.processTitle)}</h3>
                <p className="about-sticky-process__lead">
                  {copy.processLead}
                </p>
              </header>

              <div className="about-sticky-process__layout">
                {/* ── Left column: Terminal/Browser Mockup ── */}
                <div className="about-sticky-process__visual-column">
                  <div className="about-sticky-process__visual">
                    <div className="about-sticky-process__window-bar">
                      <span
                        aria-hidden="true"
                        className="about-sticky-process__dots"
                      >
                        <i />
                        <i />
                        <i />
                      </span>
                      <div
                        aria-label="Process stages"
                        className="about-sticky-process__tabs"
                        role="tablist"
                      >
                        {processLabels.map((label, index) => (
                          <button
                            aria-selected={activeStep === index}
                            className={activeStep === index ? 'is-active' : ''}
                            key={label}
                            onClick={() => scrollToStep(index)}
                            role="tab"
                            type="button"
                          >
                            <span className="about-sticky-process__tab-num">
                              0{index + 1}
                            </span>
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      key={activeStep}
                      aria-live="polite"
                      className="about-sticky-process__stage"
                    >
                      <div className="about-sticky-process__stage-heading">
                        <span className="about-sticky-process__stage-icon">
                          {activeFeature.icon}
                        </span>
                        <div>
                          <span>
                            Stage {String(activeStep + 1).padStart(2, '0')}
                          </span>
                          <strong>{activeFeature.tag}</strong>
                        </div>
                      </div>

                      <h4>{renderHeadingWithAccent(activeFeature.title)}</h4>

                      <div className="about-sticky-process__preview-list">
                        {activeFeature.bullets.map((bullet, index) => (
                          <div
                            className="about-sticky-process__preview-row"
                            key={bullet}
                          >
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <strong>{bullet}</strong>
                            <i aria-hidden="true" />
                          </div>
                        ))}
                      </div>

                      <div className="about-sticky-process__stage-footer">
                        <span>OPG managed process</span>
                        <strong>
                          {String(activeStep + 1).padStart(2, '0')} / 04
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right column: Stage Detail & Stepper Sitting Directly on Background ── */}
                <div
                  className="about-sticky-process__details"
                  role="region"
                  aria-label="Process details"
                >
                  {features.map((item, index) => (
                    <div
                      aria-hidden={activeStep !== index}
                      className={`about-sticky-process__detail${activeStep === index ? ' is-active' : ''}`}
                      key={item.title}
                    >
                      <div className="about-sticky-process__detail-heading">
                        <span aria-hidden="true">{item.icon}</span>
                        <p>{item.tag}</p>
                      </div>
                      <h4>{renderHeadingWithAccent(item.title)}</h4>
                      <p className="about-sticky-process__summary">
                        {item.summary}
                      </p>
                      <ul className="about-sticky-process__bullets">
                        {item.bullets.map((bullet) => (
                          <li key={bullet}>
                            <span aria-hidden="true">✓</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Action button cleanly placed below ── */}
              <div className="about-services-actions">
                <ButtonLink
                  className="about-pill-btn about-pill-btn--primary"
                  href="/contact"
                >
                  {copy.processCta}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutServicesSection
