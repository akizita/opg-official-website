import type { ReactNode } from 'react'

import { SpotlightCard } from '@/components/ui/spotlight-card'

import styles from './about-why-work-with-us-section.module.css'

type WhyPillar = {
  number: string
  title: string
  body: string
  icon: ReactNode
}

function renderPillarIcon(index: number): ReactNode {
  switch (index) {
    case 0:
      return (
        <svg
          aria-hidden="true"
          fill="none"
          height="19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
          viewBox="0 0 24 24"
          width="19"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" fill="currentColor" r="1.2" />
        </svg>
      )
    case 1:
      return (
        <svg
          aria-hidden="true"
          fill="none"
          height="19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
          viewBox="0 0 24 24"
          width="19"
        >
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
        </svg>
      )
    case 2:
      return (
        <svg
          aria-hidden="true"
          fill="none"
          height="19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
          viewBox="0 0 24 24"
          width="19"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg
          aria-hidden="true"
          fill="none"
          height="19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
          viewBox="0 0 24 24"
          width="19"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
  }
}

export function AboutWhyWorkWithUsSection({
  copy,
}: {
  copy: Record<string, string>
}) {
  const pillars: WhyPillar[] = [
    {
      number: '01',
      title: copy.why1Title || 'Tailored Workforce Solutions',
      body:
        copy.why1Body ||
        'Every business is unique. We match you with vetted talent specifically equipped to tackle your specific operational bottlenecks and goals.',
      icon: renderPillarIcon(0),
    },
    {
      number: '02',
      title: copy.why2Title || 'Agile & Scalable',
      body:
        copy.why2Body ||
        'Scale your support up or down without the friction, overhead, and delays associated with traditional in-house hiring.',
      icon: renderPillarIcon(1),
    },
    {
      number: '03',
      title: copy.why3Title || 'Uncompromising Quality',
      body:
        copy.why3Body ||
        'From initial sourcing to daily performance, our rigorous standards ensure your offshore team delivers consistent, high-impact results.',
      icon: renderPillarIcon(2),
    },
    {
      number: '04',
      title: copy.why4Title || 'Partnership Over Placement',
      body:
        copy.why4Body ||
        'We invest in long-term relationships, staying actively involved to ensure ongoing productivity, team retention, and seamless workflow integration.',
      icon: renderPillarIcon(3),
    },
  ]

  return (
    <section
      aria-labelledby="about-why-heading"
      className={styles.section}
      id="why-work-with-us"
    >
      <div className="container">
        <div className={styles.header}>
          <div className={styles.eyebrowWrap}>
            <span className="eyebrow">{copy.whyEyebrow || 'Our Advantage'}</span>
          </div>
          <h2 className={styles.title} id="about-why-heading">
            {copy.whyTitle || 'Why Work With Us'}
          </h2>
        </div>

        <div className={styles.grid}>
          {pillars.map((pillar) => (
            <SpotlightCard className={styles.pillarCard} key={pillar.number}>
              <div className={styles.cardTopRow}>
                <span className={styles.iconCircle}>{pillar.icon}</span>
                <span className={styles.indexPill}>{pillar.number}</span>
              </div>
              <h3 className={styles.cardTitle}>{pillar.title}</h3>
              <p className={styles.cardBody}>{pillar.body}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
