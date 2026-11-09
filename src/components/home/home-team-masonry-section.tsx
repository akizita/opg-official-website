'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

import { Masonry, type MasonryItem } from '@/components/ui/masonry'

import styles from './home-team-masonry-section.module.css'

export const TEAM_MEMBERS_11: MasonryItem[] = [
  {
    id: 'hannah-reyes',
    name: 'Hannah Reyes',
    role: 'Director of Global Talent Acquisition',
    department: 'Talent Sourcing & Strategy',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    height: 125,
    bio: 'Directs OPG’s 45,000+ candidate network, orchestrating multi-stage technical evaluations and precise cultural alignment in under 72 hours across 3 continents.',
  },
  {
    id: 'marcus-sterling',
    name: 'Marcus Sterling',
    role: 'VP of Offshore Operations & Delivery',
    department: 'Global Operations',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    height: 110,
    bio: 'Specializes in cross-border operational infrastructure, turnkey equipment logistics, and synchronous workflow integration for tier-one technology enterprises.',
  },
  {
    id: 'elena-vance',
    name: 'Dr. Elena Vance',
    role: 'Chief Technology Officer & Vetting Lead',
    department: 'Technical Architecture',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    height: 165,
    bio: 'Former principal systems architect designing domain-specific technical assessment tracks, ensuring senior engineers meet strict top 1.5% acceptance standards.',
  },
  {
    id: 'julian-alvarez',
    name: 'Julian Alvarez',
    role: 'Head of Client Success & Retention',
    department: 'Client Partnerships',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    height: 110,
    bio: 'Sustains OPG’s industry-leading 98% client retention rate through proactive talent check-ins, structured upskilling, and transparent capacity governance.',
  },
  {
    id: 'sophia-chen',
    name: 'Sophia Chen',
    role: 'Head of Legal & Global Compliance',
    department: 'Governance & Labor Law',
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
    height: 125,
    bio: 'Navigates multi-jurisdictional labor frameworks, localized compliant contracts, airtight IP security, and frictionless cross-border payroll operations.',
  },
  {
    id: 'liam-oconnor',
    name: 'Liam O’Connor',
    role: 'Principal Cloud & Systems Architect',
    department: 'Cloud & Infrastructure',
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    height: 155,
    bio: 'Architects zero-trust corporate virtual environments, secure CI/CD pipelines, and high-security remote desktop infrastructure for distributed international pods.',
  },
  {
    id: 'bea-santos',
    name: 'Bea Santos',
    role: 'Head of People Experience & Culture',
    department: 'People Operations',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    height: 125,
    bio: 'Champions continuous professional development, comprehensive health benefits, and thriving pod culture across our Manila and Cebu innovation hubs.',
  },
  {
    id: 'david-kim',
    name: 'David Kim',
    role: 'Head of Quantitative & Financial Talent',
    department: 'Fintech & Analytics',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    height: 110,
    bio: 'Oversees specialized recruitment for chartered accountants, risk analysts, and financial modelers serving top Australian and North American financial firms.',
  },
  {
    id: 'camille-dupont',
    name: 'Camille Dupont',
    role: 'Global Talent Delivery Lead (EMEA)',
    department: 'International Deployment',
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    height: 162,
    bio: 'Directs European client alignment and multi-timezone sprint synchronization, ensuring seamless collaboration between EMEA headquarters and our offshore pods.',
  },
  {
    id: 'carlos-mendez',
    name: 'Carlos Mendez',
    role: 'Lead Technical Recruiter (AI & Platform)',
    department: 'AI & Data Engineering',
    img: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
    height: 110,
    bio: 'Sources, screens, and deploys elite machine learning engineers, MLOps specialists, and full-stack software crafters for high-growth tech companies.',
  },
  {
    id: 'natasha-patel',
    name: 'Natasha Patel',
    role: 'Agile Delivery & Pod Coaching Lead',
    department: 'Agile Operations',
    img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
    height: 125,
    bio: 'Coaches cross-border squads on scrum ceremonies, sprint tracking, and transparent asynchronous delivery to mirror client in-house engineering velocity.',
  },
]

export function HomeTeamMasonrySection() {
  const shouldReduceMotion = useReducedMotion()

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
            <div className={styles.eyebrowBadge}>
              <span aria-hidden="true" className={styles.eyebrowDot} />
              <span>Our Specialists & Leadership</span>
            </div>

            <h3 className={styles.title}>
              The Dedicated Minds Behind{' '}
              <span className={styles.titleAccent}>Your Offshore Pods</span>
            </h3>

            <p className={styles.description}>
              Behind every high-performing offshore pod is an elite,
              multidisciplinary team. From technical vetting to cross-border
              compliance and dedicated people care, our 11 functional leaders
              ensure your team operates as a frictionless extension of your
              in-house workforce.
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
                    11 Core Functional Disciplines
                  </h4>
                  <p className={styles.highlightDesc}>
                    Specialized leaders in technical vetting, compliance, agile
                    coaching, and continuous pod operations.
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
              <span>Meet our full leadership team</span>
              <span aria-hidden="true" className={styles.btnArrow}>
                →
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Right Column: Clean Compact Masonry Gallery (Same Height, No Labels) */}
        <motion.div
          className={styles.rightColumn}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        >
          <Masonry
            columns={3}
            gap={12}
            items={TEAM_MEMBERS_11}
            lightbox={true}
            showLabels={false}
          />
        </motion.div>
      </div>
    </div>
  )
}
