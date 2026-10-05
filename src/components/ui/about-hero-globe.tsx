'use client'

import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'

export function AboutHeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let width = canvas.offsetWidth || 760
    let frameId = 0
    let phi = -0.72
    let isVisible = false
    let isPageVisible = !document.hidden
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const renderScale = Math.min(window.devicePixelRatio || 1, 1.25)

    let globe: {
      update: (options: Record<string, unknown>) => void
      destroy: () => void
    } | null = null

    const renderFrame = () => {
      frameId = 0
      if (!globe || !isVisible || !isPageVisible) return

      if (!reduceMotion) phi += 0.00125
      globe.update({
        phi,
        width: width * renderScale,
        height: width * renderScale,
      })

      if (!reduceMotion) frameId = requestAnimationFrame(renderFrame)
    }

    const start = () => {
      if (!frameId && isVisible && isPageVisible) {
        frameId = requestAnimationFrame(renderFrame)
      }
    }

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = 0
    }

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: renderScale,
        width: width * renderScale,
        height: width * renderScale,
        phi,
        theta: 0.12,
        dark: 1,
        diffuse: 0.85,
        mapSamples: 13000,
        mapBrightness: 7.2,
        baseColor: [0.055, 0.055, 0.065],
        markerColor: [0.95, 0.95, 0.95],
        glowColor: [0.13, 0.13, 0.15],
        markers: [],
      })
    } catch {
      return
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible) start()
        else stop()
      },
      { rootMargin: '80px 0px' },
    )

    const resizeObserver = new ResizeObserver(() => {
      width = canvas.offsetWidth || width
      start()
    })

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden
      if (isPageVisible) start()
      else stop()
    }

    intersectionObserver.observe(canvas)
    resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      globe?.destroy()
    }
  }, [])

  return (
    <div aria-hidden="true" className="about-hero-globe">
      <div className="about-hero-globe__halo" />
      <canvas ref={canvasRef} className="about-hero-globe__canvas" />
    </div>
  )
}
