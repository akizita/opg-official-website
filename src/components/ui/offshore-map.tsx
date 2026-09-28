'use client'

import React, { useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ButtonLink } from '@/components/ui/button-link'
import { DotField } from '@/components/ui/dot-field'
import { WorldMapPaths } from '@/components/ui/world-map-paths'

export interface OffshoreHubLocation {
  id: string
  name: string
  label: string
  region: string
  country: string
  svgX: number
  svgY: number
  isHeadquarters?: boolean
  talentsConnected: string
}

export const PHILIPPINES_HQ: OffshoreHubLocation = {
  id: 'philippines-hq',
  name: 'Metro Manila & Regional Hubs',
  label: 'HQ: PHILIPPINES',
  region: 'Philippines',
  country: 'Philippines',
  svgX: 704,
  svgY: 498,
  isHeadquarters: true,
  talentsConnected: 'Global Operations Hub',
}

export const GLOBAL_DESTINATIONS: OffshoreHubLocation[] = [
  {
    id: 'us-west',
    name: 'San Francisco & Silicon Valley',
    label: 'United States (West)',
    region: 'North America',
    country: 'United States',
    svgX: 135,
    svgY: 388,
    talentsConnected: '85+ Talents Placed',
  },
  {
    id: 'us-east',
    name: 'New York & East Coast',
    label: 'United States (East)',
    region: 'North America',
    country: 'United States',
    svgX: 232,
    svgY: 375,
    talentsConnected: '50+ Talents Placed',
  },
  {
    id: 'uk-london',
    name: 'London & Europe',
    label: 'United Kingdom',
    region: 'Europe',
    country: 'United Kingdom',
    svgX: 398,
    svgY: 345,
    talentsConnected: '35+ Talents Placed',
  },
  {
    id: 'uae-dubai',
    name: 'Dubai & Middle East',
    label: 'United Arab Emirates',
    region: 'Middle East',
    country: 'United Arab Emirates',
    svgX: 532,
    svgY: 468,
    talentsConnected: '25+ Talents Placed',
  },
  {
    id: 'in-mumbai',
    name: 'Mumbai & South Asia',
    label: 'India',
    region: 'South Asia',
    country: 'India',
    svgX: 575,
    svgY: 472,
    talentsConnected: 'Technical Collaboration',
  },
  {
    id: 'sg-singapore',
    name: 'Singapore & Southeast Asia',
    label: 'Singapore',
    region: 'Asia-Pacific',
    country: 'Singapore',
    svgX: 658,
    svgY: 528,
    talentsConnected: '30+ Talents Placed',
  },
  {
    id: 'au-sydney',
    name: 'Sydney & Australia',
    label: 'Australia',
    region: 'Australia & NZ',
    country: 'Australia',
    svgX: 715,
    svgY: 660,
    talentsConnected: '40+ Talents Placed',
  },
]

export interface OffshoreMapSectionProps {
  hideDotField?: boolean
  layout?: 'full' | 'two-column' | 'one-column'
  variant?: 'detailed' | 'overview'
  showDescriptions?: boolean
  showTabs?: boolean
  showEyebrow?: boolean
  eyebrow?: string
  title?: React.ReactNode
  summary?: React.ReactNode
  ctaHref?: string
  ctaText?: string
  className?: string
}

