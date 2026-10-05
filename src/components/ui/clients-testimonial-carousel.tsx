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
  metricBadge?: string
  rating?: number
  industry?: string
  photoUrl: string
}

interface ClientsTestimonialCarouselProps {
  testimonials: readonly CarouselTestimonialItem[]
}

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
  const [isPaused, setIsPaused] = useState(false)
  const [isInViewport, setIsInViewport] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const isNavigatingRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Real active index (0 to total - 1)
  const realIndex = total > 0 ? ((virtualIndex % total) + total) % total : 0

  // Measure container width and initialize without animation
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      } else {
        setContainerWidth(window.innerWidth)
      }
    }

    const initialFrame = requestAnimationFrame(() => {
      updateWidth()
      setIsMounted(true)
    })

    // Re-enable smooth transition after initial placement settles
    const timer = setTimeout(() => {
      setEnableTransition(true)
    }, 60)

    window.addEventListener('resize', updateWidth)
    return () => {
      cancelAnimationFrame(initialFrame)
      clearTimeout(timer)
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  // Avoid carousel updates and compositor work while the section is offscreen.
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { rootMargin: '120px 0px', threshold: 0.05 },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Calculate card width and track translation offset
  const width = containerWidth || 1200
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1120

  let cardWidth = 900
  if (isMobile) {
    cardWidth = Math.min(width - 32, 460)
  } else if (isTablet) {
    cardWidth = Math.min(width * 0.84, 700)
  } else {
    // Desktop: a more prominent editorial card with adjacent testimonials still visible.
    cardWidth = Math.min(Math.max(780, width * 0.58), 920)
  }

  const cardGap = isMobile ? 14 : isTablet ? 22 : 32

  // Center the active card in the viewport
  const trackOffset =
    (width - cardWidth) / 2 - virtualIndex * (cardWidth + cardGap)

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setEnableTransition(true)
    setVirtualIndex((prev) => prev + 1)
  }, [])

  const goToPrev = useCallback(() => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setEnableTransition(true)
    setVirtualIndex((prev) => prev - 1)
  }, [])

  const goToSlide = useCallback(
    (targetRealIndex: number) => {
      if (isNavigatingRef.current || total === 0) return
      isNavigatingRef.current = true
      setEnableTransition(true)
      const currentReal = ((virtualIndex % total) + total) % total
      const diff = targetRealIndex - currentReal
      setVirtualIndex((prev) => prev + diff)
    },
    [total, virtualIndex],
  )

  // Autoplay with pause on hover / focus
  useEffect(() => {
    if (isPaused || !isInViewport || total <= 1) return
    const timer = setInterval(() => {
      goToNext()
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, isInViewport, total, goToNext])

  // Handle transition end for seamless infinite loop
  const handleTransitionEnd = useCallback(() => {
    isNavigatingRef.current = false
    if (total === 0) return

    // If we've traversed into post or pre sets, reset back to main set invisibly
    if (virtualIndex >= 2 * total) {
      setEnableTransition(false)
      setVirtualIndex((prev) => prev - total)
    } else if (virtualIndex < total) {
      setEnableTransition(false)
      setVirtualIndex((prev) => prev + total)
    }
  }, [total, virtualIndex])

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
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
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
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Client Partner Testimonials Carousel"
      aria-describedby="clients-carousel-instructions"
    >
      <p id="clients-carousel-instructions" className="sr-only">
        Use the previous and next buttons or the left and right arrow keys to
        browse testimonials. Autoplay pauses when hovered or focused.
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Testimonial {realIndex + 1} of {total}:{' '}
        {testimonials[realIndex].companyName}
      </p>

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
                ? 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)'
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
                  {/* Left Column: Brand, Industry, Stars, Headline, Quote, Author */}
                  <div className="clients-testimonial-card-col clients-testimonial-card-col--text">
                    {/* 1. Company Logo + Company Name & Quote Glyph */}
                    <div className="clients-testimonial-card__header-row">
                      <div className="clients-testimonial-card__brand">
                        {item.logoType && (
                          <div className="clients-testimonial-card__logo-wrap">
                            <ClientLogo
                              type={item.logoType}
                              className="clients-testimonial-card__logo-svg"
                            />
                          </div>
                        )}
                        <span className="clients-testimonial-card__company-name">
                          {item.companyName}
                        </span>
                      </div>

                      {/* Consistent, subtle gold quote icon */}
                      <span
                        className="clients-testimonial-card__quote-mark"
                        aria-hidden="true"
                      >
                        &ldquo;
                      </span>
                    </div>

                    {/* 2. Small Industry Label */}
                    {item.industry && (
                      <span className="clients-testimonial-card__industry">
                        {item.industry}
                      </span>
                    )}

                    {/* 3. Star Rating (5 gold stars) */}
                    <div
                      className="clients-testimonial-card__stars"
                      aria-label={`${item.rating || 5} out of 5 stars`}
                    >
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <svg
                          key={i}
                          className="clients-testimonial-card__star-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="#f5b301"
                          aria-hidden="true"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    {/* 4. Headline (bold, max 2 lines) */}
                    <h3 className="clients-testimonial-card__headline">
                      {item.headline || 'Exceeded All Expectations!'}
                    </h3>

                    {/* 5. Quote (readable size, 1.6+ line-height, max ~6 lines) */}
                    <blockquote className="clients-testimonial-card__quote">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>

                    {/* 6. Divider & Author Signature */}
                    <div
                      className="clients-testimonial-card__divider"
                      aria-hidden="true"
                    />

                    <div className="clients-testimonial-card__giver">
                      <span className="clients-testimonial-card__giver-name">
                        {item.authorName}
                      </span>
                      <span className="clients-testimonial-card__giver-role">
                        {item.authorRole} •{' '}
                        <span className="clients-testimonial-card__giver-company">
                          {item.companyName}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Consistent B&W Portrait Photo + Prominent Floating Metric Badge */}
                  <div className="clients-testimonial-card-col clients-testimonial-card-col--photo">
                    <div className="clients-testimonial-card__photo-frame">
                      <Image
                        src={item.photoUrl}
                        alt={`${item.authorName}, ${item.authorRole} at ${item.companyName}`}
                        width={640}
                        height={640}
                        priority={index === total}
                        sizes="(max-width: 48rem) 100vw, (max-width: 70rem) 42vw, 34vw"
                        className="clients-testimonial-card__photo-img"
                      />
                      <div
                        className="clients-testimonial-card__photo-overlay"
                        aria-hidden="true"
                      />

                      {/* Prominent Metric Badge Overlaid on Photo's Bottom */}
                      {item.metricBadge && (
                        <div className="clients-testimonial-card__metric-badge">
                          <span className="clients-testimonial-card__metric-label">
                            Key Outcome
                          </span>
                          <span className="clients-testimonial-card__metric-val">
                            {item.metricBadge}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls: Centered Prev / Next Buttons, Counter, and Dots */}
      <div className="clients-testimonial-carousel__controls">
        <button
          type="button"
          onClick={goToPrev}
          className="clients-carousel-nav-btn clients-carousel-nav-btn--prev"
          aria-label="Previous testimonial"
          title="Previous testimonial"
        >
          <svg
            width="16"
            height="16"
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

        {/* Executive 01 / 05 Counter + Interactive Dots */}
        <div className="clients-carousel-indicator-group">
          <span
            className="clients-carousel-counter"
            aria-label={`Slide ${realIndex + 1} of ${total}`}
          >
            {String(realIndex + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(total).padStart(2, '0')}
          </span>

          <div
            className="clients-carousel-dots"
            role="tablist"
            aria-label="Select testimonial slide"
          >
            {testimonials.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === realIndex}
                aria-label={`Go to slide ${idx + 1}: ${item.companyName}`}
                onClick={() => goToSlide(idx)}
                className={`clients-carousel-dot ${
                  idx === realIndex ? 'clients-carousel-dot--active' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goToNext}
          className="clients-carousel-nav-btn clients-carousel-nav-btn--next"
          aria-label="Next testimonial"
          title="Next testimonial"
        >
          <svg
            width="16"
            height="16"
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

export default ClientsTestimonialCarousel
