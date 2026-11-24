'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ClientLogo, type ClientLogoType } from '@/components/ui/client-logo'

export interface CarouselTestimonialItem {
  id: string
  quote: string
  headline?: string
  authorName: string
  authorRole: string
  companyName: string
  companyId: string
  logoType?: ClientLogoType
  logoUrl?: string | null
  metricBadge?: string
  rating?: number
  industry?: string
  photoUrl: string
}

interface ClientsTestimonialCarouselProps {
  testimonials: readonly CarouselTestimonialItem[]
}

const AUTOPLAY_INTERVAL_MS = 5200
const NAV_UNLOCK_FALLBACK_MS = 820

export function ClientsTestimonialCarousel({
  testimonials,
}: ClientsTestimonialCarouselProps) {
  const total = testimonials.length

  // Build a 3-set infinite sequence [pre, main, post] so adjacent cards peek symmetrically
  const extendedItems = useMemo(() => {
    if (total === 0) return []
    return [
      ...testimonials.map((item, idx) => ({
        ...item,
        _virtualKey: `pre-${idx}-${item.id}`,
        _origIndex: idx,
      })),
      ...testimonials.map((item, idx) => ({
        ...item,
        _virtualKey: `main-${idx}-${item.id}`,
        _origIndex: idx,
      })),
      ...testimonials.map((item, idx) => ({
        ...item,
        _virtualKey: `post-${idx}-${item.id}`,
        _origIndex: idx,
      })),
    ]
  }, [testimonials, total])

  // Start at index `total` (first item of main set), perfectly centered
  const [virtualIndex, setVirtualIndex] = useState(total)
  const [enableTransition, setEnableTransition] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const [isTouchActive, setIsTouchActive] = useState(false)
  const [isDocumentHidden, setIsDocumentHidden] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const isNavigatingRef = useRef(false)
  const navUnlockTimerRef = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Real active index (0 to total - 1)
  const realIndex = total > 0 ? ((virtualIndex % total) + total) % total : 0
  const isAutoplayPaused =
    isHovered ||
    isFocusWithin ||
    isTouchActive ||
    isDocumentHidden ||
    prefersReducedMotion

  // Measure container width and initialize without animation
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      } else {
        setContainerWidth(window.innerWidth)
      }
    }

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
    const syncMotionPreference = () =>
      setPrefersReducedMotion(Boolean(motionQuery?.matches))
    const syncVisibility = () =>
      setIsDocumentHidden(document.visibilityState !== 'visible')

    const initialFrame = requestAnimationFrame(() => {
      updateWidth()
      syncMotionPreference()
      syncVisibility()
      setIsMounted(true)
    })

    // Re-enable smooth transition after initial placement settles
    const timer = setTimeout(() => {
      setEnableTransition(true)
    }, 60)

    window.addEventListener('resize', updateWidth)
    motionQuery?.addEventListener('change', syncMotionPreference)
    document.addEventListener('visibilitychange', syncVisibility)
    return () => {
      cancelAnimationFrame(initialFrame)
      clearTimeout(timer)
      if (navUnlockTimerRef.current !== null) {
        window.clearTimeout(navUnlockTimerRef.current)
      }
      window.removeEventListener('resize', updateWidth)
      motionQuery?.removeEventListener('change', syncMotionPreference)
      document.removeEventListener('visibilitychange', syncVisibility)
    }
  }, [])

  // Calculate card width and track translation offset
  const width = containerWidth || 1200
  const isMobile = width < 640
  const isTablet = width >= 640 && width < 1024

  let cardWidth = 840
  if (isMobile) {
    cardWidth = Math.max(300, width - 40)
  } else if (isTablet) {
    cardWidth = Math.min(width * 0.78, 700)
  } else {
    // Desktop: generous card size matching inspo
    cardWidth = Math.min(width * 0.62, 860)
    cardWidth = Math.max(720, cardWidth)
  }

  const cardGap = isMobile ? 16 : isTablet ? 24 : 32

  // Center the active card in the viewport
  const trackOffset =
    (width - cardWidth) / 2 - virtualIndex * (cardWidth + cardGap)

  const stepSlide = useCallback(
    (delta: number) => {
      if (total <= 1 || delta === 0 || isNavigatingRef.current) return
      isNavigatingRef.current = true
      if (navUnlockTimerRef.current !== null) {
        window.clearTimeout(navUnlockTimerRef.current)
      }
      navUnlockTimerRef.current = window.setTimeout(() => {
        isNavigatingRef.current = false
        navUnlockTimerRef.current = null
      }, NAV_UNLOCK_FALLBACK_MS)
      setEnableTransition(true)
      setVirtualIndex((prev) => prev + delta)
    },
    [total],
  )

  // Navigation handlers
  const goToNext = useCallback(() => {
    stepSlide(1)
  }, [stepSlide])

  const goToPrev = useCallback(() => {
    stepSlide(-1)
  }, [stepSlide])

  const goToSlide = useCallback(
    (targetRealIndex: number) => {
      if (total === 0) return
      const currentReal = ((virtualIndex % total) + total) % total
      const diff = targetRealIndex - currentReal
      stepSlide(diff)
    },
    [stepSlide, total, virtualIndex],
  )

  // Handle transition end on the track itself for seamless infinite loop
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget || e.propertyName !== 'transform') return
      isNavigatingRef.current = false
      if (navUnlockTimerRef.current !== null) {
        window.clearTimeout(navUnlockTimerRef.current)
        navUnlockTimerRef.current = null
      }
      if (total === 0) return

      // If we've traversed into post or pre sets, reset back to main set invisibly
      if (virtualIndex >= 2 * total) {
        setEnableTransition(false)
        setVirtualIndex((prev) => prev - total)
      } else if (virtualIndex < total) {
        setEnableTransition(false)
        setVirtualIndex((prev) => prev + total)
      }
    },
    [total, virtualIndex],
  )

  // Automatic horizontal progression when visible and idle
  useEffect(() => {
    if (!isMounted || total <= 1 || isAutoplayPaused) {
      return
    }

    const intervalId = window.setInterval(() => {
      stepSlide(1)
    }, AUTOPLAY_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [isAutoplayPaused, isMounted, realIndex, stepSlide, total])

  // Re-enable transition on next frame after invisible index jump
  useEffect(() => {
    if (!enableTransition && isMounted) {
      const rafId = requestAnimationFrame(() => {
        setEnableTransition(true)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [enableTransition, isMounted])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    },
    [goToNext, goToPrev],
  )

  // Touch gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouchActive(true)
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    setIsTouchActive(false)
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current
      if (distance > 45) {
        goToNext()
      } else if (distance < -45) {
        goToPrev()
      }
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  if (total === 0) {
    return null
  }

  return (
    <div
      className="clients-testimonial-carousel"
      data-paused={isAutoplayPaused ? 'true' : 'false'}
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocusWithin(false)
        }
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Client Partner Testimonials Carousel"
      aria-describedby="clients-carousel-instructions"
    >
      <p id="clients-carousel-instructions" className="sr-only">
        Testimonials advance automatically every few seconds and pause when
        hovered or focused. Use the previous and next buttons or the left and
        right arrow keys to browse testimonials.
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Testimonial {realIndex + 1} of {total}:{' '}
        {testimonials[realIndex].companyName}
      </p>
      {/* Background ambient lighting */}
      <div className="clients-testimonial-carousel__glow" aria-hidden="true" />

      {/* Viewport & Slide Track */}
      <div
        className="clients-testimonial-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="clients-testimonial-carousel__track"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(${trackOffset}px)`,
            transition:
              enableTransition && isMounted
                ? 'transform 0.72s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
          }}
        >
          {extendedItems.map((item, index) => {
            const isActive = index === virtualIndex
            const isPrev = index === virtualIndex - 1
            const isNext = index === virtualIndex + 1

            return (
              <div
                key={item._virtualKey}
                role="group"
                aria-roledescription="slide"
                aria-label={`Testimonial ${item._origIndex + 1} of ${total}: ${item.companyName}`}
                aria-hidden={!isActive}
                onClick={() => {
                  if (isPrev) goToPrev()
                  else if (isNext) goToNext()
                }}
                className={`clients-testimonial-card-slide ${
                  isActive
                    ? 'clients-testimonial-card-slide--active'
                    : 'clients-testimonial-card-slide--inactive'
                }`}
                style={{
                  width: `${cardWidth}px`,
                  marginRight: `${cardGap}px`,
                }}
              >
                <div className="clients-testimonial-card-inner">
                  {/* Left Column: Brand, Headline, Quote, Feedback Giver */}
                  <div className="clients-testimonial-card-col clients-testimonial-card-col--text">
                    {/* Brand row: Logo + Company name (Clean without yellow pill) */}
                    <div className="clients-testimonial-card__brand-row">
                      {item.logoUrl ? (
                        <div className="clients-testimonial-card__logo-wrap">
                          <Image
                            src={item.logoUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="clients-testimonial-card__logo-img"
                            unoptimized={item.logoUrl.startsWith('data:')}
                          />
                        </div>
                      ) : item.logoType ? (
                        <div className="clients-testimonial-card__logo-wrap">
                          <ClientLogo
                            type={item.logoType}
                            className="clients-testimonial-card__logo-svg"
                          />
                        </div>
                      ) : null}
                      <span className="clients-testimonial-card__company-name">
                        {item.companyName}
                      </span>
                    </div>

                    {/* Headline / Title */}
                    <h3 className="clients-testimonial-card__headline">
                      {item.headline || 'Exceeded All Expectations!'}
                    </h3>

                    {/* Feedback quote body */}
                    <blockquote className="clients-testimonial-card__quote">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>

                    {/* Feedback giver signature: Name, Position, and Company */}
                    <div className="clients-testimonial-card__giver">
                      <span className="clients-testimonial-card__giver-name">
                        {item.authorName}
                      </span>
                      <span className="clients-testimonial-card__giver-role">
                        {item.authorRole} • {item.companyName}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Feedback Giver Photo (Full width and height) */}
                  <div className="clients-testimonial-card-col clients-testimonial-card-col--photo">
                    <div className="clients-testimonial-card__photo-frame">
                      <Image
                        src={item.photoUrl}
                        alt={`${item.authorName}, ${item.authorRole} at ${item.companyName}`}
                        width={600}
                        height={600}
                        priority={item._origIndex === 0}
                        className="clients-testimonial-card__photo-img"
                      />
                      <div
                        className="clients-testimonial-card__photo-overlay"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls: Centered Prev / Next Buttons & Indicators */}
      <div className="clients-testimonial-carousel__controls">
        <button
          type="button"
          onClick={goToPrev}
          className="clients-carousel-nav-btn clients-carousel-nav-btn--prev"
          aria-label="Previous testimonial"
          title="Previous testimonial"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Bullet Pagination Indicators */}
        <div
          className="clients-carousel-dots"
          aria-label="Select testimonial slide"
        >
          {testimonials.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              aria-current={idx === realIndex ? 'true' : undefined}
              aria-label={`Go to slide ${idx + 1}: ${item.companyName}`}
              onClick={() => goToSlide(idx)}
              className={`clients-carousel-dot ${
                idx === realIndex ? 'clients-carousel-dot--active' : ''
              }`}
            >
              {idx === realIndex && (
                <span
                  aria-hidden="true"
                  className="clients-carousel-dot__fill"
                  key={realIndex}
                />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          className="clients-carousel-nav-btn clients-carousel-nav-btn--next"
          aria-label="Next testimonial"
          title="Next testimonial"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
