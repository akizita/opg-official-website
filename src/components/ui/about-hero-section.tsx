'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

import { getTeamPhotoUrl } from '@/lib/content/team-media'

import styles from './about-hero-section.module.css'

export interface AboutHeroSectionProps {
  heroTitle?: string
  heroSummary?: string
  copy: Record<string, string>
}

const COLLAGE_AVATARS = [
  {
    name: 'Armi Escamilla',
    role: 'Talent Acquisition Team Leader',
    img: getTeamPhotoUrl('Armi.png'),
  },
  {
    name: 'Hanna Mariño',
    role: 'Technical Talent Acquisition Specialist',
    img: getTeamPhotoUrl('Hanna.png'),
  },
  {
    name: 'Allen Guevara',
    role: 'Talent Acquisition & HR Operations Specialist',
    img: getTeamPhotoUrl('Allen.png'),
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
        <div className={styles.heroGrid}>
          {/* Left Column: Narrative, Typography & CTAs */}
          <motion.div
            className={styles.leftCol}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Quiet Eyebrow */}
            <motion.p className={styles.eyebrowLabel} variants={itemVariants}>
              {copy.heroBadge || 'About Outsourced Pro Global'}
            </motion.p>

            {/* Main Headline */}
            <motion.h1
              id="about-hero-heading"
              className={styles.heroTitle}
              variants={itemVariants}
            >
              {titlePrefix}
              {titleAccent ? ` ${titleAccent}` : ''}
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

                {/* 2. Portrait Photo Card with Stacked Metric Chips */}
                <div className={styles.portraitWrapper}>
                  <div className={styles.portraitCard}>
                    <Image
                      src={getTeamPhotoUrl('Armi.png')}
                      alt="Armi Escamilla, Talent Acquisition Team Leader at Outsourced Pro Global"
                      fill
                      priority
                      unoptimized
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

              {/* Bottom Row: Individual Glassmorphic Detail Cards (1,000+ Talents, 3+ Years, 98% Retention) */}
              <div className={styles.bottomHubGrid}>
                <div className={styles.bottomHubMetric}>
                  <strong>{copy.card1Metric || '1,000+'}</strong>
                  <em>{copy.card1Title || 'Over 1,000+ Talents'}</em>
                  <span>
                    {copy.card1Description ||
                      'Rigorously vetted professionals across global operations.'}
                  </span>
                </div>
                <div className={styles.bottomHubMetric}>
                  <strong>{copy.card2Metric || '3+ Years'}</strong>
                  <em>{copy.card2Title || 'Over 3+ Years in Service'}</em>
                  <span>
                    {copy.card2Description ||
                      'Delivering sustained operational excellence.'}
                  </span>
                </div>
                <div className={styles.bottomHubMetric}>
                  <strong>{copy.card3Metric || '98%'}</strong>
                  <em>{copy.card3Title || 'Over 98% Client Retention'}</em>
                  <span>
                    {copy.card3Description ||
                      'Building enduring human partnerships.'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
