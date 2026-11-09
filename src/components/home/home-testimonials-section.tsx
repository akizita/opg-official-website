'use client'

import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import styles from './home-testimonials-section.module.css'

interface TestimonialItem {
  id: string
  name: string
  role: string
  quote: string
  avatar: string
  offsetClass: string
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'eleanor',
    name: 'Eleanor Evans',
    role: 'Director of Engineering · Meridian Tech',
    quote:
      'OPG completely transformed how we scale our engineering pods. The engineers are dedicated, deeply integrated into our agile ceremonies, and ship high-impact code from day one.',
    avatar: '/images/testimonial-eleanor-evans.jpg',
    offsetClass: styles.cardWrapperOffset1,
  },
  {
    id: 'david',
    name: 'David Sterling',
    role: 'VP of Global Operations · Veridian Dynamics',
    quote:
      'The retention rate and operational precision of our OPG team exceeded our highest benchmarks. They operate as a true extension of our in-house workforce with zero friction.',
    avatar: '/images/testimonial-david-sterling.jpg',
    offsetClass: styles.cardWrapperOffset2,
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    role: 'Managing Partner · Northstar Financial',
    quote:
      'Finding vetted finance and operations analysts used to take our leadership team months. With OPG, we had experienced, bilingual pods operational in less than three weeks.',
    avatar: '/images/testimonial-marcus-vance.jpg',
    offsetClass: styles.cardWrapperOffset3,
  },
]

export function HomeTestimonialsSection() {
  const [activeId, setActiveId] = useState<string>('david')

  return (
    <section
      aria-labelledby="home-testimonials-heading"
      className={styles.testimonialsSection}
    >
      {/* Ambient Yellow Aurora Glows */}
      <div aria-hidden="true" className={styles.auroraGlow1} />
      <div aria-hidden="true" className={styles.auroraGlow2} />
      <div aria-hidden="true" className={styles.auroraGlow3} />

      <div className={styles.container}>
        <div className={styles.splitGrid}>
          {/* Left Column: Clean Copy & Action */}
          <div className={styles.leftColumn}>
            <div className={styles.eyebrowBadge}>
              <span>Client Testimonials</span>
            </div>

            <h2 className={styles.headline} id="home-testimonials-heading">
              What Our
              <br />
              <span className={styles.headlineHighlight}>Clients Say</span>
            </h2>

            <p className={styles.description}>
              Discover how international founders, engineering heads, and
              operations leaders build high-velocity offshore pods and retain
              world-class talent with Outsourced Pro Global.
            </p>

            <Link className={styles.viewMoreBtn} href="/testimonials">
              <span>View All Reviews</span>
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowRight01Icon}
                size={18}
              />
            </Link>
          </div>

          {/* Right Column: Cascading Floating Cards */}
          <div className={styles.rightColumn}>
            <div className={styles.cardsCascade}>
              {TESTIMONIALS.map((item) => {
                const isActive = activeId === item.id

                return (
                  <div
                    className={`${styles.cardWrapper} ${item.offsetClass}`}
                    key={item.id}
                  >
                    <div
                      aria-label={`Testimonial from ${item.name}`}
                      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                      onClick={() => setActiveId(item.id)}
                      onMouseEnter={() => setActiveId(item.id)}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Circular Avatar */}
                      <div className={styles.avatarWrap}>
                        <Image
                          alt={item.name}
                          className={styles.avatarImg}
                          height={80}
                          src={item.avatar}
                          width={80}
                        />
                      </div>

                      {/* Card Content */}
                      <div className={styles.cardBody}>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.authorName}>{item.name}</h3>
                          <span
                            aria-hidden="true"
                            className={styles.quoteMark}
                          >
                            &#8221;
                          </span>
                        </div>

                        <div className={styles.authorRole}>{item.role}</div>

                        <p className={styles.quoteText}>{item.quote}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

