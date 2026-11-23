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
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { OPG_TEAM_MEMBERS } from '@/lib/content/team-media'

import styles from './about-team-showcase.module.css'

export interface TeamMemberData {
  id: string
  name: string
  position: string
  department: string
  headline: string
  bio: string
  image: string
  linkedin?: string
  alt?: string
}

export const TEAM_MEMBERS: TeamMemberData[] = OPG_TEAM_MEMBERS.map(
  (member) => ({
    id: member.id,
    name: member.name,
    position: member.role,
    department: member.department,
    headline: member.headline,
    bio: member.bio,
    image: member.image,
    linkedin: member.linkedin,
    alt: member.alt,
  }),
)

// Warm amber placeholder blur data URL
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCAxMDAiPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmVkYjMiLz48L3N2Zz4='

export interface AboutTeamShowcaseProps {
  autoplay?: boolean
  autoplayDelay?: number
  copy: Record<string, string>
}

export function AboutTeamShowcase({
  autoplay = false,
  autoplayDelay = 6000,
  copy,
}: AboutTeamShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const members = TEAM_MEMBERS
  const count = members.length
  const activeMember = members[activeIndex] || members[0]

  // Two stacked preview cards behind the front card
  const backMember1 = members[(activeIndex + 1) % count]
  const backMember2 = members[(activeIndex + 2) % count]

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

  const springTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 260, damping: 26 }

  return (
    <section
      aria-labelledby="about-team-showcase-title"
      className={`about-team-showcase ${styles.showcase}`}
      id="leadership-team"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      tabIndex={0}
      role="region"
      aria-label="Our People Team Showcase"
    >
      <div
        className={`container about-team-showcase__container ${styles.container}`}
      >
        {/* Ambient Yellow Aurora Glow Patches */}
        <div
          aria-hidden="true"
          className="about-team-showcase__aurora-blob about-team-showcase__aurora-blob--left"
        />
        <div
          aria-hidden="true"
          className="about-team-showcase__aurora-blob about-team-showcase__aurora-blob--right"
        />

        {/* Section Header */}
        <header className={`about-team-header ${styles.header}`}>
          <div className="about-team-header__content">
            <div className="about-team-badge" role="text">
              <span aria-hidden="true" className="about-team-badge__dot" />
              <span>{copy.teamEyebrow}</span>
            </div>

            <h2
              className={`about-team-title ${styles.title}`}
              id="about-team-showcase-title"
            >
              {copy.teamTitlePrefix}{' '}
              <span className="about-team-title__accent">
                {copy.teamTitleAccent}
              </span>
            </h2>

            <p className={`about-team-lead ${styles.lead}`}>{copy.teamLead}</p>
          </div>

          <div className="about-team-header__action">
            <Link
              className="about-team-cta-btn"
              href="/careers"
              aria-label="Explore career opportunities at Outsourced Pro Global"
            >
              <span>{copy.teamCta || 'Explore Careers'}</span>
              <svg
                aria-hidden="true"
                className="about-team-cta-btn__arrow"
                fill="none"
                height="15"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
                width="15"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </header>

        <div className={`about-team-showcase__grid ${styles.grid}`}>
          {/* Left Column: Member Details Glass Card */}
          <div className="about-team-showcase__content-col">
            <div
              aria-live="polite"
              className={`about-team-card ${styles.card}`}
            >
              <div className={`about-team-card__body ${styles.cardBody}`}>
                {/* Card Meta Top: Pill + Animated Zero-Padded Live Counter */}
                <div className="about-team-card__meta">
                  <span className="about-team-card__pill">
                    {activeMember.department}
                  </span>

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
                            shouldReduceMotion
                              ? undefined
                              : { y: 14, opacity: 0 }
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

                {/* Person Info: Crossfade with AnimatePresence */}
                <div
                  className={`about-team-card__person-wrap ${styles.personWrap}`}
                >
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
                        <h4
                          className={`about-team-card__name ${styles.cardName}`}
                        >
                          {activeMember.name}
                        </h4>
                      </div>

                      {/* Role text */}
                      <p className={`about-team-card__role ${styles.cardRole}`}>
                        {activeMember.position}
                      </p>

                      {/* Bio text */}
                      <p className={`about-team-card__bio ${styles.cardBio}`}>
                        {activeMember.bio}
                      </p>

                      {/* LinkedIn button */}
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
              </div>

              {/* Carousel Controls */}
              <div
                className={`about-team-card__controls ${styles.cardControls}`}
              >
                {/* Progress Dots with Active Pill */}
                <div
                  className={`about-team-card__dots ${styles.cardDots}`}
                  role="tablist"
                  aria-label="Team member slides"
                >
                  {members.map((member, idx) => {
                    const isActive = idx === activeIndex
                    return (
                      <button
                        key={member.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Go to slide ${idx + 1}: ${member.name}`}
                        onClick={() => setActiveIndex(idx)}
                        className={`about-team-card__dot ${styles.cardDot} ${
                          isActive
                            ? `about-team-card__dot--active ${styles.cardDotActive}`
                            : ''
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
            className={`about-team-showcase__portrait-col ${styles.portraitCol}`}
            onTouchEnd={handleTouchEnd}
            onTouchStart={handleTouchStart}
          >
            {/* Card Stack Stage */}
            <div className={`about-team-stack-stage ${styles.stackStage}`}>
              {/* Back Card 2 (Deepest) */}
              <motion.div
                key={`back2-${backMember2.id}`}
                className={`about-team-card-back about-team-card-back--2 ${styles.cardBack}`}
                initial={
                  shouldReduceMotion ? false : { scale: 0.88, opacity: 0.3 }
                }
                animate={{
                  scale: 0.9,
                  rotate: 8,
                  x: 22,
                  y: 11,
                  opacity: 0.4,
                  zIndex: 10,
                }}
                transition={springTransition}
              >
                <Image
                  src={backMember2.image}
                  alt=""
                  fill
                  unoptimized
                  className={`about-team-card-back__img ${styles.cardImg}`}
                  sizes="(max-width: 640px) 260px, 295px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </motion.div>

              {/* Back Card 1 (Mid) */}
              <motion.div
                key={`back1-${backMember1.id}`}
                className={`about-team-card-back about-team-card-back--1 ${styles.cardBack}`}
                initial={
                  shouldReduceMotion ? false : { scale: 0.92, opacity: 0.5 }
                }
                animate={{
                  scale: 0.95,
                  rotate: 4,
                  x: 11,
                  y: 5,
                  opacity: 0.7,
                  zIndex: 20,
                }}
                transition={springTransition}
              >
                <Image
                  src={backMember1.image}
                  alt=""
                  fill
                  unoptimized
                  className={`about-team-card-back__img ${styles.cardImg}`}
                  sizes="(max-width: 640px) 260px, 295px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </motion.div>

              {/* Front Card (Active Portrait) */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={`front-${activeMember.id}`}
                  className={`about-team-card-front ${styles.cardFront}`}
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
                    shouldReduceMotion ? false : { opacity: 0.85, scale: 0.96 }
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
                    shouldReduceMotion ? undefined : { opacity: 0, scale: 0.94 }
                  }
                  transition={springTransition}
                >
                  <Image
                    src={activeMember.image}
                    alt={activeMember.alt || activeMember.name}
                    fill
                    priority
                    unoptimized
                    className={`about-team-card-front__img ${styles.cardImg}`}
                    sizes="(max-width: 640px) 260px, 315px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />

                  {/* Subtle rim highlight */}
                  <div
                    aria-hidden="true"
                    className={`about-team-card-front__rim ${styles.cardRim}`}
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
