'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import gsap from 'gsap'
import Image from 'next/image'

export interface DepthCarouselItem {
  image: string
  alt?: string
  name?: string
  position?: string
  [key: string]: unknown
}

export interface DepthCarouselHandle {
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  getActiveIndex: () => number
}

type TiltDirection = 'left' | 'right'

export interface DepthCarouselProps {
  items?: DepthCarouselItem[]
  cardWidth?: number
  cardHeight?: number
  radius?: number
  tint?: string
  depth?: number
  spread?: number
  tilt?: number
  tiltDirection?: TiltDirection
  perspective?: number
  visibleCards?: number
  falloff?: number
  blur?: number
  duration?: number
  ease?: string
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  showControls?: boolean
  showIndicators?: boolean
  showCardMeta?: boolean
  enableWheel?: boolean
  onChange?: (index: number, item: DepthCarouselItem) => void
  className?: string
}

interface CarouselConfig {
  count: number
  depth: number
  spread: number
  tilt: number
  tiltDirection: TiltDirection
  visibleCards: number
  falloff: number
  blur: number
  duration: number
  ease: string
  loop: boolean
  cardWidth: number
  autoplayDelay: number
}

interface DragState {
  x: number
  y: number
  startPos: number
  lastX: number
  lastT: number
  v: number
  moved: boolean
  id: number
}

const DEFAULT_ITEMS: DepthCarouselItem[] = [
  {
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    alt: 'Hannah Reyes',
    name: 'Hannah Reyes',
    position: 'Director of Talent Acquisition',
  },
  {
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    alt: 'Marcus Sterling',
    name: 'Marcus Sterling',
    position: 'VP of Offshore Operations',
  },
  {
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    alt: 'Dr. Elena Vance',
    name: 'Dr. Elena Vance',
    position: 'Chief Technology Officer',
  },
  {
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    alt: 'Julian Alvarez',
    name: 'Julian Alvarez',
    position: 'Head of Client Success',
  },
  {
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    alt: 'Sophia Chen',
    name: 'Sophia Chen',
    position: 'Head of Compliance & Legal',
  },
]

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

const normalizeItem = (it: DepthCarouselItem | string): DepthCarouselItem =>
  typeof it === 'string' ? { image: it, alt: '' } : it

