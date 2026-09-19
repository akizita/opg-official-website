'use client'

import React, { useState, useMemo } from 'react'
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

export function OffshoreMapSection() {
  const [activeRegion, setActiveRegion] = useState<string>('All')

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

  return (
    <section
      aria-labelledby="offshore-hub-heading"
      className="offshore-hub-section"
    >
      {/* React Bits Interactive Dot Field Background */}
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

      <div className="container offshore-hub__container">
        {/* Section Header */}
        <div className="offshore-hub__header">
          <span className="eyebrow">GLOBAL OFFSHORE FOOTPRINT</span>
          <h2 id="offshore-hub-heading" className="offshore-hub__title">
            More Than Recruitment.
            <br />
            A Complete Offshore Hub
          </h2>
          <p className="offshore-hub__summary">
            We have connected more than 200 talents all over the world.
            Headquartered in the Philippines, Outsourced Pro Global bridges
            exceptional cross-border professionals with high-growth organizations
            across North America, Europe, Australia, and the Middle East.
          </p>

          {/* Centered Region Filter Tabs */}
          <div className="offshore-hub__controls-row">
            <div
              className="offshore-hub__filter-group"
              role="tablist"
              aria-label="Filter offshore placements by region"
            >
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  role="tab"
                  aria-selected={activeRegion === region}
                  className={`offshore-hub__filter-chip ${
                    activeRegion === region
                      ? 'offshore-hub__filter-chip--active'
                      : ''
                  }`}
                  onClick={() => setActiveRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map Viewport Card */}
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
                  const midY = (PHILIPPINES_HQ.svgY + dest.svgY) / 2
                  const dist = Math.hypot(
                    dest.svgX - PHILIPPINES_HQ.svgX,
                    dest.svgY - PHILIPPINES_HQ.svgY,
                  )
                  const arch = Math.min(85, Math.max(25, dist * 0.16))
                  const controlX = midX
                  const controlY = Math.max(250, midY - arch)

                  const pathD = `M ${PHILIPPINES_HQ.svgX} ${PHILIPPINES_HQ.svgY} Q ${controlX} ${controlY} ${dest.svgX} ${dest.svgY}`

                  return (
                    <g key={`arc-${dest.id}`}>
                      {/* Static Arc Base */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="rgba(242, 159, 4, 0.35)"
                        strokeWidth="1.1"
                        strokeDasharray="3 3"
                      />
                      {/* Flowing Light Beam */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="url(#gold-arc-gradient)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="offshore-animated-flight-line"
                      />
                    </g>
                  )
                })}
              </g>

              {/* Philippines Headquarters Radar Beacon */}
              <g
                className="offshore-hq-node"
                transform={`translate(${PHILIPPINES_HQ.svgX}, ${PHILIPPINES_HQ.svgY})`}
              >
                <circle
                  r="24"
                  fill="url(#hq-pulse-glow)"
                  className="offshore-beacon-pulse offshore-beacon-pulse--delay"
                />
                <circle
                  r="14"
                  fill="url(#hq-pulse-glow)"
                  className="offshore-beacon-pulse"
                />
                <circle
                  r="5"
                  fill="#f29f04"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  className="offshore-hq-center"
                />
                <circle r="2" fill="#0d0d0d" />

                {/* HQ Persistent Label Badge */}
                <g transform="translate(9, -6)">
                  <rect
                    x="0"
                    y="-9"
                    width="116"
                    height="18"
                    rx="9"
                    fill="rgba(13, 13, 13, 0.94)"
                    stroke="rgba(242, 159, 4, 0.75)"
                    strokeWidth="0.8"
                  />
                  <text
                    x="8"
                    y="3"
                    fill="#f2b705"
                    fontSize="7.5"
                    fontWeight="750"
                    letterSpacing="0.04em"
                  >
                    🇵🇭 {PHILIPPINES_HQ.label}
                  </text>
                </g>
              </g>

              {/* Global Destination Pins */}
              {filteredDestinations.map((dest) => {
                return (
                  <g
                    key={`pin-${dest.id}`}
                    transform={`translate(${dest.svgX}, ${dest.svgY})`}
                    className="offshore-destination-pin"
                  >
                    <circle
                      r="4"
                      fill="#0d0d0d"
                      stroke="#f29f04"
                      strokeWidth="1.5"
                      className="offshore-pin-dot"
                    />
                    <circle r="1.5" fill="#ffffff" />

                    {/* Floating Location Name Label */}
                    <g transform="translate(0, -9)">
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

        {/* 3 Pillar Summary Cards Beneath Map */}
        <div className="offshore-hub__pillars-grid">
          <div className="offshore-pillar-card">
            <div className="offshore-pillar__icon" aria-hidden="true">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="offshore-pillar__title">
              Strategic Philippine Hub
            </h3>
            <p className="offshore-pillar__desc">
              High English proficiency, strong cultural affinity with Western
              markets, and a deep talent pool across engineering, finance, and
              customer operations.
            </p>
          </div>

          <div className="offshore-pillar-card">
            <div className="offshore-pillar__icon" aria-hidden="true">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <h3 className="offshore-pillar__title">24/7 Timezone Coverage</h3>
            <p className="offshore-pillar__desc">
              Whether you need direct business-hours collaboration or round-the-clock
              follow-the-sun delivery, our offshore pods operate on your required schedule.
            </p>
          </div>

          <div className="offshore-pillar-card">
            <div className="offshore-pillar__icon" aria-hidden="true">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="offshore-pillar__title">Complete Offshore Lifecycle</h3>
            <p className="offshore-pillar__desc">
              Beyond initial placement, we manage ongoing compliance, payroll,
              dedicated equipment provisioning, and performance retention so your team thrives.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
