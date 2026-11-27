'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

import { Masonry, type MasonryItem } from '@/components/ui/masonry'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import type { PublicTeamMember } from '@/lib/content/team'
import { OPG_TEAM_MEMBERS } from '@/lib/content/team-media'

import styles from './home-team-masonry-section.module.css'

const MASONRY_TILE_HEIGHTS = [
  156, 165, 156, 184, 168, 154, 170, 184, 156, 162, 154,
] as const

export const TEAM_MEMBERS_11: MasonryItem[] = OPG_TEAM_MEMBERS.map(
  (member, index) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    department: member.department,
    img: member.image,
    height: MASONRY_TILE_HEIGHTS[index] ?? 125,
    bio: member.bio,
  }),
)

export function HomeTeamMasonrySection({
  members,
}: {
  members?: PublicTeamMember[]
}) {
  const shouldReduceMotion = useReducedMotion()
  const masonryItems: MasonryItem[] =
    members !== undefined
      ? members.map((member, index) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          department: member.department,
          img: resolveSafeArticleImage(member.image).src,
          height:
            member.masonryHeight ||
            MASONRY_TILE_HEIGHTS[index % MASONRY_TILE_HEIGHTS.length] ||
            162,
          bio: member.bio,
          alt: member.alt,
        }))
      : TEAM_MEMBERS_11
  const specialistCount = masonryItems.length

  return (
    <div className={`container ${styles.teamSection}`}>
      <div className={styles.teamGrid}>
        {/* Left Column: Narrative, Key Highlights & Centered CTA */}
        <motion.div
          className={styles.leftColumn}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        >
          <div className={styles.leftContentTop}>
            <p className={styles.eyebrowLabel}>Our Specialists &amp; Leadership</p>

            <h3 className={styles.title}>
              The Dedicated Minds Behind Your Offshore Pods
            </h3>

            <p className={styles.description}>
              Behind every high-performing offshore pod is an elite,
              multidisciplinary team. From technical recruitment to automation,
              verification, and branding support, our {specialistCount || 11}{' '}
              core team members ensure your team operates as a frictionless
              extension of your in-house workforce.
            </p>

            <div className={styles.highlightsList}>
              <div className={styles.highlightItem}>
                <div aria-hidden="true" className={styles.highlightIcon}>
                  <svg
                    fill="none"
                    height="15"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                    width="15"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className={styles.highlightText}>
                  <h4 className={styles.highlightTitle}>
                    {specialistCount || 11} Dedicated Team Specialists
                  </h4>
                  <p className={styles.highlightDesc}>
                    Specialists across technical recruitment, HR operations,
                    automation, employer branding, verification, and marketing.
                  </p>
                </div>
              </div>

              <div className={styles.highlightItem}>
                <div aria-hidden="true" className={styles.highlightIcon}>
                  <svg
                    fill="none"
                    height="15"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                    width="15"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className={styles.highlightText}>
                  <h4 className={styles.highlightTitle}>
                    98% Long-Term Pod Retention
                  </h4>
                  <p className={styles.highlightDesc}>
                    Sustained through proactive talent care, continuous
                    upskilling, and transparent career pathways.
                  </p>
                </div>
              </div>

              <div className={styles.highlightItem}>
                <div aria-hidden="true" className={styles.highlightIcon}>
                  <svg
                    fill="none"
                    height="15"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                    width="15"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className={styles.highlightText}>
                  <h4 className={styles.highlightTitle}>
                    72-Hour Rapid Shortlisting
                  </h4>
                  <p className={styles.highlightDesc}>
                    Pre-screened candidate shortlists evaluated against your
                    specific tech stack and team culture.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <Link className={styles.teamGlassBtn} href="/about">
              <span>Meet our full team</span>
              <span aria-hidden="true" className={styles.btnArrow}>
                →
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Right Column: Balanced 4-Column Portrait Masonry Gallery */}
        <motion.div
          className={styles.rightColumn}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        >
          <Masonry
            columns={4}
            gap={12}
            items={masonryItems}
            lightbox={true}
            showLabels={false}
          />
        </motion.div>
      </div>
    </div>
  )
}
