'use client'

import React, { useEffect, useRef, useState } from 'react'
import createGlobe from 'cobe'
import { motion, useReducedMotion } from 'framer-motion'
import { ButtonLink } from '@/components/ui/button-link'
import { CLIENT_PAGE_DEFAULTS } from '@/lib/content/client-page'

// Strategic offshore hubs and client locations
const GLOBE_MARKERS: Array<{
  location: [number, number]
  size: number
  color?: [number, number, number]
}> = [
  { location: [14.5995, 120.9842], size: 0.08, color: [1, 0.78, 0.12] }, // Manila HQ (Core Hub)
  { location: [37.7749, -122.4194], size: 0.065, color: [0.95, 0.65, 0.08] }, // San Francisco (Northstar Labs)
  { location: [-33.8688, 151.2093], size: 0.065, color: [0.95, 0.65, 0.08] }, // Sydney (Meridian Health)
  { location: [51.5074, -0.1278], size: 0.065, color: [0.95, 0.65, 0.08] }, // London (Harborline Finance)
  { location: [1.3521, 103.8198], size: 0.06, color: [0.95, 0.65, 0.08] }, // Singapore (Atlas Commerce)
  { location: [25.2048, 55.2708], size: 0.06, color: [0.95, 0.65, 0.08] }, // Dubai (Veridian Operations)
]

const GLOBE_ARCS: Array<{
  from: [number, number]
  to: [number, number]
  color?: [number, number, number]
}> = [
  {
    from: [14.5995, 120.9842],
    to: [37.7749, -122.4194],
    color: [0.98, 0.72, 0.15],
  },
  {
    from: [14.5995, 120.9842],
    to: [-33.8688, 151.2093],
    color: [0.98, 0.72, 0.15],
  },
  {
    from: [14.5995, 120.9842],
    to: [51.5074, -0.1278],
    color: [0.98, 0.72, 0.15],
  },
  {
    from: [14.5995, 120.9842],
    to: [1.3521, 103.8198],
    color: [0.98, 0.72, 0.15],
  },
  {
    from: [14.5995, 120.9842],
    to: [25.2048, 55.2708],
    color: [0.98, 0.72, 0.15],
  },
]

export function ClientsGlobeHero({
  title = CLIENT_PAGE_DEFAULTS.title,
  summary = CLIENT_PAGE_DEFAULTS.summary,
  copy,
}: {
  title?: string
  summary?: string
  copy: Record<string, string>
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const phiRef = useRef(0)
  const shouldReduceMotion = useReducedMotion()
  const [hasWebGLFailed, setHasWebGLFailed] = useState(false)

  // Drag interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing'
    }
  }

  const handlePointerUp = () => {
    pointerInteracting.current = null
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab'
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
    }
  }

  // Cobe WebGL Globe Initialization & Animation
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    let width = 0
    let globe: {
      update: (opts: Record<string, unknown>) => void
      destroy: () => void
    } | null = null
    let animId = 0
    let isInViewport = false
    let isPageVisible = !document.hidden
    const renderScale = Math.min(window.devicePixelRatio || 1, 1.5)

    const onResize = () => {
      width = canvas.offsetWidth
    }
    onResize()

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: renderScale,
        width: (width || 800) * renderScale,
        height: (width || 800) * renderScale,
        phi: 0,
        theta: 0.28,
        dark: 1,
        diffuse: 1.25,
        mapSamples: 10000,
        mapBrightness: 5.5,
        baseColor: [0.14, 0.11, 0.06], // Deep warm charcoal/amber base
        markerColor: [1, 0.75, 0.1], // Glowing golden amber
        glowColor: [0.95, 0.65, 0.08], // Ambient golden atmosphere
        markers: GLOBE_MARKERS,
        arcs: GLOBE_ARCS,
        arcColor: [0.98, 0.72, 0.15],
        arcWidth: 1.2,
        arcHeight: 0.24,
        markerElevation: 0.04,
      })

      const animate = () => {
        animId = 0
        if (!globe || !isInViewport || !isPageVisible) return

        if (!shouldReduceMotion) {
          if (pointerInteracting.current !== null) {
            phiRef.current +=
              (pointerInteractionMovement.current * 0.005 - phiRef.current) *
              0.08
          } else {
            phiRef.current += 0.0028
          }
        }

        globe.update({
          phi: phiRef.current,
          width: width * renderScale,
          height: width * renderScale,
        })

        if (!shouldReduceMotion) {
          animId = requestAnimationFrame(animate)
        }
      }

      const startAnimation = () => {
        if (!animId && isInViewport && isPageVisible) {
          animId = requestAnimationFrame(animate)
        }
      }

      const stopAnimation = () => {
        if (animId) {
          cancelAnimationFrame(animId)
          animId = 0
        }
      }

      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          isInViewport = entry.isIntersecting
          if (isInViewport) startAnimation()
          else stopAnimation()
        },
        { rootMargin: '100px 0px' },
      )

      const resizeObserver = new ResizeObserver(() => {
        onResize()
        startAnimation()
      })

      const onVisibilityChange = () => {
        isPageVisible = !document.hidden
        if (isPageVisible) startAnimation()
        else stopAnimation()
      }

      intersectionObserver.observe(canvas)
      resizeObserver.observe(canvas)
      document.addEventListener('visibilitychange', onVisibilityChange)

      return () => {
        stopAnimation()
        intersectionObserver.disconnect()
        resizeObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        globe?.destroy()
      }
    } catch {
      queueMicrotask(() => setHasWebGLFailed(true))
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
      globe?.destroy()
    }
  }, [shouldReduceMotion])

  return (
    <div className="clients-hero-wrapper">
      {/* 1. Dark Hero Section with Overflow Hidden & Rounded Bottom Corners */}
      <section className="clients-hero" aria-labelledby="clients-hero-title">
        {/* Background Radial Vignette */}
        <div className="clients-hero__vignette" aria-hidden="true" />

        {/* Atmospheric Golden Horizon Dome (Inspo 3) */}
        <div className="clients-hero__dome-glow" aria-hidden="true" />

        <div className="container clients-hero__container">
          {/* Header Typography & Dual Actions */}
          <div className="clients-hero__content">
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="clients-hero__eyebrow"
            >
              {copy.heroBadge}
            </motion.p>

            <motion.h1
              id="clients-hero-title"
              className="clients-hero__title"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {title === CLIENT_PAGE_DEFAULTS.title
                ? 'Powering Global Teams for Industry Leaders.'
                : title}
            </motion.h1>

            <motion.p
              className="clients-hero__lead"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.18,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {summary}
            </motion.p>

            <motion.div
              className="clients-hero__actions"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <ButtonLink
                href="/contact"
                variant="primary"
                className="clients-hero__btn-primary"
              >
                {copy.heroCta}
              </ButtonLink>
              <a
                href="#clients-blog-heading"
                className="clients-hero__btn-secondary"
              >
                {copy.heroSecondary}
              </a>
            </motion.div>
          </div>
        </div>

        {/* 2. Interactive 3D Dotted Half-Globe Stage cropped cleanly by section bottom boundary */}
        <div className="clients-hero__stage">
          <div
            className="clients-hero__globe-wrapper"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            role="region"
            aria-label="Interactive 3D Global Client Network Globe. Click and drag horizontally to rotate."
          >
            {!hasWebGLFailed ? (
              <canvas
                ref={canvasRef}
                className="clients-hero__canvas"
                style={{ width: '100%', height: '100%', cursor: 'grab' }}
              />
            ) : (
              <div className="clients-hero__fallback-globe" aria-hidden="true">
                <div className="clients-hero__fallback-grid" />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ClientsGlobeHero
