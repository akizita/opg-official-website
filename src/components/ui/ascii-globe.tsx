'use client'

import React, { useEffect, useRef } from 'react'

interface AsciiGlobeProps {
  className?: string
}

// Key OPG Talent Hub Coordinates (lat/lon in degrees)
const OPG_HUBS = [
  { name: 'PH-HQ', lat: 14.6, lon: 121.0 },
  { name: 'AU', lat: -33.8, lon: 151.2 },
  { name: 'SG', lat: 1.3, lon: 103.8 },
  { name: 'UK', lat: 51.5, lon: -0.1 },
  { name: 'US', lat: 40.7, lon: -74.0 },
]

// Accurate continent land boundary detector
const LAND_REGIONS = [
  // North America
  {
    minLat: 14,
    maxLat: 72,
    minLon: -168,
    maxLon: -52,
    check: (lat: number, lon: number) => {
      if (lat > 52 && lon < -140 && lon > -168) return true // Alaska
      if (lat > 48 && lon >= -140 && lon <= -52) return true // Canada
      if (lat >= 25 && lat <= 48 && lon >= -125 && lon <= -67) return true // USA
      if (lat >= 14 && lat < 25 && lon >= -105 && lon <= -82) return true // Mexico / C.America
      if (lat >= 7 && lat < 14 && lon >= -86 && lon <= -77) return true // Panama
      return false
    },
  },
  // Greenland
  {
    minLat: 60,
    maxLat: 83,
    minLon: -55,
    maxLon: -18,
    check: () => true,
  },
  // South America
  {
    minLat: -56,
    maxLat: 13,
    minLon: -82,
    maxLon: -34,
    check: (lat: number, lon: number) => {
      if (lat > -5 && lon >= -80 && lon <= -35) return true // Colombia / Venezuela / N.Brazil
      if (lat <= -5 && lat > -22 && lon >= -76 && lon <= -35) return true // Central S.America
      if (lat <= -22 && lat > -40 && lon >= -72 && lon <= -48) return true // S.Brazil / Argentina
      if (lat <= -40 && lon >= -74 && lon <= -64) return true // Patagonia / Chile / Argentina
      return false
    },
  },
  // Europe
  {
    minLat: 36,
    maxLat: 71,
    minLon: -10,
    maxLon: 36,
    check: (lat: number, lon: number) => {
      if (lat >= 50 && lat <= 58 && lon >= -6 && lon <= 2) return true // UK
      if (lat >= 55 && lat <= 71 && lon >= 5 && lon <= 30) return true // Scandinavia
      if (lat >= 43 && lat <= 55 && lon >= -5 && lon <= 30) return true // Central / W Europe
      if (lat >= 36 && lat < 43 && lon >= -9 && lon <= 26) return true // Iberia, Italy, Greece
      return false
    },
  },
  // Africa
  {
    minLat: -35,
    maxLat: 37,
    minLon: -18,
    maxLon: 52,
    check: (lat: number, lon: number) => {
      if (lat >= 20 && lat <= 37 && lon >= -15 && lon <= 35) return true // North Africa / Sahara
      if (lat >= 5 && lat < 20 && lon >= -17 && lon <= 45) return true // Sahel / W.Africa / Horn
      if (lat >= -10 && lat < 5 && lon >= 8 && lon <= 42) return true // Central Africa
      if (lat >= -25 && lat < -10 && lon >= 12 && lon <= 40) return true // Southern Africa
      if (lat >= -35 && lat < -25 && lon >= 16 && lon <= 33) return true // South Africa
      if (lat >= -25 && lat <= -12 && lon >= 43 && lon <= 50) return true // Madagascar
      return false
    },
  },
  // Middle East & Asia
  {
    minLat: -10,
    maxLat: 75,
    minLon: 26,
    maxLon: 150,
    check: (lat: number, lon: number) => {
      if (lat >= 50 && lon >= 30 && lon <= 170) return true // Russia / Siberia
      if (lat >= 30 && lat < 50 && lon >= 35 && lon <= 130) return true // Central Asia, China
      if (lat >= 12 && lat < 30 && lon >= 35 && lon <= 60) return true // Arabian Peninsula
      if (lat >= 8 && lat < 30 && lon >= 68 && lon <= 90) return true // India
      if (lat >= 10 && lat < 30 && lon >= 95 && lon <= 122) return true // SE Asia
      if (lat >= 30 && lat <= 45 && lon >= 128 && lon <= 145) return true // Japan
      if (lat >= 10 && lat <= 19 && lon >= 118 && lon <= 126) return true // Philippines (OPG HQ)
      if (lat >= -10 && lat < 10 && lon >= 95 && lon <= 140) return true // Indonesia / Malaysia / Singapore
      return false
    },
  },
  // Australia & New Zealand
  {
    minLat: -48,
    maxLat: -10,
    minLon: 112,
    maxLon: 178,
    check: (lat: number, lon: number) => {
      if (lat >= -40 && lat <= -11 && lon >= 113 && lon <= 154) return true // Australia
      if (lat >= -44 && lat <= -40 && lon >= 144 && lon <= 149) return true // Tasmania
      if (lat >= -47 && lat <= -34 && lon >= 166 && lon <= 178) return true // New Zealand
      return false
    },
  },
  // Antarctica
  {
    minLat: -90,
    maxLat: -65,
    minLon: -180,
    maxLon: 180,
    check: () => true,
  },
]

function isLand(lat: number, lon: number): boolean {
  for (let i = 0; i < LAND_REGIONS.length; i++) {
    const reg = LAND_REGIONS[i]
    if (
      lat >= reg.minLat &&
      lat <= reg.maxLat &&
      lon >= reg.minLon &&
      lon <= reg.maxLon
    ) {
      if (reg.check(lat, lon)) return true
    }
  }
  return false
}

export function AsciiGlobe({ className }: AsciiGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId = 0
    let isRunning = false
    let phi = 2.1 // Start facing Asia/Pacific & Australia
    let theta = 0.26 // ~15 deg axial tilt
    let isPageVisible =
      typeof document !== 'undefined' ? !document.hidden : true
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // Pointer Drag Tracking
    let isDragging = false
    let startX = 0
    let startY = 0
    let dragVelocityX = 0

    // Safe Start / Stop Loop
    const startLoop = () => {
      if (reduceMotion || !isPageVisible || isRunning) return
      isRunning = true
      animationId = requestAnimationFrame(render)
    }

    const stopLoop = () => {
      isRunning = false
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = 0
      }
    }

    const render = () => {
      if (!isPageVisible || reduceMotion) {
        isRunning = false
        animationId = 0
        return
      }

      if (!isDragging) {
        phi = (phi + 0.0055 + dragVelocityX) % (Math.PI * 2)
        if (phi < 0) phi += Math.PI * 2
        dragVelocityX *= 0.94 // Smooth drag momentum dissipation
      }

      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = rect.width
      const height = rect.height

      if (width <= 0 || height <= 0) {
        if (!reduceMotion && isPageVisible) {
          animationId = requestAnimationFrame(render)
        } else {
          isRunning = false
          animationId = 0
        }
        return
      }

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      // Character grid dimensions based on viewport
      // Monospace aspect ratio: characters are ~1.7x taller than wide
      const charWidth = 7.2
      const charHeight = 12.2
      const cols = Math.floor(width / charWidth)
      const rows = Math.floor(height / charHeight)

      const centerX = cols / 2
      const centerY = rows / 2
      // Sphere radius fits comfortably in the grid
      const radiusCols = Math.min(
        cols * 0.44,
        rows * 0.44 * (charHeight / charWidth),
      )
      const radiusRows = radiusCols * (charWidth / charHeight)

      ctx.font = '10.5px "JetBrains Mono", "Fira Code", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const cosPhi = Math.cos(phi)
      const sinPhi = Math.sin(phi)
      const cosTheta = Math.cos(theta)
      const sinTheta = Math.sin(theta)

      for (let y = 0; y < rows; y++) {
        const yn = (y - centerY) / radiusRows
        const yn2 = yn * yn

        if (yn2 > 1.0) continue

        for (let x = 0; x < cols; x++) {
          const xn = (x - centerX) / radiusCols
          const distSq = xn * xn + yn2

          if (distSq > 1.0) continue

          const zn = Math.sqrt(1.0 - distSq)

          // 3D Rotation (Y-axis phi rotation, then X-axis theta tilt)
          const xr = xn * cosPhi + zn * sinPhi
          const zr = -xn * sinPhi + zn * cosPhi
          const yr = yn

          const yt = yr * cosTheta - zr * sinTheta
          const zt = yr * sinTheta + zr * cosTheta
          const xt = xr

          const lat = Math.asin(Math.max(-1, Math.min(1, yt)))
          const lon = Math.atan2(xt, zt)
          const latDeg = (lat * 180) / Math.PI
          const lonDeg = (lon * 180) / Math.PI

          const pixelX = x * charWidth + charWidth / 2
          const pixelY = y * charHeight + charHeight / 2

          // Check if an OPG Talent Hub is nearby
          let hubFound = false
          for (let h = 0; h < OPG_HUBS.length; h++) {
            const hub = OPG_HUBS[h]
            const dLat = Math.abs(latDeg - hub.lat)
            const dLon = Math.abs(
              ((((lonDeg - hub.lon) % 360) + 540) % 360) - 180,
            )
            if (dLat < 4.2 && dLon < 5.0 && zt > 0.15) {
              hubFound = true
              break
            }
          }

          if (hubFound) {
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = '#fbbf24'
            ctx.shadowBlur = 8
            ctx.fillText('●', pixelX, pixelY)
            ctx.shadowBlur = 0
            continue
          }

          // Atmosphere Horizon Outer Rim (Soft dotted halo)
          if (distSq > 0.955) {
            ctx.fillStyle = 'rgba(254, 240, 138, 0.35)'
            ctx.fillText('·', pixelX, pixelY)
            continue
          }

          const land = isLand(latDeg, lonDeg)

          if (land) {
            // Lighting / normal shading using purely dots of varying weight & luminosity
            const light = Math.max(0, xn * 0.35 - yn * 0.3 + zn * 0.88)
            let char = '•'
            let fill = '#f59e0b'

            if (light > 0.75) {
              char = '●'
              fill = '#fef08a'
            } else if (light > 0.52) {
              char = '•'
              fill = '#fbbf24'
            } else if (light > 0.3) {
              char = '•'
              fill = '#f59e0b'
            } else {
              char = '·'
              fill = '#d97706'
            }

            ctx.fillStyle = fill
            ctx.fillText(char, pixelX, pixelY)
          } else {
            // Ocean surface & graticule meridians / parallels using subtle dots
            const isParallel = Math.abs(latDeg % 30) < 3.2
            const isMeridian = Math.abs(((lonDeg % 30) + 30) % 30) < 3.2

            if (isParallel && isMeridian) {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.32)'
              ctx.fillText('·', pixelX, pixelY)
            } else if (isParallel || isMeridian) {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.18)'
              ctx.fillText('·', pixelX, pixelY)
            } else {
              // Dim subtle ocean surface dot
              ctx.fillStyle = 'rgba(245, 158, 11, 0.08)'
              ctx.fillText('·', pixelX, pixelY)
            }
          }
        }
      }

      ctx.restore()

      if (!reduceMotion && isPageVisible) {
        animationId = requestAnimationFrame(render)
      } else {
        isRunning = false
        animationId = 0
      }
    }

    // Pointer Interaction Handlers
    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      dragVelocityX = 0
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      startX = e.clientX
      startY = e.clientY
      phi += dx * 0.008
      theta = Math.max(-0.6, Math.min(0.6, theta - dy * 0.005))
      dragVelocityX = dx * 0.003
    }

    const handlePointerUp = () => {
      isDragging = false
      startLoop()
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden
      if (isPageVisible) {
        startLoop()
      } else {
        stopLoop()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start continuous spin
    startLoop()

    return () => {
      stopLoop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '18rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {/* Ambient Radial Golden Aura behind ASCII Globe */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.06) 45%, transparent 70%)',
          filter: 'blur(32px)',
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D ASCII Globe representing OPG's global network. Click and drag horizontally to rotate."
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  )
}