export const DepthCarousel = forwardRef<DepthCarouselHandle, DepthCarouselProps>(
  function DepthCarousel(
    {
      items = DEFAULT_ITEMS,
      cardWidth = 300,
      cardHeight = 390,
      radius = 18,
      tint = '#05060a',
      depth = 210,
      spread = 85,
      tilt = 22,
      tiltDirection = 'right',
      perspective = 1400,
      visibleCards = 4,
      falloff = 0.2,
      blur = 5,
      duration = 650,
      ease = 'power3.out',
      autoplay = false,
      autoplayDelay = 3800,
      loop = true,
      showControls = true,
      showIndicators = true,
      showCardMeta = false,
      enableWheel = false,
      onChange,
      className = '',
    },
    ref: ForwardedRef<DepthCarouselHandle>,
  ) {
    const data = useMemo(
      () => (Array.isArray(items) ? items : []).map(normalizeItem),
      [items],
    )
    const count = data.length

    const rootRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const overlayRefs = useRef<(HTMLSpanElement | null)[]>([])

    const posRef = useRef(0)
    const focusRef = useRef(0)
    const tweenRef = useRef<gsap.core.Tween | null>(null)
    const scaleRef = useRef(1)
    const cfgRef = useRef<CarouselConfig>({} as CarouselConfig)
    const onChangeRef = useRef(onChange)

    const dragRef = useRef<DragState | null>(null)
    const wheelTimerRef = useRef<number | null>(null)
    const autoTimerRef = useRef<number | null>(null)
    const reducedRef = useRef(false)
    const wasDraggingRef = useRef(false)

    const [active, setActive] = useState(0)

    onChangeRef.current = onChange
    cfgRef.current = {
      count,
      depth,
      spread,
      tilt,
      tiltDirection,
      visibleCards,
      falloff,
      blur,
      duration,
      ease,
      loop,
      cardWidth,
      autoplayDelay,
    }

    const layout = useCallback((pos: number) => {
      const cfg = cfgRef.current
      const n = cfg.count
      if (!n) return
      const dir = cfg.tiltDirection === 'left' ? -1 : 1
      const sc = scaleRef.current

      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i]
        if (!el) continue

        let d = i - pos
        if (cfg.loop && n > 1) {
          d = ((d % n) + n) % n
          if (d > n / 2) d -= n
        }

        const back = Math.max(0, d)
        const az = Math.abs(d)
        const shown = az <= cfg.visibleCards + 0.5

        const tz = -cfg.depth * d
        const tx = dir * cfg.spread * d
        const ry = dir * cfg.tilt * clamp(d, 0, 1)

        let opacity = d < 0 ? Math.max(0, 1 + d) : 1
        if (!shown) opacity = 0

        const brightness = Math.max(0.15, 1 - back * cfg.falloff)
        const blurPx =
          cfg.blur > 0
            ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur)
            : 0
        const zi = Math.round(2000 - Math.abs(d) * 100)

        el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`
        el.style.opacity = opacity.toFixed(3)
        el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`
        el.style.zIndex = String(zi)
        el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none'

        const ov = overlayRefs.current[i]
        if (ov) {
          ov.style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3)
        }
      }
    }, [])

    const notify = useCallback(
      (idx: number) => {
        setActive(idx)
        onChangeRef.current?.(idx, data[idx])
      },
      [data],
    )

    const tweenTo = useCallback(
      (target: number, animate: boolean) => {
        tweenRef.current?.kill()
        const cfg = cfgRef.current
        const proxy = { p: posRef.current }
        const dur = animate && !reducedRef.current ? cfg.duration / 1000 : 0
        tweenRef.current = gsap.to(proxy, {
          p: target,
          duration: dur,
          ease: cfg.ease,
          onUpdate: () => {
            posRef.current = proxy.p
            layout(proxy.p)
          },
          onComplete: () => {
            const n = cfg.count
            if (n > 0) posRef.current = ((posRef.current % n) + n) % n
            layout(posRef.current)
          },
        })
      },
      [layout],
    )

    const setFocus = useCallback(
      (rawIndex: number, animate = true) => {
        const cfg = cfgRef.current
        const n = cfg.count
        if (!n) return
        const idx = cfg.loop
          ? ((rawIndex % n) + n) % n
          : clamp(rawIndex, 0, n - 1)
        let delta = idx - posRef.current
        if (cfg.loop && n > 1) {
          delta = ((delta % n) + n) % n
          if (delta > n / 2) delta -= n
        }
        tweenTo(posRef.current + delta, animate)
        if (idx !== focusRef.current) {
          focusRef.current = idx
          notify(idx)
        }
      },
      [tweenTo, notify],
    )

    const navigateBy = useCallback(
      (step: number) => setFocus(focusRef.current + step, true),
      [setFocus],
    )

    useImperativeHandle(
      ref,
      () => ({
        next: () => navigateBy(1),
        prev: () => navigateBy(-1),
        goTo: (idx: number) => setFocus(idx, true),
        getActiveIndex: () => focusRef.current,
      }),
      [navigateBy, setFocus],
    )

    useEffect(() => {
      const root = rootRef.current
      if (!root) return
      const ro = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width
        const cfg = cfgRef.current
        const needed = cfg.cardWidth + Math.abs(cfg.spread) * 2 + 60
        scaleRef.current = clamp(w / needed, 0.45, 1)
        layout(posRef.current)
      })
      ro.observe(root)
      return () => ro.disconnect()
    }, [layout])

    // Wheel support (optional; horizontal or opt-in only)
    useEffect(() => {
      const el = rootRef.current
      if (!el || !enableWheel) return
      const onWheel = (e: WheelEvent) => {
        const cfg = cfgRef.current
        if (cfg.count < 2) return
        // Only intercept if primarily horizontal wheel or explicit
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault()
          tweenRef.current?.kill()
          const delta = e.deltaX
          const step = clamp(delta / (cfg.cardWidth * 0.9), -0.6, 0.6)
          posRef.current += step
          layout(posRef.current)
          if (wheelTimerRef.current !== null) {
            window.clearTimeout(wheelTimerRef.current)
          }
          wheelTimerRef.current = window.setTimeout(
            () => setFocus(Math.round(posRef.current), true),
            130,
          )
        }
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        el.removeEventListener('wheel', onWheel)
        if (wheelTimerRef.current !== null) {
          window.clearTimeout(wheelTimerRef.current)
        }
      }
    }, [enableWheel, layout, setFocus])

    const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
      const cfg = cfgRef.current
      if (cfg.count < 2) return
      // Do not kill running tween on pointer down so clicks do not freeze animations mid-stream
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPos: posRef.current,
        lastX: e.clientX,
        lastT: performance.now(),
        v: 0,
        moved: false,
        id: e.pointerId,
      }
    }, [])

    const onPointerMove = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        if (!drag) return
        const dx = e.clientX - drag.x
        const dy = e.clientY - drag.y

        // Only engage drag if user genuinely moves beyond click threshold (> 14px horizontally)
        if (!drag.moved && (Math.abs(dx) > 14 || Math.hypot(dx, dy) > 16)) {
          drag.moved = true
          tweenRef.current?.kill()
          try {
            rootRef.current?.setPointerCapture(drag.id)
          } catch {
            // pointer capture fallback
          }
        }
        if (!drag.moved) return
        const cfg = cfgRef.current
        const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40)
        const now = performance.now()
        const dt = Math.max(now - drag.lastT, 1)
        drag.v = (e.clientX - drag.lastX) / dt
        drag.lastX = e.clientX
        drag.lastT = now
        posRef.current = drag.startPos - dx / stepPx
        layout(posRef.current)
      },
      [layout],
    )

    const onPointerEnd = useCallback(() => {
      const drag = dragRef.current
      if (!drag) return

      const moved = drag.moved
      const dragId = drag.id
      dragRef.current = null

      if (moved) {
        wasDraggingRef.current = true
        if (rootRef.current && rootRef.current.hasPointerCapture(dragId)) {
          try {
            rootRef.current.releasePointerCapture(dragId)
          } catch {
            // ignore
          }
        }
        // Auto-clear wasDragging flag after brief click window passes so clicks are never permanently blocked
        setTimeout(() => {
          wasDraggingRef.current = false
        }, 120)

        const cfg = cfgRef.current
        const stepPx = Math.max(cfg.cardWidth * 0.55 * scaleRef.current, 40)
        const projected = posRef.current - (drag.v * 180) / stepPx
        setFocus(Math.round(projected), true)
      } else {
        wasDraggingRef.current = false
      }
    }, [setFocus])

    const onKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          navigateBy(-1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          navigateBy(1)
        }
      },
      [navigateBy],
    )

    const onCardClick = useCallback(
      (index: number) => {
        if (wasDraggingRef.current) {
          wasDraggingRef.current = false
          return
        }
        // Clicking the active front card or current visual front always reliably advances
        const currentFront = Math.round(posRef.current)
        if (index === focusRef.current || index === currentFront) {
          navigateBy(1)
        } else {
          setFocus(index, true)
        }
      },
      [navigateBy, setFocus],
    )

    useEffect(() => {
      reducedRef.current =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!autoplay || reducedRef.current || count < 2) return
      const root = rootRef.current
      let hovered = false
      let focused = false
      const stop = () => {
        if (autoTimerRef.current !== null) {
          window.clearInterval(autoTimerRef.current)
        }
        autoTimerRef.current = null
      }
      const start = () => {
        stop()
        autoTimerRef.current = window.setInterval(
          () => {
            if (!hovered && !focused) navigateBy(1)
          },
          Math.max(cfgRef.current.autoplayDelay, 600),
        )
      }
      const onEnter = () => {
        hovered = true
      }
      const onLeave = () => {
        hovered = false
      }
      const onFocusIn = () => {
        focused = true
      }
      const onFocusOut = () => {
        focused = false
      }
      root?.addEventListener('mouseenter', onEnter)
      root?.addEventListener('mouseleave', onLeave)
      root?.addEventListener('focusin', onFocusIn)
      root?.addEventListener('focusout', onFocusOut)
      start()
      return () => {
        stop()
        root?.removeEventListener('mouseenter', onEnter)
        root?.removeEventListener('mouseleave', onLeave)
        root?.removeEventListener('focusin', onFocusIn)
        root?.removeEventListener('focusout', onFocusOut)
      }
    }, [autoplay, autoplayDelay, count, navigateBy])

    useEffect(() => {
      layout(posRef.current)
    }, [
      layout,
      depth,
      spread,
      tilt,
      tiltDirection,
      visibleCards,
      falloff,
      blur,
      cardWidth,
      cardHeight,
      radius,
      count,
    ])

    useEffect(
      () => () => {
        tweenRef.current?.kill()
        if (wheelTimerRef.current !== null) {
          window.clearTimeout(wheelTimerRef.current)
        }
        if (autoTimerRef.current !== null) {
          window.clearInterval(autoTimerRef.current)
        }
      },
      [],
    )

    return (
      <div
        aria-label="OPG team carousel"
        aria-roledescription="carousel"
        className={`depth-carousel ${className}`.trim()}
        onKeyDown={onKeyDown}
        onPointerCancel={onPointerEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        ref={rootRef}
        role="region"
        style={
          {
            '--dc-perspective': `${perspective}px`,
          } as React.CSSProperties
        }
        tabIndex={0}
      >
        <div className="depth-carousel__stage" ref={stageRef}>
          {data.map((item, i) => (
            <div
              aria-hidden={active !== i}
              aria-label={
                active === i
                  ? `${item.name ?? 'Team Member'} - ${item.position ?? ''} (Tap to view next member)`
                  : `${item.name ?? 'Team Member'} - ${item.position ?? ''}`
              }
              aria-roledescription="slide"
              className={`depth-carousel__card${active === i ? ' is-active' : ''}`}
              key={item.name ? `${item.name}-${i}` : i}
              onClick={() => onCardClick(i)}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: radius,
              }}
            >
              <Image
                alt={item.alt || item.name || 'Team member portrait'}
                className="depth-carousel__img"
                draggable={false}
                fill
                sizes="(max-width: 64rem) 20rem, 24rem"
                src={item.image}
              />
              <span
                className="depth-carousel__tint"
                ref={(el) => {
                  overlayRefs.current[i] = el
                }}
                style={{ background: tint }}
              />

              {/* Card Bottom Meta Overlay */}
              {showCardMeta && (item.name || item.position) && (
                <div className="depth-carousel__card-meta">
                  {item.position && (
                    <span className="depth-carousel__card-badge">
                      {item.position}
                    </span>
                  )}
                  {item.name && (
                    <h4 className="depth-carousel__card-name">{item.name}</h4>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {showControls && count > 1 && (
          <div className="depth-carousel__controls">
            <button
              aria-label="Previous team member"
              className="depth-carousel__arrow depth-carousel__arrow--prev"
              onClick={() => navigateBy(-1)}
              type="button"
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="18"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              aria-label="Next team member"
              className="depth-carousel__arrow depth-carousel__arrow--next"
              onClick={() => navigateBy(1)}
              type="button"
            >
              <svg
                aria-hidden="true"
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="18"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {showIndicators && count > 1 && (
          <div
            aria-label="Team members"
            className="depth-carousel__dots"
            role="tablist"
          >
            {data.map((item, i) => (
              <button
                aria-label={`Go to ${item.name || `member ${i + 1}`}`}
                aria-selected={active === i}
                className={`depth-carousel__dot${active === i ? ' is-active' : ''}`}
                key={item.name ? `${item.name}-${i}` : i}
                onClick={() => setFocus(i, true)}
                role="tab"
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    )
  },
)

DepthCarousel.displayName = 'DepthCarousel'
