'use client'

import React, { useEffect, useId, useRef } from 'react'

import styles from './text-loop.module.css'

export const DEFAULT_OPG_LIGHT_LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/opg-light-logo-1789740328075.png'

export interface TextLoopProps {
  text?: string
  logoSrc?: string
  logoAlt?: string
  speed?: number
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  interactive?: boolean
  className?: string
  ariaLabel?: string
}

interface CurveSample {
  length: number
  x: number
  y: number
  angle: number
}

const SLOT_COUNT = 14
const LOGO_SIZE = 28
const SEPARATOR_GAP = 30
const WAVE_PERIOD = 720
const WAVE_START_X = -720
const WAVE_PERIODS = 7

function buildWavePath(): string {
  const parts: string[] = [`M ${WAVE_START_X} 110`]
  for (let i = 0; i < WAVE_PERIODS; i++) {
    const x0 = WAVE_START_X + i * WAVE_PERIOD
    parts.push(
      `C ${x0 + 120} 46, ${x0 + 240} 46, ${x0 + 360} 110`,
      `C ${x0 + 480} 174, ${x0 + 600} 174, ${x0 + 720} 110`,
    )
  }
  return parts.join(' ')
}

const WAVE_PATH = buildWavePath()

function sampleCurveAtLength(
  samples: CurveSample[],
  totalLength: number,
  targetLength: number,
): CurveSample | null {
  if (samples.length === 0 || targetLength < 0 || targetLength > totalLength) {
    return null
  }
  const ratio = targetLength / totalLength
  const exactIndex = ratio * (samples.length - 1)
  const lower = Math.floor(exactIndex)
  const upper = Math.min(samples.length - 1, lower + 1)
  const frac = exactIndex - lower
  const a = samples[lower]
  const b = samples[upper]

  let angleDiff = b.angle - a.angle
  if (angleDiff > 180) angleDiff -= 360
  if (angleDiff < -180) angleDiff += 360

  return {
    length: targetLength,
    x: a.x + (b.x - a.x) * frac,
    y: a.y + (b.y - a.y) * frac,
    angle: a.angle + angleDiff * frac,
  }
}

export function TextLoop({
  text = 'OUTSOURCED PRO GLOBAL',
  logoSrc = DEFAULT_OPG_LIGHT_LOGO_URL,
  logoAlt = 'Outsourced Pro Global mark',
  speed = 64,
  direction = 'left',
  pauseOnHover = true,
  interactive = true,
  className = '',
  ariaLabel,
}: TextLoopProps) {
  const rawId = useId()
  const safeId = rawId.replace(/:/g, '')
  const pathId = `opg-text-loop-path-${safeId}`
  const gradId = `opg-text-loop-grad-${safeId}`
  const logoFilterId = `opg-text-loop-logo-${safeId}`

  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const measureRef = useRef<SVGTextElement>(null)
  const textPathRefs = useRef<(SVGTextPathElement | null)[]>([])
  const logoGroupRefs = useRef<(SVGGElement | null)[]>([])
  const isHoveredRef = useRef(false)
  const isDraggingRef = useRef(false)
  const lastPointerXRef = useRef(0)
  const velocityBoostRef = useRef(0)

  useEffect(() => {
    const pathEl = pathRef.current
    const measureEl = measureRef.current
    if (!pathEl || !measureEl) return

    const totalLength = pathEl.getTotalLength()
    if (totalLength <= 0) return

    // Pre-sample curve positions & tangent angles once to avoid layout thrash per frame
    const SAMPLE_STEPS = 720
    const samples: CurveSample[] = []
    for (let i = 0; i <= SAMPLE_STEPS; i++) {
      const len = (i / SAMPLE_STEPS) * totalLength
      const pt = pathEl.getPointAtLength(len)
      const prevLen = Math.max(0, len - 2)
      const nextLen = Math.min(totalLength, len + 2)
      const p0 = pathEl.getPointAtLength(prevLen)
      const p1 = pathEl.getPointAtLength(nextLen)
      const angle = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI
      samples.push({ length: len, x: pt.x, y: pt.y, angle })
    }

    let textLength = measureEl.getComputedTextLength() || 340
    let stride = textLength + SEPARATOR_GAP * 2 + LOGO_SIZE
    let offset = 0
    let rafId = 0
    let lastTime = performance.now()
    let isDisposed = false
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const updateMetrics = () => {
      if (isDisposed) return
      const measured = measureEl.getComputedTextLength()
      if (measured > 0) {
        textLength = measured
        stride = textLength + SEPARATOR_GAP * 2 + LOGO_SIZE
      }
    }

    const applyPositions = (currentOffset: number) => {
      const normalized = ((currentOffset % stride) + stride) % stride

      for (let i = 0; i < SLOT_COUNT; i++) {
        const textStart = (i - 1) * stride + normalized
        const tp = textPathRefs.current[i]
        if (tp) {
          tp.setAttribute('startOffset', textStart.toFixed(2))
        }

        const logoGroup = logoGroupRefs.current[i]
        if (logoGroup) {
          const logoArc = textStart + textLength + SEPARATOR_GAP + LOGO_SIZE / 2
          const sample = sampleCurveAtLength(samples, totalLength, logoArc)
          if (sample) {
            logoGroup.setAttribute(
              'transform',
              `translate(${sample.x.toFixed(2)}, ${sample.y.toFixed(2)}) rotate(${sample.angle.toFixed(2)})`,
            )
            logoGroup.removeAttribute('opacity')
          } else {
            logoGroup.setAttribute('opacity', '0')
          }
        }
      }
    }

    updateMetrics()
    applyPositions(0)

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        updateMetrics()
        applyPositions(offset)
      })
    }

    const dirSign = direction === 'left' ? -1 : 1

    const step = (now: number) => {
      if (isDisposed) return
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000))
      lastTime = now

      if (!reduceMotion && !document.hidden) {
        if (!isHoveredRef.current && !isDraggingRef.current) {
          offset += dirSign * speed * dt
        }
        if (Math.abs(velocityBoostRef.current) > 0.2) {
          offset += velocityBoostRef.current
          velocityBoostRef.current *= 0.92
        }
        applyPositions(offset)
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(step)
      }
    }

    if (!reduceMotion) {
      rafId = requestAnimationFrame(step)
    }

    const handleVisibility = () => {
      lastTime = performance.now()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isDisposed = true
      if (rafId) cancelAnimationFrame(rafId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [direction, speed, text])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    isDraggingRef.current = true
    lastPointerXRef.current = e.clientX
    velocityBoostRef.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !isDraggingRef.current) return
    const dx = e.clientX - lastPointerXRef.current
    lastPointerXRef.current = e.clientX
    velocityBoostRef.current = dx * 0.75
  }

  const handlePointerEnd = () => {
    isDraggingRef.current = false
  }

  return (
    <div
      aria-label={ariaLabel || text}
      className={`${styles.wrapper} ${interactive ? styles.interactive : ''} ${className}`.trim()}
      onMouseEnter={() => {
        if (pauseOnHover) isHoveredRef.current = true
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
        handlePointerEnd()
      }}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      ref={containerRef}
      role="region"
    >
      <svg
        aria-hidden="true"
        className={styles.svg}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 220"
      >
        <defs>
          <path d={WAVE_PATH} id={pathId} ref={pathRef} />
          <linearGradient id={gradId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#f2b705" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#f2b705" />
          </linearGradient>
          <filter id={logoFilterId}>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.078  0 0 0 0 0.067  0 0 0 0 0.043  0 0 0 1 0"
            />
          </filter>
        </defs>

        {/* Subtle outer warm border framing the yellow ribbon */}
        <path
          d={WAVE_PATH}
          fill="none"
          stroke="rgba(217, 119, 6, 0.28)"
          strokeLinecap="round"
          strokeWidth="64"
        />

        {/* Curved Solid Yellow Ribbon Band */}
        <path
          d={WAVE_PATH}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeWidth="62"
        />

        {/* Hidden ruler text for exact font metric measurement */}
        <text className={styles.measureText} opacity="0" ref={measureRef} x="0" y="-200">
          {text}
        </text>

        {/* Seamless Looping Text Slots */}
        {Array.from({ length: SLOT_COUNT }).map((_, index) => (
          <text
            className={styles.loopText}
            dominantBaseline="central"
            key={`text-slot-${index}`}
          >
            <textPath
              href={`#${pathId}`}
              ref={(el) => {
                textPathRefs.current[index] = el
              }}
              startOffset={index * 420}
            >
              {text}
            </textPath>
          </text>
        ))}

        {/* Tangent-Aligned Light Logo Separators */}
        {Array.from({ length: SLOT_COUNT }).map((_, index) => (
          <g
            key={`logo-slot-${index}`}
            opacity="0"
            ref={(el) => {
              logoGroupRefs.current[index] = el
            }}
          >
            <image
              filter={`url(#${logoFilterId})`}
              height={LOGO_SIZE}
              href={logoSrc}
              preserveAspectRatio="xMidYMid meet"
              width={LOGO_SIZE}
              x={-LOGO_SIZE / 2}
              y={-LOGO_SIZE / 2}
            />
            <title>{logoAlt}</title>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default TextLoop
