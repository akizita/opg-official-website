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
        height="30"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="30"
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
        height="30"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="30"
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
        height="30"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="30"
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
        height="30"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="30"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
  },
]

const PROCESS_LABELS = ['Sourcing', 'Vetting', 'Onboarding', 'Retention']

const STEP_TARGET_PROGRESS = [0.1, 0.33, 0.55, 0.78]

export function AboutServicesSection() {
  const [activeStep, setActiveStep] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  /* ------------------------------------------------------------------ */
  /*  Scroll-progress driven step detection                              */
  /*  Maps page scroll position through the track to 4 focused stages    */
  /*  Step 4 receives a generous resting buffer so it stays pinned       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Skip on mobile — details are stacked statically
    const mql = window.matchMedia('(max-width: 58rem)')
    let isDesktop = !mql.matches

    let ticking = false

    const update = () => {
      ticking = false
      if (!isDesktop) return

      const rect = track.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return

      // Sticky pins at top: 0
      const scrolled = -rect.top
      const progress = Math.max(0, Math.min(1, scrolled / scrollable))
      let nextStep = 0
      if (progress >= 0.66) {
        nextStep = 3
      } else if (progress >= 0.44) {
        nextStep = 2
      } else if (progress >= 0.22) {
        nextStep = 1
      }
      setActiveStep((prev) => (prev !== nextStep ? nextStep : prev))
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    const onMediaChange = (e: MediaQueryListEvent) => {
      isDesktop = !e.matches
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    mql.addEventListener('change', onMediaChange)
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      mql.removeEventListener('change', onMediaChange)
    }
  }, [])

  /* ------------------------------------------------------------------ */
  /*  Scroll to a specific step position within the track                */
  /* ------------------------------------------------------------------ */
  const scrollToStep = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const rect = track.getBoundingClientRect()
    const scrollable = track.offsetHeight - window.innerHeight
    const targetProgress = STEP_TARGET_PROGRESS[index] ?? 0.1
    const targetScrollTop =
      window.scrollY + rect.top + targetProgress * scrollable

    window.scrollTo({
      top: targetScrollTop,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }, [])

  const activeFeature = SERVICE_FEATURES[activeStep]

  return (
    <section
      aria-labelledby="about-services-heading"
      className="about-services-section is-visible"
      id="what-we-offer"
    >
      {/* ── 1. WHAT WE OFFER HERO SECTION: EXTENDED WARM GRADIENT YELLOW BACKGROUND ── */}
      <div className="about-services-hero-wrap">
        <div className="container about-services-hero-container">
          <div className="about-services-hero">
            <div className="about-services-hero__text">
              <div className="about-services-anim-item">
                <div className="about-services-section__badge">
                  <span className="eyebrow">What We Offer</span>
                </div>
              </div>
              <div className="about-services-anim-item">
                <h2
                  className="about-services-section__title"
                  id="about-services-heading"
                >
                  Our Core Service:{' '}
                  <span className="about-services-section__title-accent">
                    Talent Acquisition
                  </span>
                </h2>
              </div>
              <div className="about-services-anim-item">
                <p className="about-services-section__lead">
                  We connect ambitious companies with world-class offshore
                  professionals. From specialist contributors to integrated pods,
                  our recruitment framework removes administrative friction and
                  builds teams designed to last.
                </p>
              </div>
            </div>

            <div className="about-services-hero__visual about-services-anim-item">
              <div className="about-services-portrait">
                <Image
                  alt="Outsourced Pro Global talent acquisition specialist"
                  className="about-services-portrait__image"
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

      {/* ── 2. HOW OUR PROCESS WORKS SECTION: WARM GRADIENT YELLOW BACKGROUND ── */}
      <div className="about-process-wrap" id="how-our-process-works">
        <div className="about-sticky-process">
          {/* ── Scroll track: defines the total scroll distance ── */}
          <div className="about-sticky-process__track" ref={trackRef}>
            {/* ── Sticky panel: 100vh full-screen pinned view with stationary yellow background ── */}
            <div className="about-sticky-process__sticky">
              <div className="container about-sticky-process__inner">
                <header className="about-sticky-process__intro">
                  <p className="about-sticky-process__eyebrow">
                    How our process works
                  </p>
                  <h3>A clear path from first search to long-term success.</h3>
                  <p className="about-sticky-process__lead">
                    One connected workflow, four focused stages, and a dedicated OPG
                    team keeping every handoff clear.
                  </p>
                </header>

                <div className="about-sticky-process__layout">
                  {/* ── Left column: visual card (cross-fades per step) ── */}
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
                        >
                          {PROCESS_LABELS.map((label, index) => (
                            <button
                              aria-pressed={activeStep === index}
                              className={activeStep === index ? 'is-active' : ''}
                              key={label}
                              onClick={() => scrollToStep(index)}
                              type="button"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        aria-live="polite"
                        className="about-sticky-process__stage"
                      >
                        <div className="about-sticky-process__stage-heading">
                          <span className="about-sticky-process__stage-icon">
                            {activeFeature.icon}
                          </span>
                          <div>
                            <span>
                              Stage{' '}
                              {String(activeStep + 1).padStart(2, '0')}
                            </span>
                            <strong>{activeFeature.tag}</strong>
                          </div>
                        </div>

                        <h4>{activeFeature.title}</h4>

                        <div className="about-sticky-process__preview-list">
                          {activeFeature.bullets.map((bullet, index) => (
                            <div
                              className="about-sticky-process__preview-row"
                              key={bullet}
                            >
                              <span>
                                {String(index + 1).padStart(2, '0')}
                              </span>
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

                  {/* ── Right column: cross-fading detail panels ── */}
                  <div
                    className="about-sticky-process__details"
                    role="region"
                    aria-label="Process details"
                  >
                    {SERVICE_FEATURES.map((item, index) => (
                      <div
                        aria-hidden={activeStep !== index}
                        className={`about-sticky-process__detail${activeStep === index ? ' is-active' : ''}`}
                        key={item.title}
                      >
                        <div className="about-sticky-process__detail-heading">
                          <span aria-hidden="true">{item.icon}</span>
                          <p>{item.tag}</p>
                        </div>
                        <h4>{item.title}</h4>
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

                {/* ── Action button: placed cleanly under the two columns ── */}
                <div className="about-services-actions">
                  <ButtonLink
                    className="about-pill-btn about-pill-btn--primary"
                    href="/contact"
                  >
                    Explore Our Services
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutServicesSection
