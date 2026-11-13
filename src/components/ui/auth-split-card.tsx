'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from '@/app/sign-in/sign-in.module.css'
import { AsciiGlobe } from '@/components/ui/ascii-globe'

const TRUSTED_AVATARS = [
  { src: '/images/testimonial-eleanor-evans.jpg', alt: 'Eleanor Evans' },
  { src: '/images/testimonial-marcus-vance.jpg', alt: 'Marcus Vance' },
  { src: '/images/testimonial-alistair-finch.jpg', alt: 'Alistair Finch' },
  { src: '/images/testimonial-elena-rostova.jpg', alt: 'Elena Rostova' },
]

interface AuthHeroPanelProps {
  badgeText?: string
  headline: string
  description: string
  variant?: 'dark' | 'yellow'
}

/**
 * Inset Hero Card for the Sign-In / Sign-Up split layout.
 * Supports standard dark theme (login) and vibrant yellow-base theme (sign-up).
 * Features an ASCII style globe in the background, official logo (logo-1789740351319.png),
 * talent-focused frosted glass proof badge, and high-impact typography.
 */
export function AuthHeroPanel({
  badgeText = '1,000+ Verified Global Talents',
  headline,
  description,
  variant = 'dark',
}: AuthHeroPanelProps) {
  const isYellow = variant === 'yellow'
  const cardClassName = isYellow
    ? `${styles.heroCard} ${styles.heroCardYellow}`
    : styles.heroCard

  return (
    <aside
      aria-label="Outsource Pro Global Highlights"
      className={cardClassName}
    >
      {/* ASCII Style Globe in Background */}
      <div aria-hidden="true" className={styles.heroGlobeWrap}>
        <AsciiGlobe theme="dark" />
      </div>

      {/* Atmospheric Radial Aura */}
      <div
        aria-hidden="true"
        className={isYellow ? styles.heroAuraYellow : styles.heroAura}
      />

      {/* Top Header Row with Logo Only (Navigations removed) */}
      <div className={styles.heroHeader}>
        <Link
          aria-label="Return to Outsource Pro Global home"
          className={styles.heroBrandLink}
          href="/"
        >
          <Image
            alt="OutPro Global"
            className={styles.heroBrandLogoImg}
            height={38}
            priority
            src="/images/logo-1789740351319.png"
            width={38}
          />
          <span className={styles.heroBrandName}>OutPro Global</span>
        </Link>
      </div>

      {/* Bottom Visual & Typography Cluster */}
      <div className={styles.heroBottom}>
        <div
          className={
            isYellow
              ? `${styles.frostedTrustBadge} ${styles.frostedTrustBadgeYellow}`
              : styles.frostedTrustBadge
          }
        >
          <div className={styles.avatarStack}>
            {TRUSTED_AVATARS.map((avatar, idx) => (
              <Image
                alt={avatar.alt}
                className={styles.avatarImg}
                height={26}
                key={avatar.src}
                src={avatar.src}
                style={{ zIndex: 4 - idx }}
                width={26}
              />
            ))}
          </div>
          <span className={styles.frostedTrustText}>{badgeText}</span>
        </div>

        <h2 className={styles.heroHeadline}>{headline}</h2>
        <p className={styles.heroDescription}>{description}</p>
      </div>
    </aside>
  )
}