export function OffshoreMapSection({
  hideDotField = false,
  layout = 'one-column',
  variant = 'detailed',
  showDescriptions,
  showTabs = true,
  showEyebrow = true,
  eyebrow,
  title,
  summary,
  ctaHref,
  ctaText,
  className = '',
}: OffshoreMapSectionProps = {}) {
  const [activeRegion, setActiveRegion] = useState<string>('All')
  const shouldReduceMotion = useReducedMotion()

  const filteredDestinations = useMemo(() => {
    if (activeRegion === 'All') return GLOBAL_DESTINATIONS
    return GLOBAL_DESTINATIONS.filter((d) => d.region === activeRegion)
  }, [activeRegion])

  const regions = [
    'All',
    'North America',
    'Europe',
    'Middle East',
    'Asia-Pacific',
    'Australia & NZ',
  ]

  const mapViewport = (
    <div className="offshore-map-card">
      <div className="offshore-schematic-viewport">
        <svg
          viewBox="30.767 241.591 784.077 458.627"
          className="offshore-schematic-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-label="World map showing Outsource Pro Global offshore network connections from Philippines to global partners"
        >
          <defs>
            {/* Subtle Grid Pattern */}
            <pattern
              id="map-grid-dots"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="9" cy="9" r="0.6" fill="rgba(13,13,13,0.06)" />
            </pattern>

            {/* Golden Gradient for Connection Arcs */}
            <linearGradient
              id="gold-arc-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#f29f04" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#f2b705" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4d4d4d" stopOpacity="0.3" />
            </linearGradient>

            {/* Radial Pulse Gradient for HQ Beacon */}
            <radialGradient id="hq-pulse-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f29f04" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f2b705" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f29f04" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ocean Background & Grid */}
          <rect x="30" y="240" width="790" height="465" fill="#fafbfc" />
          <rect
            x="30"
            y="240"
            width="790"
            height="465"
            fill="url(#map-grid-dots)"
          />

          {/* Real World Country Vector Boundaries */}
          <WorldMapPaths />

          {/* Radiating Geodesic Curved Connection Lines from Philippines */}
          <g className="offshore-connection-arcs" pointerEvents="none">
            {filteredDestinations.map((dest) => {
              const midX = (PHILIPPINES_HQ.svgX + dest.svgX) / 2
              const dx = dest.svgX - PHILIPPINES_HQ.svgX
              const arcBulge = Math.min(Math.abs(dx) * 0.28, 90)
              const midY =
                Math.min(PHILIPPINES_HQ.svgY, dest.svgY) - arcBulge - 15

              const pathData = `M ${PHILIPPINES_HQ.svgX} ${PHILIPPINES_HQ.svgY} Q ${midX} ${midY} ${dest.svgX} ${dest.svgY}`

              return (
                <g key={`arc-group-${dest.id}`}>
                  {/* Subtle Glow Underlay Arc */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="rgba(242, 183, 5, 0.4)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="offshore-connection-arc-glow"
                  />
                  {/* Dynamic Gradient Foreground Arc */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="url(#gold-arc-gradient)"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    className="offshore-connection-arc-pulse"
                  />
                </g>
              )
            })}
          </g>

          {/* Philippines Central Headquarters Pulse Beacon */}
          <g
            className="offshore-hq-beacon"
            transform={`translate(${PHILIPPINES_HQ.svgX}, ${PHILIPPINES_HQ.svgY})`}
          >
            {/* Outer Expanding Sonar Wave */}
            <circle
              r="24"
              fill="url(#hq-pulse-glow)"
              className="offshore-hq-sonar"
            />
            {/* Mid Pulse Ring */}
            <circle
              r="12"
              fill="none"
              stroke="#f29f04"
              strokeWidth="1.2"
              strokeDasharray="3 2"
              className="offshore-hq-ring"
            />
            {/* Core Golden Hub Badge */}
            <circle
              r="6.5"
              fill="#f29f04"
              stroke="#ffffff"
              strokeWidth="2"
              className="offshore-hq-core"
            />
            <circle r="2" fill="#ffffff" />
            {/* HQ Floating Badge */}
            <g
              transform="translate(0, -18)"
              className="offshore-hq-badge"
              pointerEvents="none"
            >
              <rect
                x="-45"
                y="-9"
                width="90"
                height="16"
                rx="8"
                fill="#0d0d0d"
                stroke="#f29f04"
                strokeWidth="1"
              />
              <text
                x="0"
                y="2.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="6.8"
                fontWeight="800"
                letterSpacing="0.4"
              >
                ★ HQ: PHILIPPINES
              </text>
            </g>
          </g>

          {/* Global Destination Pins */}
          {filteredDestinations.map((dest) => {
            return (
              <g
                key={dest.id}
                className="offshore-destination-pin"
                transform={`translate(${dest.svgX}, ${dest.svgY})`}
                tabIndex={0}
                role="button"
                aria-label={`${dest.label}: ${dest.name}, ${dest.talentsConnected}`}
              >
                {/* Outer Glow on Hover */}
                <circle
                  r="14"
                  fill="rgba(242, 159, 4, 0.16)"
                  className="offshore-pin-glow"
                />
                {/* Outer Solid Ring */}
                <circle
                  r="5"
                  fill="#ffffff"
                  stroke="#f29f04"
                  strokeWidth="2"
                  className="offshore-pin-ring"
                />
                {/* Inner Accent Dot */}
                <circle r="2.2" fill="#0d0d0d" />

                {/* Permanent High-Legibility City Tag */}
                <g
                  transform="translate(0, -14)"
                  className="offshore-pin-tag"
                  pointerEvents="none"
                >
                  <rect
                    x="-46"
                    y="-8"
                    width="92"
                    height="15"
                    rx="7.5"
                    fill="rgba(255, 255, 255, 0.95)"
                    stroke="rgba(13, 13, 13, 0.18)"
                    strokeWidth="0.7"
                    className="offshore-pin-label-bg"
                  />
                  <text
                    x="0"
                    y="2.5"
                    textAnchor="middle"
                    fill="#0d0d0d"
                    fontSize="6.8"
                    fontWeight="750"
                  >
                    {dest.label}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )

  const regionControls = (
    <div className="offshore-hub__controls-row">
      <div
        className="offshore-hub__filter-group"
        role="tablist"
        aria-label="Filter offshore placements by region"
      >
        {regions.map((region) => {
          const isActive = activeRegion === region
          return (
            <button
              key={region}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`offshore-hub__filter-chip ${
                isActive ? 'offshore-hub__filter-chip--active' : ''
              }`}
              onClick={() => setActiveRegion(region)}
            >
              {region}
            </button>
          )
        })}
      </div>
    </div>
  )

  const featuresBox = (
    <div className="offshore-hub__features-box">
      <div className="offshore-hub__features-grid">
        {/* Feature 1 */}
        <div className="offshore-hub__feature-col">
          <div className="offshore-hub__feature-icon-box" aria-hidden="true">
            <svg
              fill="none"
              height="19"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="19"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="offshore-hub__feature-heading">
            Strategic Philippine Operations Hub
          </h3>
          <p className="offshore-hub__feature-text">
            Strong cultural alignment, high English proficiency, and deep cross-functional capabilities across engineering, finance, and operations.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="offshore-hub__feature-col">
          <div className="offshore-hub__feature-icon-box" aria-hidden="true">
            <svg
              fill="none"
              height="19"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="19"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <h3 className="offshore-hub__feature-heading">
            24/7 Timezone Alignment
          </h3>
          <p className="offshore-hub__feature-text">
            Dedicated teams synchronized directly to your business hours across Australia, APAC, and global market timezones.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="offshore-hub__feature-col">
          <div className="offshore-hub__feature-icon-box" aria-hidden="true">
            <svg
              fill="none"
              height="19"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="19"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="offshore-hub__feature-heading">
            Turnkey Compliance & Retention
          </h3>
          <p className="offshore-hub__feature-text">
            End-to-end management covering contracts, local labor law compliance, dedicated hardware logistics, and sustained team retention.
          </p>
        </div>
      </div>
    </div>
  )

  const isOverview = variant === 'overview'
  const shouldShowDescriptions =
    showDescriptions !== undefined ? showDescriptions : !isOverview

  const resolvedEyebrow =
    eyebrow || (isOverview ? 'Global Reach' : 'Global Offshore Footprint')

  const resolvedTitle =
    title ||
    (isOverview ? (
      <>
        Our Global{' '}
        <span className="offshore-hub__title-accent">
          Offshore Network
        </span>
      </>
    ) : (
      <>
        More Than Recruitment.{' '}
        <span className="offshore-hub__title-accent">
          A Complete Offshore Hub
        </span>
      </>
    ))

  const resolvedSummary =
    summary ||
    (isOverview
      ? 'Headquartered in the Philippines, Outsourced Pro Global bridges exceptional cross-border professionals with high-growth organizations across Australia, and talents all over the world.'
      : 'Connecting 1,000+ top-tier talents worldwide. Headquartered in the Philippines, Outsourced Pro Global bridges exceptional cross-border professionals with high-growth organizations across Australia, and talents all over the world.')

  // Two-column Split Layout (Distinct UI for Homepage Overview)
  if (layout === 'two-column') {
    return (
      <section
        aria-labelledby="offshore-hub-split-heading"
        className={`offshore-hub-section offshore-hub-section--two-column ${className}`.trim()}
      >
        {!hideDotField && (
          <DotField
            dotRadius={2.4}
            dotSpacing={20}
            cursorRadius={460}
            bulgeOnly={true}
            bulgeStrength={85}
            glowRadius={220}
            waveAmplitude={2.5}
            sparkle={true}
            gradientFrom="rgba(217, 130, 0, 0.78)"
            gradientTo="rgba(242, 175, 5, 0.68)"
            glowColor="#ffe773"
            className="offshore-hub__dot-field"
          />
        )}

        <div className="container offshore-hub__container">
          <div className="offshore-hub__split-grid">
            {/* Left Column: Context, Interactive Region Selector, Quick Metrics & CTA */}
            <motion.div
              className="offshore-hub__split-left"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {showEyebrow && (
                <div className="offshore-hub__split-badge" role="text">
                  <span
                    aria-hidden="true"
                    className="offshore-hub__split-badge-dot"
                  />
                  <span>{resolvedEyebrow}</span>
                </div>
              )}

              <h2
                id="offshore-hub-split-heading"
                className="offshore-hub__split-title"
              >
                {resolvedTitle}
              </h2>

              <p className="offshore-hub__split-summary">{resolvedSummary}</p>

              {/* Interactive Region Chips for Quick Overview Filtering */}
              <div
                className="offshore-hub__split-filters"
                role="tablist"
                aria-label="Filter offshore locations by region"
              >
                {regions.map((region) => {
                  const isActive = activeRegion === region
                  return (
                    <button
                      key={region}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`offshore-hub__split-chip ${
                        isActive ? 'offshore-hub__split-chip--active' : ''
                      }`}
                      onClick={() => setActiveRegion(region)}
                    >
                      {region}
                    </button>
                  )
                })}
              </div>

              {/* Quick Metrics */}
              <div className="offshore-hub__split-metrics">
                <div className="offshore-hub__split-metric-item">
                  <span className="offshore-hub__split-metric-val">1,000+</span>
                  <span className="offshore-hub__split-metric-label">
                    Placed Talents
                  </span>
                </div>
                <div className="offshore-hub__split-metric-item">
                  <span className="offshore-hub__split-metric-val">7 Hubs</span>
                  <span className="offshore-hub__split-metric-label">
                    Global Reach
                  </span>
                </div>
                <div className="offshore-hub__split-metric-item">
                  <span className="offshore-hub__split-metric-val">98%</span>
                  <span className="offshore-hub__split-metric-label">
                    Retention
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {ctaHref && (
                <div className="offshore-hub__split-cta">
                  <ButtonLink href={ctaHref} variant="secondary">
                    {ctaText || 'Explore our complete offshore model →'}
                  </ButtonLink>
                </div>
              )}
            </motion.div>

            {/* Right Column: World Map Viewport responding to active region */}
            <motion.div
              className="offshore-hub__split-right"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scale: 0.97, x: 24 }
              }
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {mapViewport}
            </motion.div>
          </div>
        </div>
      </section>
    )
  }

  // One-column Layout (Detailed Deep Dive for About Page)
  return (
    <section
      aria-labelledby="offshore-hub-heading"
      className={`offshore-hub-section offshore-hub-section--${variant} ${className}`.trim()}
    >
      {/* React Bits Interactive Dot Field Background */}
      {!hideDotField && (
        <DotField
          dotRadius={2.4}
          dotSpacing={20}
          cursorRadius={460}
          bulgeOnly={true}
          bulgeStrength={85}
          glowRadius={220}
          waveAmplitude={2.5}
          sparkle={true}
          gradientFrom="rgba(217, 130, 0, 0.78)"
          gradientTo="rgba(242, 175, 5, 0.68)"
          glowColor="#ffe773"
          className="offshore-hub__dot-field"
        />
      )}

      <div className="container offshore-hub__container">
        {/* 1. Header with Scroll Animation */}
        <motion.div
          className="offshore-hub__header"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {showEyebrow && (
            <div className="offshore-hub__eyebrow-badge" role="text">
              <span
                aria-hidden="true"
                className="offshore-hub__eyebrow-dot"
              />
              <span>{resolvedEyebrow}</span>
            </div>
          )}

          <h2 id="offshore-hub-heading" className="offshore-hub__title">
            {resolvedTitle}
          </h2>

          <p className="offshore-hub__summary">{resolvedSummary}</p>
        </motion.div>

        {/* 2. One-Column Map Viewport (Bigger & More Visible, Compact Size on About Page) */}
        <motion.div
          className="offshore-hub__map-wrapper offshore-hub__map-wrapper--compact"
          initial={
            shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 20 }
          }
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {mapViewport}
        </motion.div>

        {/* 3. Filter Tabs (Moved Directly Under the Map) */}
        {showTabs && (
          <motion.div
            className="offshore-hub__controls-wrap"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {regionControls}
          </motion.div>
        )}

        {/* 4. The 3 Descriptions Box Aligned Horizontally Under the Tabs (Detailed Mode Only) */}
        {shouldShowDescriptions && (
          <motion.div
            className="offshore-hub__features-wrap"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {featuresBox}
          </motion.div>
        )}

        {/* 5. Overview CTA Action Row (Overview Mode) */}
        {isOverview && ctaHref && (
          <motion.div
            className="offshore-hub__cta-row"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <ButtonLink href={ctaHref} variant="secondary">
              {ctaText || 'Explore our complete offshore model →'}
            </ButtonLink>
          </motion.div>
        )}
      </div>
    </section>
  )
}
