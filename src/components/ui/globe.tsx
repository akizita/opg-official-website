'use client'

import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'

export interface HeroGlobeProps {
  className?: string
  opacity?: number
}

export function HeroGlobe({ className = '', opacity = 0.22 }: HeroGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let phi = 0
    let width = 0
    const canvas = canvasRef.current
    if (!canvas) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isReducedMotion = mediaQuery.matches

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth
      }
    }
    window.addEventListener('resize', onResize)
    onResize()

    let globe: ReturnType<typeof createGlobe> | null = null

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: (width || 600) * 2,
        height: (width || 600) * 2,
        phi: 0,
        theta: 0.22,
        dark: 0,
        diffuse: 1.4,
        mapSamples: 14000,
        mapBrightness: 3.5,
        baseColor: [0.72, 0.76, 0.82], // Refined cool-gray dots
        markerColor: [0.95, 0.62, 0.02], // Vibrant OPG Golden Orange
        glowColor: [1.0, 0.92, 0.78], // Luminous golden ambient glow
        markers: [
          { location: [14.5995, 120.9842], size: 0.09 }, // Manila (OPG Global Operations)
          { location: [40.7128, -74.006], size: 0.07 }, // New York
          { location: [37.7749, -122.4194], size: 0.07 }, // San Francisco
          { location: [51.5074, -0.1278], size: 0.06 }, // London
          { location: [-33.8688, 151.2093], size: 0.06 }, // Sydney
          { location: [1.3521, 103.8198], size: 0.06 }, // Singapore
          { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
          { location: [43.6532, -79.3832], size: 0.05 }, // Toronto
        ],
        onRender: (state) => {
          if (!isReducedMotion) {
            phi += 0.003
          }
          state.phi = phi
          if (width) {
            state.width = width * 2
            state.height = width * 2
          }
        },
      })

      // Smooth fade-in
      setTimeout(() => {
        if (canvas) canvas.style.opacity = '1'
      }, 50)
    } catch {
      // Gracefully handle environments without WebGL
    }

    return () => {
      window.removeEventListener('resize', onResize)
      if (globe) {
        globe.destroy()
      }
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`hero-globe-wrapper ${className}`}
      style={{ opacity }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          contain: 'layout paint size',
          opacity: 0,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default HeroGlobe
