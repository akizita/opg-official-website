'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Aurora } from '@/components/ui/aurora'
import { ClientLogo, type ClientLogoType } from '@/components/ui/client-logo'

export type PartnerProfileItem = {
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
  social?: string
  facebook?: string
  instagram?: string
  x?: string
  logoType: ClientLogoType
}

type ClientsPartnerProfilesProps = {
  partners: readonly PartnerProfileItem[]
}

// Target progress fractions for 5 steps when clicking in the index
const STEP_TARGET_PROGRESS = [0.06, 0.28, 0.50, 0.72, 0.92]

function WebsiteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.1 20.45H3.54V8.98H7.1v11.47Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
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
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function ClientsPartnerProfiles({
  partners,
}: ClientsPartnerProfilesProps) {
  const [activeStep, setActiveStep] = useState(0)
  const activeStepRef = useRef(activeStep)
  const isLockedRef = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const navItemRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  const total = partners.length

  useEffect(() => {
    activeStepRef.current = activeStep
  }, [activeStep])

  /* ------------------------------------------------------------------ */
  /* Scroll directly to a specific step position in the 320vh track     */
  /* ------------------------------------------------------------------ */
  const scrollToStep = useCallback(
    (index: number) => {
      const isMobile = window.matchMedia('(max-width: 64rem)').matches
      if (isMobile) {
        setActiveStep(index)
        return
      }

      const track = trackRef.current
      if (!track) return

      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      const rect = track.getBoundingClientRect()
      const scrollable = track.offsetHeight - window.innerHeight
      const targetProgress = STEP_TARGET_PROGRESS[index] ?? 0.06
      const targetScrollTop =
        window.scrollY + rect.top + targetProgress * scrollable

      window.scrollTo({
        top: targetScrollTop,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    [],
  )

  /* ------------------------------------------------------------------ */
  /* User selection handler (clicking index tab in sidebar)            */
  /* ------------------------------------------------------------------ */
  const handleSelectStep = useCallback(
    (index: number) => {
      isLockedRef.current = true
      activeStepRef.current = index
      setActiveStep(index)
      scrollToStep(index)
      setTimeout(() => {
        isLockedRef.current = false
      }, 520)
    },
    [scrollToStep],
  )

  /* ------------------------------------------------------------------ */
  /* "One-Scroll" Wheel Gesture Progression through Steps               */
  /* A single scroll notch advances directly to next/prev card          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const mql = window.matchMedia('(max-width: 64rem)')
    let isDesktop = !mql.matches

    const onWheel = (e: WheelEvent) => {
      if (!isDesktop || total === 0) return

      const trackEl = trackRef.current
      if (!trackEl) return

      const rect = trackEl.getBoundingClientRect()
      // Active when the sticky section is pinned inside the viewport
      const isPinned = rect.top <= 10 && rect.bottom >= window.innerHeight - 10
      if (!isPinned) return

      // If transition is locked, swallow wheel events to prevent multi-step skipping
      if (isLockedRef.current) {
        if (Math.abs(e.deltaY) > 4) {
          e.preventDefault()
        }
        return
      }

      // Threshold to ignore micro-scroll jitter
      if (Math.abs(e.deltaY) < 16) return

      const current = activeStepRef.current

      if (e.deltaY > 0) {
        // Scrolled DOWN
        if (current < total - 1) {
          e.preventDefault()
          const next = current + 1
          isLockedRef.current = true
          activeStepRef.current = next
          setActiveStep(next)
          scrollToStep(next)
          setTimeout(() => {
            isLockedRef.current = false
          }, 520)
        }
        // At the last card, do NOT preventDefault so user flows into the next section
      } else if (e.deltaY < 0) {
        // Scrolled UP
        if (current > 0) {
          e.preventDefault()
          const prev = current - 1
          isLockedRef.current = true
          activeStepRef.current = prev
          setActiveStep(prev)
          scrollToStep(prev)
          setTimeout(() => {
            isLockedRef.current = false
          }, 520)
        }
        // At the first card, do NOT preventDefault so user flows back to previous section
      }
    }

    const onMediaChange = (e: MediaQueryListEvent) => {
      isDesktop = !e.matches
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    mql.addEventListener('change', onMediaChange)

    return () => {
      window.removeEventListener('wheel', onWheel)
      mql.removeEventListener('change', onMediaChange)
    }
  }, [total, scrollToStep])

  /* ------------------------------------------------------------------ */
  /* Scroll tracking fallback for manual scrollbar drag                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const mql = window.matchMedia('(max-width: 64rem)')
    let isDesktop = !mql.matches
    let ticking = false

    const update = () => {
      ticking = false
      if (!isDesktop || total === 0 || isLockedRef.current) return

      const rect = track.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      if (scrollable <= 0) return

      const scrolled = -rect.top
      const progress = Math.max(0, Math.min(1, scrolled / scrollable))

      let nextStep = 0
      if (progress >= 0.80) {
        nextStep = 4
      } else if (progress >= 0.60) {
        nextStep = 3
      } else if (progress >= 0.40) {
        nextStep = 2
      } else if (progress >= 0.20) {
        nextStep = 1
      }

      nextStep = Math.min(nextStep, total - 1)
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
  }, [total])

  /* ------------------------------------------------------------------ */
  /* Mobile: keep active tab in horizontal scroll centered             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!window.matchMedia('(max-width: 64rem)').matches) return

    const nav = navRef.current
    const activeItem = navItemRefs.current.get(activeStep)
    if (!nav || !activeItem) return

    nav.scrollTo({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      left:
        activeItem.offsetLeft - (nav.clientWidth - activeItem.clientWidth) / 2,
    })
  }, [activeStep])

  if (total === 0) return null

  return (
    <div className="clients-sticky-directory" id="clients-directory">
      {/* ── Scroll track: defines total scroll travel (matching About page) ── */}
      <div className="clients-sticky-directory__track" ref={trackRef}>
        {/* ── Sticky 100vh viewport frame ── */}
        <div className="clients-sticky-directory__sticky">
          {/* Full-width Aurora Wave (matching Home page hero) */}
          <div
            aria-hidden="true"
            className="clients-sticky-directory__aurora"
          >
            <Aurora
              amplitude={0.8}
              blend={0.35}
              colorStops={['#ea580c', '#f29f04', '#f2b705', '#ffd000', '#f59e0b']}
              speed={1.0}
            />
          </div>

          <div
            aria-hidden="true"
            className="clients-sticky-directory__scrim"
          />

          <div className="container clients-sticky-directory__inner">
            {/* Executive Section Intro Header (matching Hero standards) */}
            <header className="clients-sticky-directory__intro">
              <div className="clients-sticky-directory__badge" role="text">
                <span
                  aria-hidden="true"
                  className="clients-sticky-directory__badge-dot"
                />
                <span>Partner Profiles</span>
              </div>
              <h2 id="clients-directory-heading">
                Client Directory &amp; Operational Footprint
              </h2>
              <p className="clients-sticky-directory__lead">
                A comprehensive view of each partner company, their industry
                specialization, the dedicated offshore pod powering their
                growth, and direct links to connect with their brand.
              </p>
            </header>

            {/* 2-Column layout: Sidebar on left, cross-fading card deck on right */}
            <div className="client-profile-scroll">
              <aside
                className="client-profile-index"
                aria-label="Partner profile navigation"
              >
                <div className="client-profile-index__header">
                  <div>
                    <span className="client-profile-index__eyebrow">
                      Partner index
                    </span>
                    <p className="client-profile-index__title">
                      Explore our network
                    </p>
                  </div>
                  <span
                    className="client-profile-index__counter"
                    aria-live="polite"
                  >
                    {String(activeStep + 1).padStart(2, '0')}
                    <span aria-hidden="true"> / </span>
                    {String(total).padStart(2, '0')}
                  </span>
                </div>

                <div
                  className="client-profile-index__progress"
                  aria-hidden="true"
                >
                  <span
                    style={{
                      transform: `scaleX(${(activeStep + 1) / total})`,
                    }}
                  />
                </div>

                <nav
                  ref={navRef}
                  className="client-profile-index__nav"
                  aria-label="Choose a partner"
                >
                  {partners.map((partner, index) => {
                    const isActive = index === activeStep
                    return (
                      <button
                        type="button"
                        key={partner.id}
                        ref={(node) => {
                          if (node) navItemRefs.current.set(index, node)
                          else navItemRefs.current.delete(index)
                        }}
                        className={`client-profile-index__item${isActive ? ' is-active' : ''}`}
                        aria-controls={partner.id}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => handleSelectStep(index)}
                      >
                        <span
                          className="client-profile-index__number"
                          aria-hidden="true"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="client-profile-index__logo">
                          <ClientLogo type={partner.logoType} />
                        </span>
                        <span className="client-profile-index__item-copy">
                          <span className="client-profile-index__name">
                            {partner.name}
                          </span>
                          <span className="client-profile-index__badge">
                            {partner.badge}
                          </span>
                        </span>
                        <span
                          className="client-profile-index__arrow"
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </aside>

              {/* Single-stage card area: Cross-fading panels without stacking overlap */}
              <div
                className="client-profile-panels"
                role="region"
                aria-label="Partner profile details"
              >
                {partners.map((partner, index) => {
                  const isActive = index === activeStep
                  const headingId = `${partner.id}-heading`

                  return (
                    <article
                      id={partner.id}
                      key={partner.id}
                      className={`client-profile-panel${isActive ? ' is-active' : ''}`}
                      aria-hidden={!isActive}
                      aria-labelledby={headingId}
                    >
                      <header className="client-profile-panel__header">
                        <span
                          className="client-profile-panel__number"
                          aria-hidden="true"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="client-profile-panel__status">
                          <span aria-hidden="true" /> Active partnership
                        </span>
                      </header>

                      <div className="client-profile-panel__brand">
                        <div className="client-profile-panel__logo">
                          <ClientLogo type={partner.logoType} />
                        </div>
                        <div>
                          <p className="client-profile-panel__badge">
                            {partner.badge}
                          </p>
                          <h3 id={headingId}>{partner.name}</h3>
                          <p className="client-profile-panel__tagline">
                            {partner.tagline}
                          </p>
                        </div>
                      </div>

                      <p className="client-profile-panel__description">
                        {partner.description}
                      </p>

                      <dl className="client-profile-panel__facts">
                        <div>
                          <dt>Operational base</dt>
                          <dd>{partner.region}</dd>
                        </div>
                        <div>
                          <dt>Dedicated capability</dt>
                          <dd>{partner.podCapability}</dd>
                        </div>
                        <div>
                          <dt>Team footprint</dt>
                          <dd>{partner.talentCount}</dd>
                        </div>
                      </dl>

                      <footer className="client-profile-panel__footer">
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="client-profile-panel__website"
                        >
                          <WebsiteIcon />
                          Visit official website
                          <span aria-hidden="true">↗</span>
                        </a>

                        <div
                          className="client-profile-panel__socials"
                          aria-label={`${partner.name} social links`}
                        >
                          {partner.social && (
                            <a
                              href={partner.social}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${partner.name} on LinkedIn (opens in a new tab)`}
                            >
                              <LinkedInIcon />
                            </a>
                          )}
                          {partner.facebook && (
                            <a
                              href={partner.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${partner.name} on Facebook (opens in a new tab)`}
                            >
                              <FacebookIcon />
                            </a>
                          )}
                          {partner.instagram && (
                            <a
                              href={partner.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${partner.name} on Instagram (opens in a new tab)`}
                            >
                              <InstagramIcon />
                            </a>
                          )}
                          {partner.x && (
                            <a
                              href={partner.x}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${partner.name} on X (opens in a new tab)`}
                            >
                              <XIcon />
                            </a>
                          )}
                        </div>
                      </footer>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
