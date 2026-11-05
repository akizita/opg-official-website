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
import { ColorBends } from '@/components/ui/color-bends'
import { Grainient } from '@/components/ui/grainient'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { WorldMapPaths } from '@/components/ui/world-map-paths'

import styles from './careers.module.css'

type Benefit = {
  body: string
  title: string
}

function cleanBenefitTitle(value: string): string {
  return value.replace(/^(?:🌍|🚀|📈)\s*/u, '').trim()
}

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

export function WhyJoin({
  benefits,
  title,
}: {
  benefits: [Benefit, Benefit, Benefit]
  title: string
}) {
  const icons = [Globe02Icon, Rocket01Icon, UserGroupIcon] as const

  return (
    <section className={styles.benefits} aria-labelledby="why-join-title">
      {/* Deep, warm transitional backdrop glow bridging from openings into benefits */}
      <div className={styles.benefitsBackdrop} aria-hidden="true" />
      <Grainient
        className={styles.grainientCanvas}
        color1="#eab308"
        color2="#ca8a04"
        color3="#d97706"
        color4="#facc15"
        grainAmount={0.045}
        scale={1.1}
        speed={0.55}
        warpStrength={1.2}
      />
      <div className={`container ${styles.benefitsContainer}`}>
        <div className={styles.benefitsHeading}>
          <div>
            <p className={styles.benefitsEyebrow}>Why join us</p>
            <h2 id="why-join-title">{title}</h2>
          </div>
          <p>
            Join a culture where your ideas matter, your ambitions are
            supported, and your growth has no limits.
          </p>
        </div>

        <div className={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <SpotlightCard
              className={styles.benefitCard}
              key={benefit.title}
              spotlightColor="rgba(245, 158, 11, 0.42)"
              tabIndex={-1}
            >
              <span className={styles.benefitIcon}>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={icons[index]}
                  size={24}
                />
              </span>
              <div className={styles.benefitContent}>
                <h3>{cleanBenefitTitle(benefit.title)}</h3>
                <p>{benefit.body}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ApplicationSteps() {
  return (
    <section aria-labelledby="careers-process-title" className={styles.process}>
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

export function RecruitmentCTA() {
  return (
    <section
      className={styles.closingSection}
      aria-labelledby="recruitment-cta-title"
    >
      <div className={`container ${styles.closingContainer}`}>
        <div className={styles.closingCard}>
          {/* React Bits ColorBends background in vibrant OPG golden ribbons */}
          <ColorBends
            aria-hidden="true"
            autoRotate={2.0}
            bandWidth={5.2}
            className={styles.closingBends}
            colors={[
              '#f29f04',
              '#fbbf24',
              '#f59e0b',
              '#d97706',
              '#ea580c',
            ]}
            frequency={0.9}
            intensity={1.35}
            iterations={2}
            mouseInfluence={0.5}
            noise={0.08}
            parallax={0.3}
            rotation={90}
            scale={1.1}
            speed={0.22}
            transparent={true}
            warpStrength={1.15}
          />
          {/* Translucent overlay for deep contrast and readability */}
          <div aria-hidden="true" className={styles.closingOverlay} />

          <div className={styles.closingInner}>
            <div className={styles.closingCopy}>
              <p className={styles.closingEyebrow}>Stay connected</p>
              <h2 id="recruitment-cta-title">Do not see the right role yet?</h2>
              <p>
                Our opportunities evolve with our global partners. Check back
                soon or introduce yourself to our recruitment team.
              </p>
            </div>
            <div className={styles.closingActions}>
              <ButtonLink
                className={styles.closingGlassBtn}
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
                className={styles.closingGlassBtn}
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
