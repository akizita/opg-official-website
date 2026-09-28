'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export interface TeamMemberData {
  id: string
  name: string
  position: string
  department: string
  headline: string
  bio: string
  experience: string
  location: string
  specialty: string
  image: string
  linkedin?: string
  alt?: string
}

export const TEAM_MEMBERS: TeamMemberData[] = [
  {
    id: 'hannah-reyes',
    name: 'Hannah Reyes',
    position: 'Director of Global Talent Acquisition',
    department: 'Talent Sourcing & Evaluation',
    headline:
      'Curating specialized offshore shortlists matched precisely to client tech stack and culture in 72 hours.',
    bio: 'With over a decade of technical recruitment leadership, Hannah steers OPG’s 45,000+ candidate network, orchestrating multi-stage technical evaluations and cultural alignment across three continents.',
    experience: '10+ Years Experience',
    location: 'Manila Hub',
    specialty: 'Technical Sourcing & Pipeline Strategy',
    image:
      'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/hannah-1789806689447.png',
    linkedin: 'https://www.linkedin.com/company/outsourced-pro-global',
    alt: 'Hannah Reyes, Director of Global Talent Acquisition',
  },
  {
    id: 'marcus-sterling',
    name: 'Marcus Sterling',
    position: 'VP of Offshore Operations & Delivery',
    department: 'Global Operations & Scaling',
    headline:
      'Engineering scalable offshore pods that integrate smoothly into client sprint cadences.',
    bio: 'Marcus specializes in cross-border operational infrastructure, turnkey equipment logistics, and synchronous workflow alignment for tier-one US and Australian technology enterprises.',
    experience: '12+ Years Experience',
    location: 'Sydney / Cebu Hub',
    specialty: 'Turnkey Logistics & Pod Integration',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    linkedin: 'https://www.linkedin.com/company/outsourced-pro-global',
    alt: 'Marcus Sterling, VP of Offshore Operations',
  },
  {
    id: 'elena-vance',
    name: 'Dr. Elena Vance',
    position: 'Chief Technology Officer & Vetting Lead',
    department: 'Technical Rigor & Code Quality',
    headline:
      'Conducting rigorous architecture reviews, live coding, and technical problem-solving assessments.',
    bio: 'Former principal systems architect, Elena designs OPG’s domain-specific technical evaluation tracks, ensuring senior engineers and data specialists meet strict top 1.5% acceptance thresholds.',
    experience: '14+ Years Experience',
    location: 'Singapore / Manila',
    specialty: 'Systems Architecture & Live Vetting',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    linkedin: 'https://www.linkedin.com/company/outsourced-pro-global',
    alt: 'Dr. Elena Vance, Chief Technology Officer',
  },
  {
    id: 'julian-alvarez',
    name: 'Julian Alvarez',
    position: 'Head of Client Success & Retention',
    department: 'Client Partnerships & Health',
    headline:
      'Championing long-term retention, proactive feedback loops, and team engagement.',
    bio: 'Julian manages OPG’s client success partnerships, sustaining an industry-leading 98% client retention rate through proactive talent check-ins, structured upskilling, and long-term capacity planning.',
    experience: '9+ Years Experience',
    location: 'London / Global Hub',
    specialty: 'Pod Health & Retention Governance',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    linkedin: 'https://www.linkedin.com/company/outsourced-pro-global',
    alt: 'Julian Alvarez, Head of Client Success',
  },
  {
    id: 'sophia-chen',
    name: 'Sophia Chen',
    position: 'Head of Legal & Global Compliance',
    department: 'Governance & International Law',
    headline:
      'Navigating multi-jurisdictional labor frameworks, IP security, and bulletproof benefits governance.',
    bio: 'Sophia brings deep legal expertise in international employment law, establishing localized compliant contracts, airtight IP protection agreements, and frictionless payroll operations across all offshore centers.',
    experience: '11+ Years Experience',
    location: 'Hong Kong / Clark Hub',
    specialty: 'Cross-Border Employment Law & IP Security',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    linkedin: 'https://www.linkedin.com/company/outsourced-pro-global',
    alt: 'Sophia Chen, Head of Legal & Global Compliance',
  },
]

// Warm amber placeholder blur data URL
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCAxMDAiPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmVkYjMiLz48L3N2Zz4='

