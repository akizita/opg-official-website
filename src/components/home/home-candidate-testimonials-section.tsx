'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { UserAvatar } from '@/components/ui/user-avatar'
import type { HomeCandidateTestimonial } from '@/lib/content/home-candidate-testimonials'

import styles from './home-candidate-testimonials-section.module.css'

const EXPANDABLE_QUOTE_THRESHOLD = 210

const publishedDateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

function formatPublishedDate(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return publishedDateFormat.format(parsed)
}

function StarRating({ rating }: { rating: number }) {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)))
  return (
    <div
      aria-label={`${safeRating} out of 5 stars`}
      className={styles.starRatingRow}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < safeRating
        return (
          <svg
            aria-hidden="true"
            className={`${styles.starIcon} ${
              filled ? styles.starIconFilled : styles.starIconMuted
            }`}
            fill="currentColor"
            key={index}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
    </div>
  )
}

function CandidateTestimonialCard({
  index,
  isFeaturedWide,
  item,
  prefersReducedMotion,
}: {
  index: number
  isFeaturedWide: boolean
  item: HomeCandidateTestimonial
  prefersReducedMotion: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflowsClamp, setOverflowsClamp] = useState(
    item.quote.trim().length > EXPANDABLE_QUOTE_THRESHOLD,
  )
  const quoteRef = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    const el = quoteRef.current
    if (!el || expanded) return

    const measure = () => {
      setOverflowsClamp(
        el.scrollHeight - el.clientHeight > 2 ||
          item.quote.trim().length > EXPANDABLE_QUOTE_THRESHOLD,
      )
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [expanded, item.quote])

  const roleLabel =
    item.role_title?.trim() ||
    (item.relationship === 'past' ? 'Past candidate' : 'Prospective candidate')
  const publishedLabel = formatPublishedDate(item.published_at)

  return (
    <motion.article
      className={`${styles.bentoCard} ${isFeaturedWide ? styles.bentoSpanFull : ''}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
      transition={{
        duration: 0.4,
        delay: prefersReducedMotion ? 0 : index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true, margin: '-30px' }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {/* Top Quote Mark + Rating */}
      <div className={styles.cardHeader}>
        <span aria-hidden="true" className={styles.quoteMark}>
          “
        </span>
        {item.rating !== null && <StarRating rating={item.rating} />}
      </div>

      {/* Structured Quote Body with Clean 4-Line Preview & Inline Expand */}
      <div className={styles.quoteSection}>
        <blockquote
          className={`${styles.quoteText} ${
            expanded ? '' : styles.quoteTextClamped
          }`}
          ref={quoteRef}
        >
          {item.quote}
        </blockquote>
        {overflowsClamp && (
          <button
            aria-expanded={expanded}
            className={styles.readMoreBtn}
            onClick={() => setExpanded((prev) => !prev)}
            type="button"
          >
            <span>{expanded ? 'Show less' : 'Read full story'}</span>
          </button>
        )}
      </div>

      {/* Author Identity & Date Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.cardAuthorIdentity}>
          <UserAvatar
            className={styles.avatarWrap}
            fallbackSrc={item.gravatarUrl}
            initialsClassName={styles.avatarInitials}
            name={item.author_name}
            size={40}
            src={item.avatarUrl}
          />
          <div className={styles.authorDetails}>
            <h3 className={styles.authorName}>{item.author_name}</h3>
            <p className={styles.roleTag}>{roleLabel}</p>
          </div>
        </div>
        {publishedLabel && (
          <span className={styles.placementDate}>{publishedLabel}</span>
        )}
      </div>
    </motion.article>
  )
}

export function HomeCandidateTestimonialsSection({
  testimonials = [],
}: {
  testimonials?: HomeCandidateTestimonial[]
}) {
  const prefersReducedMotion = Boolean(useReducedMotion())
  const visibleStories = testimonials.slice(0, 4)
  const layoutMode =
    visibleStories.length === 1
      ? 'single'
      : visibleStories.length === 3
        ? 'featured-three'
        : 'paired'

  return (
    <section
      aria-labelledby="home-candidate-testimonials-heading"
      className={styles.candidateSection}
    >
      {/* Ambient Yellow Aurora Glow Blobs */}
      <div aria-hidden="true" className={styles.auroraGlow1} />
      <div aria-hidden="true" className={styles.auroraGlow2} />

      <div className={styles.container}>
        {/* Header Row */}
        <motion.div
          className={styles.headerRow}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          viewport={{ once: true, margin: '-40px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className={styles.eyebrowLabel}>Candidate Stories</p>

          <h2
            className={styles.headline}
            id="home-candidate-testimonials-heading"
          >
            What Our Candidates Are Saying
          </h2>

          <p className={styles.subtitle}>
            Read verified perspectives from professionals who connected and
            grew their careers with Outsourced Pro Global.
          </p>
        </motion.div>

        {/* Refined Bento Grid Synced with /testimonials */}
        {visibleStories.length > 0 ? (
          <div className={styles.bentoGrid} data-layout={layoutMode}>
            {visibleStories.map((item, index) => (
              <CandidateTestimonialCard
                index={index}
                isFeaturedWide={visibleStories.length === 3 && index === 0}
                item={item}
                key={item.id}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>
              Candidate stories from our community appear here once reviewed and
              published.
            </p>
          </div>
        )}

        {/* Centered Yellow Glass Effect 'View More' Button */}
        <motion.div
          className={styles.ctaRow}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link className={styles.viewMoreGlassBtn} href="/testimonials">
            <span>
              {visibleStories.length > 0 ? 'View More' : 'Share Your Story'}
            </span>
            <svg
              aria-hidden="true"
              className={styles.viewMoreIcon}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
