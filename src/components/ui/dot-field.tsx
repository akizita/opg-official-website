'use client'

import React, { useEffect, useRef, memo, useId } from 'react'

const TWO_PI = Math.PI * 2

interface Dot {
  ax: number
  ay: number
  sx: number
  sy: number
  vx: number
  vy: number
  x: number
  y: number
}

export interface DotFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  dotRadius?: number
  dotSpacing?: number
  cursorRadius?: number
  cursorForce?: number
  bulgeOnly?: boolean
  bulgeStrength?: number
  glowRadius?: number
  sparkle?: boolean
  waveAmplitude?: number
  gradientFrom?: string
  gradientTo?: string
  glowColor?: string
}

export const DotField = memo(function DotField({
  dotRadius = 1.6,
  dotSpacing = 16,
  cursorRadius = 400,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 60,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = 'rgba(217, 130, 0, 0.78)',
  gradientTo = 'rgba(242, 175, 5, 0.68)',
  glowColor = '#ffe773',
  className = '',
  style,
  ...rest
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef({
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    speed: 0,
  })
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 })
  const glowOpacity = useRef(0)
  const engagement = useRef(0)
  const propsRef = useRef({
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  })

  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
  }

  const rawId = useId()
  const glowId = `dot-field-glow-${rawId.replace(/:/g, '')}`

  useEffect(() => {
    const canvas = canvasRef.current
    const glowEl = glowRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let resizeTimer: ReturnType<typeof setTimeout>

    function buildDots(w: number, h: number) {
      const p = propsRef.current
      const step = p.dotRadius + p.dotSpacing
      if (step <= 0) return
      const cols = Math.floor(w / step)
      const rows = Math.floor(h / step)
      const padX = (w % step) / 2
      const padY = (h % step) / 2
      const dots: Dot[] = new Array(rows * cols)
      let idx = 0

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2
          const ay = padY + row * step + step / 2
          dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay }
        }
      }
      dotsRef.current = dots
    }

    function doResize() {
      if (!canvas || !canvas.parentElement) return
      const rect = canvas.parentElement.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (w <= 0 || h <= 0) return

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      }

      buildDots(w, h)
    }

    function resize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(doResize, 80)
    }

    function onMouseMove(e: MouseEvent) {
      const s = sizeRef.current
      mouseRef.current.x = e.pageX - s.offsetX
      mouseRef.current.y = e.pageY - s.offsetY
    }

    function onMouseLeave() {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    function updateMouseSpeed() {
      const m = mouseRef.current
      const dx = m.prevX - m.x
      const dy = m.prevY - m.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      m.speed += (dist - m.speed) * 0.5
      if (m.speed < 0.001) m.speed = 0
      m.prevX = m.x
      m.prevY = m.y
    }

    const speedInterval = setInterval(updateMouseSpeed, 20)
    let frameCount = 0

    function tick() {
      frameCount++
      const dots = dotsRef.current
      const m = mouseRef.current
      const { w, h } = sizeRef.current
      const p = propsRef.current
      const len = dots.length
      const t = frameCount * 0.025

      const isMouseInside = m.x >= 0 && m.x <= w && m.y >= 0 && m.y <= h
      const targetEngagement = isMouseInside
        ? Math.min(0.4 + (m.speed / 3.5) * 0.6, 1)
        : 0
      engagement.current += (targetEngagement - engagement.current) * 0.08
      if (engagement.current < 0.001) engagement.current = 0
      const eng = engagement.current

      glowOpacity.current += (eng - glowOpacity.current) * 0.1

      if (glowEl) {
        glowEl.setAttribute('cx', String(m.x))
        glowEl.setAttribute('cy', String(m.y))
        glowEl.style.opacity = String(glowOpacity.current)
      }

      ctx!.clearRect(0, 0, w, h)

      if (w > 0 && h > 0) {
        const grad = ctx!.createLinearGradient(0, 0, w, h)
        grad.addColorStop(0, p.gradientFrom)
        grad.addColorStop(1, p.gradientTo)
        ctx!.fillStyle = grad

        const cr = p.cursorRadius
        const crSq = cr * cr
        const rad = p.dotRadius / 2
        const isBulge = p.bulgeOnly

        ctx!.beginPath()

        for (let i = 0; i < len; i++) {
          const d = dots[i]
          const dx = m.x - d.ax
          const dy = m.y - d.ay
          const distSq = dx * dx + dy * dy

          if (distSq < crSq && eng > 0.01) {
            const dist = Math.sqrt(distSq)
            if (isBulge) {
              const tDist = 1 - dist / cr
              const push = tDist * tDist * p.bulgeStrength * eng
              const angle = Math.atan2(dy, dx)
              d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15
              d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15
            } else {
              const angle = Math.atan2(dy, dx)
              const move = (500 / dist) * (m.speed * p.cursorForce)
              d.vx += Math.cos(angle) * -move
              d.vy += Math.sin(angle) * -move
            }
          } else if (isBulge) {
            d.sx += (d.ax - d.sx) * 0.1
            d.sy += (d.ay - d.sy) * 0.1
          }

          if (!isBulge) {
            d.vx *= 0.9
            d.vy *= 0.9
            d.x = d.ax + d.vx
            d.y = d.ay + d.vy
            d.sx += (d.x - d.sx) * 0.1
            d.sy += (d.y - d.sy) * 0.1
          }

          let drawX = d.sx
          let drawY = d.sy
          if (p.waveAmplitude > 0) {
            drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude
            drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5
          }

          if (p.sparkle) {
            const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0
            if (hash % 100 < 3) {
              ctx!.moveTo(drawX + rad * 1.8, drawY)
              ctx!.arc(drawX, drawY, rad * 1.8, 0, TWO_PI)
            } else {
              ctx!.moveTo(drawX + rad, drawY)
              ctx!.arc(drawX, drawY, rad, 0, TWO_PI)
            }
          } else {
            ctx!.moveTo(drawX + rad, drawY)
            ctx!.arc(drawX, drawY, rad, 0, TWO_PI)
          }
        }

        ctx!.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    doResize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    rafRef.current = requestAnimationFrame(tick)

    let resizeObserver: ResizeObserver | null = null
    if (canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        doResize()
      })
      resizeObserver.observe(canvas.parentElement)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearInterval(speedInterval)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      className={`dot-field-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.38" />
            <stop offset="45%" stopColor={glowColor} stopOpacity="0.14" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowId})`}
          style={{ opacity: 0, willChange: 'opacity' }}
        />
      </svg>
    </div>
  )
})

