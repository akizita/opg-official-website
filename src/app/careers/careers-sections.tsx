import {
  ArrowDown01Icon,
  Briefcase01Icon,
  Globe02Icon,
  Mail01Icon,
  Rocket01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { ButtonLink } from '@/components/ui/button-link'
import { AsciiGlobe } from '@/components/ui/ascii-globe'
import { WorldMapPaths } from '@/components/ui/world-map-paths'

import styles from './careers.module.css'

export function CareerStats({ openRoleCount }: { openRoleCount: number }) {
  const formattedCount = String(openRoleCount).padStart(2, '0')

  return (
    <div className={styles.trustBar} aria-label="Careers at a glance">
      <div className={styles.trustMetricPrimary}>
        <span className={styles.trustMetricValue}>{formattedCount}</span>
        <div className={styles.trustMetricLabel}>
          <strong>Open roles</strong>
          <span>Ready for applications</span>
        </div>
      </div>

      <div className={styles.trustPillars}>
        <div className={styles.trustPillar}>
          <span className={styles.trustIcon}>
            <HugeiconsIcon aria-hidden="true" icon={Globe02Icon} size={18} />
          </span>
          <div className={styles.trustPillarCopy}>
            <strong>Global teams</strong>
            <span>Collaborate without borders</span>
          </div>
        </div>

        <div className={styles.trustPillar}>
          <span className={styles.trustIcon}>
            <HugeiconsIcon aria-hidden="true" icon={Rocket01Icon} size={18} />
          </span>
          <div className={styles.trustPillarCopy}>
            <strong>Room to grow</strong>
            <span>Build skills that matter</span>
          </div>
        </div>

        <div className={styles.trustPillar}>
          <span className={styles.trustIcon}>
            <HugeiconsIcon aria-hidden="true" icon={UserGroupIcon} size={18} />
          </span>
          <div className={styles.trustPillarCopy}>
            <strong>People first</strong>
            <span>Make a valued contribution</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CareersHero({
  lead,
  openRoleCount,
  title,
}: {
  lead: string
  openRoleCount: number
  title: string
}) {
  return (
    <section className={styles.hero} aria-labelledby="careers-hero-title">
      {/* Subtle background world map integration */}
      <div className={styles.heroMapBackdrop} aria-hidden="true">
        <svg
          className={styles.heroMapSvg}
          focusable="false"
          preserveAspectRatio="xMidYMid slice"
          viewBox="30.767 241.591 784.077 458.627"
        >
          <WorldMapPaths />
          <g className={styles.mapConnections}>
            <path d="M704 498 Q470 245 232 375" />
            <path d="M704 498 Q570 315 398 345" />
            <path d="M704 498 Q725 410 715 660" />
            <circle cx="704" cy="498" r="6" />
            <circle cx="232" cy="375" r="4" />
            <circle cx="398" cy="345" r="4" />
            <circle cx="715" cy="660" r="4" />
          </g>
        </svg>
      </div>

      <div className={`container ${styles.heroLayout}`}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Careers at OPG</p>
          <h1 className={styles.heroTitle} id="careers-hero-title">
            {title}
          </h1>
          <p className={styles.heroLead}>{lead}</p>
          <div className={styles.heroActions}>
            <ButtonLink className={styles.pillButton} href="#open-roles-title">
              Explore open roles
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowDown01Icon}
                size={18}
              />
            </ButtonLink>
            <ButtonLink
              className={styles.heroSecondaryAction}
              href="/about"
              variant="secondary"
            >
              Discover life at OPG
            </ButtonLink>
          </div>
        </div>

        <CareerStats openRoleCount={openRoleCount} />
      </div>
    </section>
  )
}

export function ApplicationSteps() {
  return (
    <section aria-labelledby="careers-process-title" className={styles.process}>
      {/* Seamless top soft-blend dissolve connecting from Open Roles */}
      <div className={styles.processTopBlend} aria-hidden="true" />

      {/* Atmospheric ambient golden aurora glow patches */}
      <div className={styles.processGlowRight} aria-hidden="true" />
      <div className={styles.processGlowLeft} aria-hidden="true" />

      {/* Seamless bottom soft-blend dissolve into Recruitment CTA */}
      <div className={styles.processBottomBlend} aria-hidden="true" />

      <div className={`container ${styles.processLayout}`}>
        <div className={styles.processIntro}>
          <p className={styles.eyebrow}>What happens next</p>
          <h2 id="careers-process-title">A straightforward path to OPG.</h2>
          <p>
            We keep the application experience clear, focused, and respectful of
            your time.
          </p>
        </div>
        <ol className={styles.processSteps}>
          <li>
            <span className={styles.stepNumber}>01</span>
            <div className={styles.stepContent}>
              <h3>Find your role</h3>
              <p>Review the opportunity, requirements, and working setup.</p>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>02</span>
            <div className={styles.stepContent}>
              <h3>Apply online</h3>
              <p>Send your résumé and answers securely through this website.</p>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>03</span>
            <div className={styles.stepContent}>
              <h3>Connect with us</h3>
              <p>
                Our recruitment team reviews suitable applications and follows
                up.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  )
}

export function RecruitmentCTA({
  copy,
}: {
  copy?: {
    closingEyebrow?: string
    closingTitle?: string
    closingLead?: string
  }
} = {}) {
  return (
    <section
      className={styles.closingSection}
      aria-labelledby="recruitment-cta-title"
    >
      {/* Seamless top soft-blend dissolve from Application Steps */}
      <div className={styles.closingTopBlend} aria-hidden="true" />

      {/* Atmospheric ambient golden aura surrounding the obsidian card */}
      <div className={styles.closingBackdropAura} aria-hidden="true" />

      {/* Seamless bottom soft-blend dissolve toward Site Footer */}
      <div className={styles.closingBottomBlend} aria-hidden="true" />

      <div className={`container ${styles.closingContainer}`}>
        <div className={styles.closingCard}>
          {/* Left Interactive 3D ASCII Globe representing OPG Global Talent Network */}
          <div className={styles.closingLeftVisual}>
            <AsciiGlobe className={styles.closingAsciiGlobe} />
          </div>

          {/* Right Content Area: Focused Header, Subtext, and Action Buttons */}
          <div className={styles.closingRightContent}>
            {/* Header with Radiant Gold Gradient Accent */}
            <h2 id="recruitment-cta-title" className={styles.closingTitle}>
              {copy?.closingTitle ? (
                copy.closingTitle
              ) : (
                <>
                  Do not see the right role yet?{' '}
                  <span className={styles.closingTitleAccent}>
                    Let&apos;s build your future.
                  </span>
                </>
              )}
            </h2>

            {/* Subtext */}
            <p className={styles.closingDesc}>
              {copy?.closingLead ||
                'Our opportunities evolve with our global enterprise partners across Australia, APAC, the US, and Europe. Check back soon or introduce yourself directly to our recruitment team.'}
            </p>

            {/* Action Buttons */}
            <div className={styles.closingActions}>
              <ButtonLink
                className={styles.closingPrimaryBtn}
                href="#open-roles-title"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Briefcase01Icon}
                  size={16}
                />
                Review current openings
              </ButtonLink>
              <ButtonLink
                className={styles.closingSecondaryBtn}
                href="mailto:recruitment@opglobal.com.hk"
                variant="secondary"
              >
                <HugeiconsIcon aria-hidden="true" icon={Mail01Icon} size={16} />
                Contact recruitment
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
