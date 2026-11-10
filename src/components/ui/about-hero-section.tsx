'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

import { Notice } from '@/components/ui/notice'
import type { PageDocument } from '@/lib/content/page-documents'

import styles from './about-hero-section.module.css'

export interface AboutHeroSectionProps {
  heroTitle?: string
  heroSummary?: string
  copy: Record<string, string>
  isDraft?: boolean
  hasStaffAccess?: boolean
  doc?: PageDocument | null
}

const COLLAGE_AVATARS = [
  {
    name: 'Hannah Reyes',
    role: 'Director of Talent',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Marcus Sterling',
    role: 'VP Offshore Operations',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Dr. Elena Vance',
    role: 'CTO & Vetting Lead',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  },
]

const TRUST_MARKETS = [
  { country: 'Australia', flag: '🇦🇺', hubs: 'Sydney • Melbourne' },
  { country: 'United States', flag: '🇺🇸', hubs: 'CA • NY • TX' },
  { country: 'United Kingdom', flag: '🇬🇧', hubs: 'London' },
  { country: 'Singapore', flag: '🇸🇬', hubs: 'APAC Hub' },
  { country: 'New Zealand', flag: '🇳🇿', hubs: 'Auckland' },
]

export function AboutHeroSection({
  heroTitle,
  heroSummary,
  copy,
  isDraft = false,
  hasStaffAccess = false,
  doc,
}: AboutHeroSectionProps) {
  const shouldReduceMotion = useReducedMotion()

  // Format title gracefully with gradient accent
  const defaultTitle = 'About Outsourced Pro Global'
  const activeTitle = heroTitle || defaultTitle
  let titlePrefix = 'Connecting Global Ambition with'
  let titleAccent = 'Elite Offshore Talent'

  if (activeTitle !== defaultTitle && activeTitle.trim()) {
    if (activeTitle.toLowerCase().startsWith('about ')) {
      titlePrefix = 'About'
      titleAccent = activeTitle.slice(6)
    } else {
      const words = activeTitle.split(' ')
      if (words.length > 2) {
        titlePrefix = words.slice(0, -2).join(' ')
        titleAccent = words.slice(-2).join(' ')
      } else {
        titlePrefix = activeTitle
        titleAccent = ''
      }
    }
  }

  const activeSummary =
    heroSummary ||
    'At Outsourced Pro Global, we empower high-growth enterprises worldwide by building dedicated, high-caliber offshore teams across technology, finance, and operations with unmatched precision.'

  const primaryCta = copy.heroCta || 'Start Your Offshore Pod'
  const secondaryCta = copy.heroScroll || 'Explore Our Approach'

  // Motion variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: 'easeOut' },
    },
  }

  const bentoCardVariants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.75, ease: 'easeOut' },
    },
  }

  return (
    <section className={styles.heroSection} aria-labelledby="about-hero-heading">
      {/* Ambient Yellow Aurora Glow Patches */}
      <div
        aria-hidden="true"
        className={`${styles.auroraBlob} ${styles.auroraBlobLeft}`}
      />
      <div
        aria-hidden="true"
        className={`${styles.auroraBlob} ${styles.auroraBlobRight}`}
      />

      <div className={styles.container}>
        {/* Internal Preview Notice if draft */}
        {isDraft && hasStaffAccess && doc && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Notice
              title="Internal Preview Mode"
              variant="warning"
            >
              You are viewing the About page in staff preview mode. Status:{' '}
              <strong>{doc.status}</strong> (v{doc.version}).
            </Notice>
          </div>
        )}

        <div className={styles.heroGrid}>
          {/* Left Column: Narrative, Typography & CTAs */}
          <motion.div
            className={styles.leftCol}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow Pill Badge */}
            <motion.div className={styles.eyebrowBadge} variants={itemVariants}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span className={styles.eyebrowText}>
                {copy.heroBadge || 'About Outsourced Pro Global'}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              id="about-hero-heading"
              className={styles.heroTitle}
              variants={itemVariants}
            >
              <span className={styles.titlePrefix}>{titlePrefix} </span>
              {titleAccent && (
                <span className={styles.titleAccent}>{titleAccent}</span>
              )}
            </motion.h1>

            {/* Mission & Value Proposition Description */}
            <motion.p className={styles.heroLead} variants={itemVariants}>
              {activeSummary}
            </motion.p>

            {/* Dual CTA Actions */}
            <motion.div className={styles.actionsRow} variants={itemVariants}>
              <Link href="/contact" className={styles.primaryGlassBtn}>
                <span>{primaryCta}</span>
              </Link>

              <a href="#who-we-are" className={styles.secondaryArrowPill}>
                <span className={styles.arrowCircle} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
                <span>{secondaryCta}</span>
              </a>
            </motion.div>

            {/* Trust Proof Strip */}
            <motion.div className={styles.trustStrip} variants={itemVariants}>
              <div className={styles.trustLabel}>
                Trusted by forward-thinking teams across:
              </div>
              <div className={styles.trustBadges}>
                {TRUST_MARKETS.map((market) => (
                  <div
                    key={market.country}
                    className={styles.trustPill}
                    title={`${market.country} — ${market.hubs}`}
                  >
                    <span className={styles.trustFlag} aria-hidden="true">
                      {market.flag}
                    </span>
                    <span>{market.country}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Signature Bento Showcase Collage */}
          <motion.div
            className={styles.rightCol}
            initial="hidden"
            animate="visible"
            variants={bentoCardVariants}
          >
            <div className={styles.bentoContainer}>
              {/* Top Row: Amber Stat Card & Portrait Photo */}
              <div className={styles.bentoTopRow}>
                {/* 1. Amber Stat & Growth Card */}
                <div className={styles.statGrowthCard}>
                  <div>
                    {/* Overlapping candidate avatars */}
                    <div className={styles.avatarStack} aria-label="Selected OPG candidate specialists">
                      {COLLAGE_AVATARS.map((avatar) => (
                        <div key={avatar.name} className={styles.avatarItem} title={`${avatar.name} (${avatar.role})`}>
                          <Image
                            src={avatar.img}
                            alt={avatar.name}
                            width={36}
                            height={36}
                            className={styles.avatarImg}
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>

                    <div className={styles.statMetric}>
                      {copy.heroProof1Value || '1,000+'}
                    </div>
                    <div className={styles.statLabel}>
                      {copy.heroProof1Label || 'Placed Offshore Specialists'}
                    </div>
                  </div>

                  {/* Growth Widget with Ascending Sparkline */}
                  <div className={styles.growthSubcard}>
                    <div className={styles.growthLeft}>
                      <span className={styles.growthTitle}>Proven Pod Growth</span>
                      <span className={styles.growthTag}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                        +42% scaling
                      </span>
                    </div>
                    <div className={styles.growthChartBars} aria-hidden="true">
                      <div className={styles.chartBar} style={{ height: '35%' }} />
                      <div className={styles.chartBar} style={{ height: '55%' }} />
                      <div className={styles.chartBar} style={{ height: '78%' }} />
                      <div className={styles.chartBar} style={{ height: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 2. Floating Circular Rotating Seal / Stamp */}
                <div className={styles.circularStampBadge} aria-hidden="true">
                  <svg viewBox="0 0 100 100" className={styles.rotatingSvg}>
                    <path
                      id="heroStampCircle"
                      d="M 50, 50 m -34, 0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0"
                      fill="none"
                    />
                    <text fontSize="9.6" fontWeight="750" fill="#92400e" letterSpacing="2.2">
                      <textPath href="#heroStampCircle">• OUTSOURCED PRO GLOBAL • EST. 2018 </textPath>
                    </text>
                  </svg>
                  <div className={styles.stampCenterIcon}>✦</div>
                </div>

                {/* 3. Portrait Photo Card with Stacked Metric Chips */}
                <div className={styles.portraitWrapper}>
                  <div className={styles.portraitCard}>
                    <Image
                      src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80"
                      alt="OPG talent delivery leader with digital tablet"
                      fill
                      priority
                      sizes="(max-width: 64rem) 100vw, 30vw"
                      className={styles.portraitImg}
                    />
                    <div className={styles.portraitOverlay} aria-hidden="true" />
                  </div>

                  {/* 3 Floating Glass Metric Chips */}
                  <div className={styles.metricsStack}>
                    <div className={styles.metricChip}>
                      <span className={`${styles.chipNumber} ${styles.chipNumberHighlight}`}>
                        {copy.heroProof2Value || '98%'}
                      </span>
                      <span className={styles.chipLabel}>Pod Retention</span>
                    </div>

                    <div className={styles.metricChip}>
                      <span className={styles.chipNumber}>72h</span>
                      <span className={styles.chipLabel}>Rapid Vetting</span>
                    </div>

                    <div className={styles.metricChip}>
                      <span className={styles.chipNumber}>
                        {copy.heroProof3Value || '11+'}
                      </span>
                      <span className={styles.chipLabel}>Core Disciplines</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Wide Team Collaboration Photo Card */}
              <div className={styles.bottomTeamCard}>
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                  alt="Cross-border agile pod working synchronously with laptops and collaborative boards"
                  fill
                  priority
                  sizes="(max-width: 64rem) 100vw, 50vw"
                  className={styles.teamImg}
                />
                <div className={styles.teamOverlay} aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
