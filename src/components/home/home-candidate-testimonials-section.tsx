'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

import styles from './home-candidate-testimonials-section.module.css'

export interface CandidateTestimonial {
  id: string
  name: string
  initials: string
  role: string
  quote: string
  date: string
  spanClass: string
}

export const CANDIDATE_TESTIMONIALS: CandidateTestimonial[] = [
  {
    id: 'candidate-aira',
    name: 'Aira Villacorta',
    initials: 'AV',
    role: 'Senior React Engineer',
    quote:
      'OPG matched me with an exceptional fintech team in Sydney. The interview and onboarding was transparent, fast, and respectful of my time from day one.',
    date: 'October 14, 2025',
    spanClass: styles.bentoSpanNarrow,
  },
  {
    id: 'candidate-john',
    name: 'John Clayton Bautista',
    initials: 'JB',
    role: 'Cloud Infrastructure Architect',
    quote:
      'Before joining OPG, managing international remote opportunities often meant unclear expectations. With OPG, enterprise equipment and career growth are handled with world-class precision.',
    date: 'November 18, 2025',
    spanClass: styles.bentoSpanWide,
  },
  {
    id: 'candidate-kristine',
    name: 'Kristine Del Rosario',
    initials: 'KD',
    role: 'Quantitative & Financial Analyst',
    quote:
      "OPG's talent team truly listened to my long-term career aspirations. Within two weeks, I was placed with an Australian wealth management firm where my expertise is celebrated every day.",
    date: 'January 9, 2026',
    spanClass: styles.bentoSpanWide,
  },
  {
    id: 'candidate-mark',
    name: 'Mark Christian Santos',
    initials: 'MS',
    role: 'Full Stack Software Craftsman',
    quote:
      'The culture of trust, competitive compensation, and ongoing professional development at OPG has elevated my software engineering career beyond all expectations.',
    date: 'February 12, 2026',
    spanClass: styles.bentoSpanNarrow,
  },
]

function StarRating() {
  return (
    <div aria-label="5 out of 5 stars" className={styles.starRatingRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          aria-hidden="true"
          className={styles.starIcon}
          fill="currentColor"
          key={i}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function HomeCandidateTestimonialsSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="home-candidate-testimonials-heading"
      className={styles.candidateSection}
    >
      {/* Ambient Yellow Aurora Glow Blobs */}
      <div aria-hidden="true" className={styles.auroraGlow1} />
      <div aria-hidden="true" className={styles.auroraGlow2} />

      <div className={styles.container}>
        {/* Header Row (Guaranteed Single-Line Headline) */}
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
            Discover how top-tier engineers, finance analysts, and cross-border
            specialists accelerate their careers with world-class teams.
          </p>
        </motion.div>

        {/* Compact Bento Grid */}
        <div className={styles.bentoGrid}>
          {CANDIDATE_TESTIMONIALS.map((item, index) => (
            <motion.div
              className={`${styles.bentoCard} ${item.spanClass}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              key={item.id}
              transition={{
                duration: 0.4,
                delay: prefersReducedMotion ? 0 : index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true, margin: '-30px' }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {/* Author Row */}
              <div className={styles.cardAuthorRow}>
                <div className={styles.avatarWrap} aria-hidden="true">
                  <span className={styles.avatarInitials}>
                    {item.initials}
                  </span>
                </div>
                <div className={styles.authorMeta}>
                  <h3 className={styles.authorName}>{item.name}</h3>
                  <StarRating />
                </div>
              </div>

              {/* Quote */}
              <p className={styles.quoteText}>{item.quote}</p>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <span className={styles.placementDate}>{item.date}</span>
                <span className={styles.roleTag}>{item.role}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Centered Yellow Glass Effect 'View More' Button */}
        <motion.div
          className={styles.ctaRow}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Link className={styles.viewMoreGlassBtn} href="/testimonials">
            <span>View More</span>
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
