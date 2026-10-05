'use client'

import React, { useEffect, useRef, useState } from 'react'
import createGlobe from 'cobe'
import { motion, useReducedMotion } from 'framer-motion'
import { ButtonLink } from '@/components/ui/button-link'
import { ClientLogo, type ClientLogoType } from '@/components/ui/client-logo'

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

const CLIENT_CARDS_DATA: Array<{
  id: string
  name: string
  domain: string
  logoType: ClientLogoType
}> = [
  {
    id: 'northstar-labs',
    name: 'Northstar Labs',
    domain: 'Enterprise SaaS',
    logoType: 'northstar',
  },
  {
    id: 'meridian-health',
    name: 'Meridian Health',
    domain: 'Healthcare Tech',
    logoType: 'meridian',
  },
  {
    id: 'harborline-finance',
    name: 'Harborline Finance',
    domain: 'Fintech & Compliance',
    logoType: 'harborline',
  },
  {
    id: 'atlas-commerce',
    name: 'Atlas Commerce',
    domain: 'Global E-Commerce',
    logoType: 'atlas',
  },
  {
    id: 'veridian-operations',
    name: 'Veridian Operations',
    domain: 'Shared Services',
    logoType: 'veridian',
  },
]

export function ClientsGlobeHero() {
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

    let width = 0
    let globe: { update: (opts: Record<string, unknown>) => void; destroy: () => void } | null = null
    let animId: number

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }
    window.addEventListener('resize', onResize)
    onResize()

    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: (width || 800) * 2,
        height: (width || 800) * 2,
        phi: 0,
        theta: 0.28,
        dark: 1,
        diffuse: 1.25,
        mapSamples: 16000,
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
        if (!globe) return

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
          width: width * 2,
          height: width * 2,
        })

        animId = requestAnimationFrame(animate)
      }

      animId = requestAnimationFrame(animate)
    } catch {
      setHasWebGLFailed(true)
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (globe) globe.destroy()
      window.removeEventListener('resize', onResize)
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
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="clients-hero__badge"
              role="text"
            >
              <span aria-hidden="true" className="clients-hero__badge-pulse" />
              <span>Strategic Partnerships &amp; Global Reach</span>
            </motion.div>

            <motion.h1
              id="clients-hero-title"
              className="clients-hero__title"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Powering Global Teams for{' '}
              <span className="clients-hero__title-accent">Industry Leaders.</span>
            </motion.h1>

            <motion.p
              className="clients-hero__lead"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              We collaborate with high-growth technology scaleups, healthcare
              innovators, and multinational enterprises to deploy dedicated,
              rigorously vetted offshore pods that deliver immediate impact and
              sustainable ROI.
            </motion.p>

            <motion.div
              className="clients-hero__actions"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ButtonLink
                href="/contact"
                variant="primary"
                className="clients-hero__btn-primary"
              >
                Partner with Us
              </ButtonLink>
              <a
                href="#client-logos-heading"
                className="clients-hero__btn-secondary"
              >
                Explore Client Work ↓
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

      {/* 3. Centered Anchor: Glassmorphic Client Partner Card Boxes overlapping the hero bottom edge by ~50% */}
      <div className="clients-hero-cards-anchor">
        <motion.div
          className="clients-hero-cards-row"
          role="region"
          aria-label="Featured Client Partners"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {CLIENT_CARDS_DATA.map((client) => (
            <a
              key={client.id}
              href={`#${client.id}`}
              className="clients-hero-card-box"
              title={`View ${client.name} partnership details`}
            >
              <div className="clients-hero-card-box__header">
                <div className="clients-hero-card-box__icon-wrap">
                  <ClientLogo
                    type={client.logoType}
                    className="clients-hero-card-box__svg"
                  />
                </div>
                <span className="clients-hero-card-box__pill">
                  <span
                    className="clients-hero-card-box__dot"
                    aria-hidden="true"
                  />
                  Pod
                </span>
              </div>
              <div className="clients-hero-card-box__info">
                <span className="clients-hero-card-box__name">
                  {client.name}
                </span>
                <span className="clients-hero-card-box__domain">
                  {client.domain}
                </span>
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default ClientsGlobeHero
