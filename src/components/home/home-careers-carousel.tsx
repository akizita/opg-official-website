'use client'

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Clock01Icon,
  Location01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CareerJob } from '@/lib/jazzhr/types'

import styles from './home-careers-carousel.module.css'

const FALLBACK_JOBS: CareerJob[] = [
  {
    id: 'role-1',
    slug: 'senior-full-stack-engineer',
    title: 'Senior Full Stack Engineer',
    department: 'Engineering & Technology',
    location: 'Remote · Philippines / Global',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full-time',
    workArrangement: 'remote',
    summary:
      'Architect robust web applications and microservices using Next.js, Node.js, and cloud native architectures for global clients.',
    boardCode: 'SWE-01',
    city: 'Manila',
    state: null,
    country: 'PH',
    descriptionText: '',
    minimumExperience: '4+ Years Experience',
    publishedAt: new Date().toISOString(),
    questionnaireId: null,
    compensation: null,
    applyPath: '/careers',
  },
  {
    id: 'role-2',
    slug: 'executive-virtual-assistant',
    title: 'Executive Virtual Assistant to C-Suite',
    department: 'Executive Support',
    location: 'Remote · Philippines',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full-time',
    workArrangement: 'remote',
    summary:
      'Manage high-priority communications, executive scheduling, international travel, and cross-timezone project workflows.',
    boardCode: 'EVA-02',
    city: 'Manila',
    state: null,
    country: 'PH',
    descriptionText: '',
    minimumExperience: '3+ Years Experience',
    publishedAt: new Date().toISOString(),
    questionnaireId: null,
    compensation: null,
    applyPath: '/careers',
  },
  {
    id: 'role-3',
    slug: 'financial-analyst-controller',
    title: 'Financial Analyst & Operations Controller',
    department: 'Finance & Accounting',
    location: 'Hybrid / Remote · Philippines',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full-time',
    workArrangement: 'hybrid',
    summary:
      'Conduct variance analysis, multi-entity reconciliation, and financial reporting for premier international enterprise accounts.',
    boardCode: 'FIN-03',
    city: 'Manila',
    state: null,
    country: 'PH',
    descriptionText: '',
    minimumExperience: '3+ Years Experience',
    publishedAt: new Date().toISOString(),
    questionnaireId: null,
    compensation: null,
    applyPath: '/careers',
  },
  {
    id: 'role-4',
    slug: 'technical-customer-success-lead',
    title: 'Technical Customer Success Lead',
    department: 'Client Operations',
    location: 'Remote · Philippines / APAC',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full-time',
    workArrangement: 'remote',
    summary:
      'Drive world-class client onboarding, SLA retention, technical issue resolution, and daily client engagement.',
    boardCode: 'CSL-04',
    city: 'Manila',
    state: null,
    country: 'PH',
    descriptionText: '',
    minimumExperience: '2+ Years Experience',
    publishedAt: new Date().toISOString(),
    questionnaireId: null,
    compensation: null,
    applyPath: '/careers',
  },
  {
    id: 'role-5',
    slug: 'talent-acquisition-specialist',
    title: 'Senior Cross-Border Talent Specialist',
    department: 'Human Resources & Talent',
    location: 'Remote · Philippines',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full-time',
    workArrangement: 'remote',
    summary:
      'Lead candidate sourcing, multi-stage vetting, technical screening, and cultural matching for top offshore pods.',
    boardCode: 'TAS-05',
    city: 'Manila',
    state: null,
    country: 'PH',
    descriptionText: '',
    minimumExperience: '3+ Years Experience',
    publishedAt: new Date().toISOString(),
    questionnaireId: null,
    compensation: null,
    applyPath: '/careers',
  },
  {
    id: 'role-6',
    slug: 'cloud-devops-engineer',
    title: 'Cloud DevOps & Systems Architect',
    department: 'Engineering & Cloud',
    location: 'Remote · Global',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full-time',
    workArrangement: 'remote',
    summary:
      'Manage CI/CD pipelines, container orchestration, Kubernetes clusters, and cloud infrastructure security across AWS and GCP.',
    boardCode: 'CLD-06',
    city: 'Manila',
    state: null,
    country: 'PH',
    descriptionText: '',
    minimumExperience: '4+ Years Experience',
    publishedAt: new Date().toISOString(),
    questionnaireId: null,
    compensation: null,
    applyPath: '/careers',
  },
]

interface HomeCareersCarouselProps {
  initialJobs?: CareerJob[]
}