export interface AboutTeamShowcaseProps {
  autoplay?: boolean
  autoplayDelay?: number
}

export function AboutTeamShowcase({
  autoplay = false,
  autoplayDelay = 6000,
}: AboutTeamShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const count = TEAM_MEMBERS.length
  const activeMember = TEAM_MEMBERS[activeIndex] || TEAM_MEMBERS[0]

  // Two stacked preview cards behind the front card
  const backMember1 = TEAM_MEMBERS[(activeIndex + 1) % count]
  const backMember2 = TEAM_MEMBERS[(activeIndex + 2) % count]

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count)
  }, [count])

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + count) % count)
  }, [count])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    },
    [handlePrev, handleNext],
  )

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null)
  const handleTouchStart = (e: ReactTouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: ReactTouchEvent) => {
    if (touchStartXRef.current === null) return
    const diff = touchStartXRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext()
      else handlePrev()
    }
    touchStartXRef.current = null
  }

  // Optional autoplay (pauses on hover/focus)
  useEffect(() => {
    if (!autoplay || isPaused) return
    const timer = setInterval(() => {
      handleNext()
    }, autoplayDelay)
    return () => clearInterval(timer)
  }, [autoplay, autoplayDelay, isPaused, handleNext])

  // Spring physics requested: stiffness 260, damping 26
  const springTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 260, damping: 26 }

  return (
    <section
      aria-labelledby="about-team-showcase-title"
      className="about-team-showcase"
      id="leadership-team"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      tabIndex={0}
      role="region"
      aria-label="Our People Leadership Showcase"
    >
      <div className="container about-team-showcase__container">
        <div className="about-team-showcase__grid">
          {/* Left Column: Headline, High-Contrast Paragraph & Info Card */}
          <div className="about-team-showcase__content-col">
            {/* Soft Radial Backdrop to fade out dots behind headline & paragraph */}
            <div
              aria-hidden="true"
              className="about-team-showcase__text-backdrop"
            />

            <header className="about-team-header">
              <div className="about-team-badge" role="text">
                <span aria-hidden="true" className="about-team-badge__dot" />
                <span>Our People</span>
              </div>

              <h2 className="about-team-title" id="about-team-showcase-title">
                The Leadership Driving{' '}
                <span className="about-team-title__accent">
                  Global Excellence
                </span>
              </h2>

              {/* High contrast paragraph meeting WCAG AAA (>7:1) */}
              <p className="about-team-lead">
                Meet the leaders and domain specialists orchestrating seamless
                cross-border recruitment, airtight compliance, and sustained
                remote team retention.
              </p>
            </header>

            {/* Member Details Card with Live Counter, 2-line Bio & LinkedIn Link */}
            <div aria-live="polite" className="about-team-card">
              {/* Card Meta Top: Pill + Animated Zero-Padded Live Counter */}
              <div className="about-team-card__meta">
                <span className="about-team-card__pill">Leadership Pod</span>

                {/* Tabular numbers live counter with smooth roll */}
                <div className="about-team-card__counter">
                  <span className="about-team-card__counter-curr-box">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={activeIndex}
                        initial={
                          shouldReduceMotion ? false : { y: -14, opacity: 0 }
                        }
                        animate={{ y: 0, opacity: 1 }}
                        exit={
                          shouldReduceMotion ? undefined : { y: 14, opacity: 0 }
                        }
                        transition={{ duration: 0.2 }}
                        className="about-team-card__counter-curr"
                      >
                        {String(activeIndex + 1).padStart(2, '0')}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="about-team-card__counter-sep">/</span>
                  <span className="about-team-card__counter-total">
                    {String(count).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Group Tagline Header */}
              <h3 className="about-team-card__group-title">
                Dedicated Specialist Leadership
              </h3>

              {/* Subtle Warm Divider */}
              <div
                aria-hidden="true"
                className="about-team-card__divider"
              />

              {/* Person Info: Crossfade with AnimatePresence and strictly clamped height for ZERO layout shift */}
              <div className="about-team-card__person-wrap">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMember.id}
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, y: 6 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion ? undefined : { opacity: 0, y: -6 }
                    }
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="about-team-card__person"
                  >
                    <div className="about-team-card__name-row">
                      <h4 className="about-team-card__name">
                        {activeMember.name}
                      </h4>
                    </div>

                    {/* Role text: text-lg font-semibold with brand amber-700 color */}
                    <p className="about-team-card__role">
                      {activeMember.position}
                    </p>

                    {/* 2-line bio: line-clamp-2 guarantees no layout shift */}
                    <p className="about-team-card__bio">
                      {activeMember.bio}
                    </p>

                    {/* Highly visible LinkedIn button placed under member description */}
                    <div className="about-team-card__actions">
                      <a
                        href={
                          activeMember.linkedin ||
                          'https://www.linkedin.com/company/outsourced-pro-global'
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${activeMember.name}'s LinkedIn profile`}
                        className="about-team-card__linkedin-btn"
                      >
                        <span
                          className="about-team-card__linkedin-btn-icon"
                          aria-hidden="true"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            width="14"
                            height="14"
                          >
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </span>
                        <span className="about-team-card__linkedin-btn-label">
                          Connect on LinkedIn
                        </span>
                        <svg
                          className="about-team-card__linkedin-btn-arrow"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </a>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carousel Controls: Left-aligned Progress Indicator Dots */}
              <div className="about-team-card__controls">
                {/* Progress Dots with Active Pill */}
                <div
                  className="about-team-card__dots"
                  role="tablist"
                  aria-label="Team member slides"
                >
                  {TEAM_MEMBERS.map((member, idx) => {
                    const isActive = idx === activeIndex
                    return (
                      <button
                        key={member.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Go to slide ${idx + 1}: ${member.name}`}
                        onClick={() => setActiveIndex(idx)}
                        className={`about-team-card__dot ${
                          isActive ? 'about-team-card__dot--active' : ''
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portrait Card Stack */}
          <div
            className="about-team-showcase__portrait-col"
            onTouchEnd={handleTouchEnd}
            onTouchStart={handleTouchStart}
          >
            {/* Card Stack Stage (aspect-[4/5] 380px) */}
            <div className="about-team-stack-stage">
              {/* Back Card 2 (Deepest): scale 0.90, rotate ~8.5deg, opacity 0.4, soft shadow */}
              <motion.div
                key={`back2-${backMember2.id}`}
                className="about-team-card-back about-team-card-back--2"
                initial={
                  shouldReduceMotion ? false : { scale: 0.88, opacity: 0.3 }
                }
                animate={{
                  scale: 0.9,
                  rotate: 8.5,
                  x: 32,
                  y: 16,
                  opacity: 0.4,
                  zIndex: 10,
                }}
                transition={springTransition}
              >
                <Image
                  src={backMember2.image}
                  alt=""
                  fill
                  className="about-team-card-back__img"
                  sizes="380px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </motion.div>

              {/* Back Card 1 (Mid): scale 0.95, rotate ~4.5deg, opacity 0.7, soft shadow */}
              <motion.div
                key={`back1-${backMember1.id}`}
                className="about-team-card-back about-team-card-back--1"
                initial={
                  shouldReduceMotion ? false : { scale: 0.92, opacity: 0.5 }
                }
                animate={{
                  scale: 0.95,
                  rotate: 4.5,
                  x: 16,
                  y: 8,
                  opacity: 0.7,
                  zIndex: 20,
                }}
                transition={springTransition}
              >
                <Image
                  src={backMember1.image}
                  alt=""
                  fill
                  className="about-team-card-back__img"
                  sizes="380px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </motion.div>

              {/* Front Card (Active Portrait): aspect-[4/5] object-cover object-top, 1px border-amber, hover lift 2px */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={`front-${activeMember.id}`}
                  className="about-team-card-front"
                  onClick={handleNext}
                  role="button"
                  tabIndex={0}
                  aria-label={`${activeMember.name}, ${activeMember.position} - Click to view next member`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNext()
                    }
                  }}
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0.85, scale: 0.96 }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    zIndex: 30,
                  }}
                  exit={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 0, scale: 0.94 }
                  }
                  transition={springTransition}
                >
                  <Image
                    src={activeMember.image}
                    alt={activeMember.name}
                    fill
                    priority
                    className="about-team-card-front__img"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 340px, 380px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />

                  {/* Subtle rim highlight */}
                  <div
                    aria-hidden="true"
                    className="about-team-card-front__rim"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutTeamShowcase
