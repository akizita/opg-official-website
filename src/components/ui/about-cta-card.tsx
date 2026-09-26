'use client'

import React, { useEffect, useRef, useState } from 'react'

import { ButtonLink } from '@/components/ui/button-link'

export function AboutCtaCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const cardEl = cardRef.current
    if (!cardEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      },
    )

    observer.observe(cardEl)
    return () => observer.disconnect()
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  return (
    <div
      className={`about-cta-card ${isVisible ? 'is-visible' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
    >
      {/* 1. 3D Glass Surface Layers: Specular Sheen, Fluid Refractions & Fine Grain */}
      <div aria-hidden="true" className="about-cta-card__bg">
        <div className="about-cta-card__shine" />
        <div className="about-cta-card__blob about-cta-card__blob--1" />
        <div className="about-cta-card__blob about-cta-card__blob--2" />
        <div className="about-cta-card__blob about-cta-card__blob--3" />
        <div className="about-cta-card__noise" />
      </div>

      {/* 2. Interactive Cursor-Tracking Spotlight Glow */}
      <div
        aria-hidden="true"
        className="about-cta-card__spotlight"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.2), transparent 70%)`,
        }}
      />

      {/* 3. Content: 2-Column Responsive Layout */}
      <div className="about-cta-card__grid">
        {/* Left Column: Eyebrow + Headline */}
        <div className="about-cta-card__col about-cta-card__col--left">
          <div className="about-cta-anim-item">
            <span className="about-cta-card__eyebrow">
              <span
                className="about-cta-card__eyebrow-dot"
                aria-hidden="true"
              />
              Work With Outsourced Pro Global
            </span>
          </div>

          <div className="about-cta-anim-item">
            <h2 className="about-cta-card__title">
              Experience the Difference Exceptional Offshore Talent Makes
            </h2>
          </div>
        </div>

        {/* Right Column: Narrative Subtext + Actions */}
        <div className="about-cta-card__col about-cta-card__col--right">
          <div className="about-cta-anim-item">
            <p className="about-cta-card__desc">
              Whether you are launching a dedicated offshore pod or exploring
              your next career move, our advisors are here to guide every step.
            </p>
          </div>

          <div className="about-cta-anim-item">
            <div className="about-cta-card__actions">
              <ButtonLink
                className="about-pill-btn about-pill-btn--primary"
                href="/contact"
              >
                Partner With Us
              </ButtonLink>
              <ButtonLink
                className="about-pill-btn about-pill-btn--ghost"
                href="/clients"
                variant="secondary"
              >
                Meet Our Clients
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutCtaCard
