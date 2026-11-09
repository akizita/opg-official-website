'use client'

import {
  ArrowRight01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

import { DotField } from '@/components/ui/dot-field'

import styles from './home-contact-cta-section.module.css'

export interface HomeContactCtaSectionProps {
  eyebrow?: string
  title?: string
  description?: string
  primaryCtaText?: string
  primaryCtaHref?: string
}

export function HomeContactCtaSection({
  eyebrow = 'Start a Conversation',
  title = 'Start building your dedicated offshore team today',
  description = 'Whether you are scaling a dedicated remote pod or exploring talent solutions, Outsource Pro Global builds seamless offshore partnerships that drive tangible growth.',
  primaryCtaText = 'Contact Us Today',
  primaryCtaHref = '/contact',
}: HomeContactCtaSectionProps) {
  return (
    <section
      aria-labelledby="home-contact-cta-heading"
      className={styles.ctaSection}
    >
      {/* Interactive Dot-Field Background */}
      <DotField
        bulgeOnly={true}
        bulgeStrength={85}
        className={styles.ctaDotField}
        cursorRadius={460}
        dotRadius={2.4}
        dotSpacing={20}
        glowColor="#ffe773"
        glowRadius={220}
        gradientFrom="rgba(217, 130, 0, 0.78)"
        gradientTo="rgba(242, 175, 5, 0.68)"
        sparkle={true}
        waveAmplitude={2.5}
      />

      {/* Ambient Yellow Aurora Background Glows */}
      <div aria-hidden="true" className={styles.sectionAurora1} />
      <div aria-hidden="true" className={styles.sectionAurora2} />

      <div className={styles.container}>
        {/* Main CTA Card */}
        <div className={styles.ctaCard}>
          {/* Left Sweeping 3D Torus Arc (Golden Amber) */}
          <div aria-hidden="true" className={styles.leftArcWrapper}>
            <svg
              className={styles.arcSvg}
              fill="none"
              height="320"
              viewBox="0 0 340 320"
              width="340"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="leftTorusGrad"
                  x1="0%"
                  x2="100%"
                  y1="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="40%" stopColor="#f29f04" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>

                <filter
                  height="160%"
                  id="leftArcGlow"
                  width="160%"
                  x="-30%"
                  y="-30%"
                >
                  <feGaussianBlur result="blur" stdDeviation="14" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ambient Glow Underlay */}
              <path
                d="M -20,110 C 30,260 160,280 250,115"
                opacity="0.45"
                stroke="url(#leftTorusGrad)"
                strokeLinecap="round"
                strokeWidth="68"
              />

              {/* Primary 3D Torus Arc */}
              <path
                d="M -20,110 C 30,260 160,280 250,115"
                stroke="url(#leftTorusGrad)"
                strokeLinecap="round"
                strokeWidth="52"
              />
            </svg>
          </div>

          {/* Right Sweeping 3D Torus Dome Arc (Sunshine Gold) */}
          <div aria-hidden="true" className={styles.rightArcWrapper}>
            <svg
              className={styles.arcSvg}
              fill="none"
              height="320"
              viewBox="0 0 340 320"
              width="340"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="rightTorusGrad"
                  x1="0%"
                  x2="100%"
                  y1="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#f29f04" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                <filter
                  height="160%"
                  id="rightArcGlow"
                  width="160%"
                  x="-30%"
                  y="-30%"
                >
                  <feGaussianBlur result="blur" stdDeviation="14" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ambient Glow Underlay */}
              <path
                d="M 90,205 C 170,45 300,55 360,195"
                opacity="0.45"
                stroke="url(#rightTorusGrad)"
                strokeLinecap="round"
                strokeWidth="68"
              />

              {/* Primary 3D Torus Arc */}
              <path
                d="M 90,205 C 170,45 300,55 360,195"
                stroke="url(#rightTorusGrad)"
                strokeLinecap="round"
                strokeWidth="52"
              />
            </svg>
          </div>

          {/* Center Content */}
          <div className={styles.contentWrap}>
            {/* Pill Eyebrow Chip */}
            <div className={styles.eyebrowChip}>
              <span aria-hidden="true" className={styles.chipGlowDot}>
                <HugeiconsIcon icon={SparklesIcon} size={13} />
              </span>
              <span>{eyebrow}</span>
            </div>

            {/* Headline */}
            <h2 className={styles.headline} id="home-contact-cta-heading">
              {title}
            </h2>

            {/* Subtitle */}
            <p className={styles.description}>{description}</p>

            {/* Primary Action Button */}
            <div className={styles.actionsRow}>
              <Link className={styles.primaryCtaBtn} href={primaryCtaHref}>
                <span>{primaryCtaText}</span>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowRight01Icon}
                  size={18}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

