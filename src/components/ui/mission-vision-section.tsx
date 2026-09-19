'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DriftWall, type DriftWallItem } from './drift-wall'

const MOCK_DRIFT_ITEMS: DriftWallItem[] = [
  {
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Collaborative Excellence',
  },
  {
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Strategic Leadership',
  },
  {
    image:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Modern Workplace & Tech',
  },
  {
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Global Team Sync',
  },
  {
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Client Partnership',
  },
  {
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Operational Strategy',
  },
  {
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Talent Innovation',
  },
  {
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Business Development',
  },
  {
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Dedicated Support',
  },
  {
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Culture & Community',
  },
  {
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Knowledge Sharing',
  },
  {
    image:
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&h=400&q=80',
    title: 'Growth & Achievement',
  },
]

type StatementTab = 'mission' | 'vision'

const MISSION_TEXT =
  'To empower businesses to scale with confidence by delivering exceptional outsourced solutions through skilled professionals, innovative strategies, and a culture of integrity and continuous improvement.'

const VISION_TEXT =
  'To become a trusted outsourcing partner of choice, recognised for delivering consistent reliability, adaptability, and measurable growth for the businesses we serve.'

const CORE_VALUES = [
  {
    name: 'Integrity',
    description:
      'We build trust through honesty, openness, and doing the right thing—even when it’s hard.',
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="18"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    name: 'Growth',
    description:
      'We commit to continuous learning, embracing challenges as opportunities to improve ourselves and our results.',
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="18"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    name: 'Collaboration',
    description:
      'We succeed together, valuing every voice and celebrating shared wins.',
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="18"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: 'Innovation',
    description:
      'We listen, adapt, and explore new ways to create better outcomes for people and businesses.',
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="18"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
  {
    name: 'People-First',
    description:
      'We put people at the heart of every decision, fostering growth, respect, and lasting relationships.',
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="18"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
]

export function MissionVisionSection() {
  const [activeTab, setActiveTab] = useState<StatementTab>('mission')
  const [openValues, setOpenValues] = useState<number[]>([0])

  const toggleValue = (idx: number) => {
    setOpenValues((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  return (
    <section
      className="mission-vision-section"
      aria-labelledby="mission-vision-heading"
    >
      <div className="container mission-vision__container">
        {/* Centered Header & Tab Switcher (Mission & Vision only) */}
        <div className="mission-vision__top-header">
          <span className="eyebrow">OUR PURPOSE & DIRECTION</span>
          <h2
            id="mission-vision-heading"
            className="mission-vision__title"
          >
            Guided by Purpose.
            <br />
            Driven by Impact.
          </h2>
          <p className="mission-vision__subtitle">
            The foundational commitments and forward-looking vision shaping how we empower businesses and build high-performing global teams.
          </p>

          {/* Centered Tab Switcher */}
          <div
            className="mission-vision__tabs"
            role="tablist"
            aria-label="Mission and Vision tabs"
          >
            <button
              type="button"
              role="tab"
              id="tab-mission"
              aria-selected={activeTab === 'mission'}
              aria-controls="panel-mission"
              className={`mission-vision__tab-btn ${
                activeTab === 'mission'
                  ? 'mission-vision__tab-btn--active'
                  : ''
              }`}
              onClick={() => setActiveTab('mission')}
            >
              <svg
                aria-hidden="true"
                className="mission-vision__tab-icon"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>Mission</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-vision"
              aria-selected={activeTab === 'vision'}
              aria-controls="panel-vision"
              className={`mission-vision__tab-btn ${
                activeTab === 'vision'
                  ? 'mission-vision__tab-btn--active'
                  : ''
              }`}
              onClick={() => setActiveTab('vision')}
            >
              <svg
                aria-hidden="true"
                className="mission-vision__tab-icon"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M4.93 4.93l2.83 2.83" />
                <path d="M16.24 16.24l2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="M4.93 19.07l2.83-2.83" />
                <path d="M16.24 7.76l2.83-2.83" />
              </svg>
              <span>Vision</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid: DriftWall + Active Statement */}
        <div className="mission-vision__grid">
          {/* Left Column: 3D Drift Wall Showcase (Open & Blended) */}
          <div className="mission-vision__visual">
            <div
              aria-hidden="true"
              className="mission-vision__drift-glow"
            />
            <DriftWall
              items={MOCK_DRIFT_ITEMS}
              columns={3}
              tileWidth={170}
              tileHeight={115}
              gap={14}
              radius={14}
              tilt={14}
              turn={-12}
              speed={32}
              pauseOnHover={true}
              dim={0.92}
              fade={0.72}
              overlayColor="rgba(242, 183, 5, 0.03)"
              className="mission-vision__drift-wall"
            />
          </div>

          {/* Right Column: Statement Display */}
          <div className="mission-vision__display">
            {activeTab === 'mission' && (
              <div
                key="mission"
                role="tabpanel"
                id="panel-mission"
                aria-labelledby="tab-mission"
                className="mission-vision__panel"
              >
                <h3 className="mission-vision__statement-title">Mission</h3>
                <p className="mission-vision__statement-text">
                  {MISSION_TEXT}
                </p>
                <div className="mission-vision__footer">
                  <Link
                    href="/mission-and-vision"
                    className="mission-vision__link-btn"
                  >
                    <span>Explore Our Purpose & Values</span>
                    <svg
                      aria-hidden="true"
                      fill="none"
                      height="16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'vision' && (
              <div
                key="vision"
                role="tabpanel"
                id="panel-vision"
                aria-labelledby="tab-vision"
                className="mission-vision__panel"
              >
                <h3 className="mission-vision__statement-title">Vision</h3>
                <p className="mission-vision__statement-text">
                  {VISION_TEXT}
                </p>
                <div className="mission-vision__footer">
                  <Link
                    href="/mission-and-vision"
                    className="mission-vision__link-btn"
                  >
                    <span>Explore Our Purpose & Values</span>
                    <svg
                      aria-hidden="true"
                      fill="none"
                      height="16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Core Values Glassmorphism Section (Interactive Accordion List) */}
        <div className="mission-vision__values-section">
          <div className="mission-vision__values-header">
            <span className="eyebrow">THE FOUNDATION</span>
            <h3 className="mission-vision__values-title">Our Core Values</h3>
            <p className="mission-vision__values-desc">
              The non-negotiable principles that guide our people, culture, and partnerships every day.
            </p>
          </div>

          <div
            className="mission-vision__accordion"
            role="region"
            aria-label="Core Values Accordion"
          >
            {CORE_VALUES.map((val, idx) => {
              const isOpen = openValues.includes(idx)
              const itemId = `value-${idx}`
              return (
                <div
                  key={val.name}
                  className={`mission-vision__accordion-item ${
                    isOpen ? 'mission-vision__accordion-item--open' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="mission-vision__accordion-trigger"
                    aria-expanded={isOpen}
                    aria-controls={`panel-${itemId}`}
                    id={`trigger-${itemId}`}
                    onClick={() => toggleValue(idx)}
                  >
                    <div className="mission-vision__accordion-trigger-left">
                      <span className="mission-vision__accordion-num">
                        0{idx + 1}
                      </span>
                      <span
                        className="mission-vision__accordion-icon"
                        aria-hidden="true"
                      >
                        {val.icon}
                      </span>
                      <h4 className="mission-vision__accordion-title">
                        {val.name}
                      </h4>
                    </div>
                    <span
                      className="mission-vision__accordion-indicator"
                      aria-hidden="true"
                    >
                      <svg
                        fill="none"
                        height="18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.2"
                        viewBox="0 0 24 24"
                        width="18"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`panel-${itemId}`}
                      role="region"
                      aria-labelledby={`trigger-${itemId}`}
                      className="mission-vision__accordion-body"
                    >
                      <p className="mission-vision__accordion-desc">
                        {val.description}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