export function HomeCareersCarousel({ initialJobs }: HomeCareersCarouselProps) {
  const jobs = useMemo(() => {
    if (initialJobs && initialJobs.length > 0) {
      return initialJobs
    }
    return FALLBACK_JOBS
  }, [initialJobs])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Update visible card count dynamically on resize
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      if (width <= 640) {
        setVisibleCount(1)
      } else if (width <= 1024) {
        setVisibleCount(2)
      } else {
        setVisibleCount(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = Math.max(0, jobs.length - visibleCount)

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex))
  }, [maxIndex])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0))
  }, [maxIndex])

  // Autoplay timer with pause on hover
  useEffect(() => {
    if (isPaused || maxIndex <= 0) return
    const timer = setInterval(() => {
      handleNext()
    }, 5500)
    return () => clearInterval(timer)
  }, [handleNext, isPaused, maxIndex])

  // Translate track percentage
  const translatePercent = useMemo(() => {
    if (jobs.length <= visibleCount) return 0
    return (currentIndex * 100) / visibleCount
  }, [currentIndex, jobs.length, visibleCount])

  return (
    <section
      aria-labelledby="home-careers-carousel-heading"
      className={styles.careersSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient Yellow Aurora Glows */}
      <div aria-hidden="true" className={styles.auroraGlow1} />
      <div aria-hidden="true" className={styles.auroraGlow2} />
      <div aria-hidden="true" className={styles.auroraGlow3} />

      <div className={styles.container}>
        {/* Header Row */}
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <h2 className={styles.title} id="home-careers-carousel-heading">
              Shape Your Career With{' '}
              <span className={styles.titleHighlight}>
                Global Opportunities
              </span>
            </h2>
            <p className={styles.description}>
              Join high-performing cross-border pods delivering technical
              excellence, financial operations, and executive support for
              leading international brands.
            </p>
          </div>

          <div className={styles.headerControls}>
            <Link className={styles.viewAllBtn} href="/careers">
              <span>View All Roles</span>
              <HugeiconsIcon
                aria-hidden="true"
                icon={ArrowRight01Icon}
                size={16}
              />
            </Link>
          </div>
        </div>

        {/* Carousel Container with Left/Right Flanking Arrow Controls */}
        <div className={styles.carouselContainer}>
          <button
            aria-label="Previous career opportunity"
            className={`${styles.navArrowBtn} ${styles.navArrowBtnLeft}`}
            onClick={handlePrev}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowLeft01Icon}
              size={20}
            />
          </button>

          {/* Carousel Viewport */}
          <div className={styles.carouselViewport}>
            <div
              className={styles.carouselTrack}
              ref={trackRef}
              style={{
                transform: `translateX(-${translatePercent}%)`,
              }}
            >
            {jobs.map((job) => {
              const department = job.department || 'General Talent'
              const arrangement =
                job.workArrangement === 'remote'
                  ? 'Remote'
                  : job.workArrangement === 'hybrid'
                    ? 'Hybrid'
                    : 'Onsite'
              const locationText = job.location || 'Philippines / Remote'
              const empType = job.employmentTypeLabel || 'Full-time'
              const targetHref = `/careers/${job.slug}`

              return (
                <div className={styles.jobCardSlide} key={job.id}>
                  <Link
                    aria-label={`View role details for ${job.title}`}
                    className={styles.jobCard}
                    href={targetHref}
                  >
                    <div className={styles.jobCardTop}>
                      <div className={styles.badgesRow}>
                        <span className={styles.deptBadge}>{department}</span>
                        <span className={styles.arrangementBadge}>
                          <span
                            aria-hidden="true"
                            className={styles.greenPulseDot}
                          />
                          <span>{arrangement}</span>
                        </span>
                      </div>

                      <h3 className={styles.jobTitle}>{job.title}</h3>

                      <p className={styles.jobSummary}>
                        {job.summary ||
                          'Contribute to mission-critical deliverables in high-growth pods with continuous professional mentorship.'}
                      </p>

                      <div className={styles.metaList}>
                        <span className={styles.metaItem}>
                          <HugeiconsIcon
                            aria-hidden="true"
                            className={styles.metaIcon}
                            icon={Location01Icon}
                            size={14}
                          />
                          <span>{locationText}</span>
                        </span>
                        <span className={styles.metaItem}>
                          <HugeiconsIcon
                            aria-hidden="true"
                            className={styles.metaIcon}
                            icon={Briefcase01Icon}
                            size={14}
                          />
                          <span>{empType}</span>
                        </span>
                        {job.minimumExperience && (
                          <span className={styles.metaItem}>
                            <HugeiconsIcon
                              aria-hidden="true"
                              className={styles.metaIcon}
                              icon={Clock01Icon}
                              size={14}
                            />
                            <span>{job.minimumExperience}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.jobCardFooter}>
                      <span className={styles.applyLinkText}>
                        <span>View Role Details</span>
                        <HugeiconsIcon
                          aria-hidden="true"
                          className={styles.applyArrowIcon}
                          icon={ArrowRight01Icon}
                          size={15}
                        />
                      </span>
                    </div>
                  </Link>
                </div>
              )
            })}
            </div>
          </div>

          <button
            aria-label="Next career opportunity"
            className={`${styles.navArrowBtn} ${styles.navArrowBtnRight}`}
            onClick={handleNext}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowRight01Icon}
              size={20}
            />
          </button>
        </div>

        {/* Dots Pagination */}
        {maxIndex > 0 && (
          <div
            aria-label="Carousel pagination"
            className={styles.dotsWrapper}
            role="tablist"
          >
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                aria-label={`Go to slide ${idx + 1}`}
                aria-selected={currentIndex === idx}
                className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ''}`}
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                role="tab"
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

