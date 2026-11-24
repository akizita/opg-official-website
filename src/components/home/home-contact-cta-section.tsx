'use client'

import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'

import { AsciiGlobe } from '@/components/ui/ascii-globe'
import { DotField } from '@/components/ui/dot-field'

import styles from './home-contact-cta-section.module.css'

export interface HomeContactCtaSectionProps {
  title?: string
  description?: string
  primaryCtaText?: string
  primaryCtaHref?: string
}

export function HomeContactCtaSection({
  title = 'Start building your dedicated offshore team today',
  description = 'Whether you are scaling a dedicated remote pod or exploring talent solutions, Outsourced Pro Global builds seamless offshore partnerships that drive tangible growth.',
  primaryCtaText = 'Contact Us Today',
  primaryCtaHref = '/contact',
}: HomeContactCtaSectionProps) {
  return (
    <section
      aria-labelledby="home-contact-cta-heading"
      className={`${styles.ctaSection} home-cta-compact`}
    >
      {/* Interactive Dot-Field Background */}
      <DotField
        bulgeOnly={true}
        bulgeStrength={85}
        className={styles.ctaDotField}
        cursorRadius={460}
        dotRadius={2.4}
        dotSpacing={20}
        glowColor="#facc15"
        glowRadius={220}
        gradientFrom="rgba(212, 138, 0, 0.82)"
        gradientTo="rgba(242, 183, 5, 0.74)"
        sparkle={true}
        waveAmplitude={2.5}
      />

      {/* Ambient Yellow Aurora Background Glows */}
      <div aria-hidden="true" className={styles.sectionAurora1} />
      <div aria-hidden="true" className={styles.sectionAurora2} />

      <div className={styles.container}>
        {/* Main CTA Card */}
        <div className={styles.ctaCard}>
          {/* Left Peeking ASCII Globe */}
          <div aria-hidden="true" className={styles.leftGlobePeek}>
            <AsciiGlobe
              className={styles.globeCanvas}
              initialPhi={0.45}
              theme="light"
              tone="yellow"
            />
          </div>

          {/* Right Peeking ASCII Globe */}
          <div aria-hidden="true" className={styles.rightGlobePeek}>
            <AsciiGlobe
              className={styles.globeCanvas}
              initialPhi={2.2}
              theme="light"
              tone="yellow"
            />
          </div>

          {/* Center Content */}
          <div className={styles.contentWrap}>
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

