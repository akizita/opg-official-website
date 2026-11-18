'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, type ReactNode } from 'react'

export interface AnimatedContentProps {
  children: ReactNode
  container?: Element | string | null
  distance?: number
  direction?: 'vertical' | 'horizontal'
  reverse?: boolean
  duration?: number
  ease?: string
  initialOpacity?: number
  animateOpacity?: boolean
  scale?: number
  threshold?: number
  delay?: number
  disappearAfter?: number
  disappearDuration?: number
  disappearEase?: string
  playOnMount?: boolean
  onComplete?: () => void
  onDisappearanceComplete?: () => void
  className?: string
}

export function AnimatedContent({
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  playOnMount = false,
  onComplete,
  onDisappearanceComplete,
  className = '',
}: AnimatedContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)

    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, clearProps: 'transform' })
      onComplete?.()
      return
    }

    let scrollerTarget: Element | null = null
    if (container) {
      scrollerTarget =
        typeof container === 'string'
          ? document.querySelector(container)
          : container
    }

    const axis = direction === 'horizontal' ? 'x' : 'y'
    const offset = reverse ? -distance : distance
    const startPct = (1 - threshold) * 100

    const ctx = gsap.context(() => {
      const fromVars: gsap.TweenVars = {
        [axis]: offset,
        scale,
        opacity: animateOpacity ? initialOpacity : 1,
      }

      const toVars: gsap.TweenVars = {
        [axis]: 0,
        scale: 1,
        opacity: 1,
        duration,
        ease,
        delay,
        onComplete: () => {
          if (disappearAfter <= 0) {
            gsap.set(el, { clearProps: 'transform' })
          }
          onComplete?.()

          if (disappearAfter > 0) {
            gsap.delayedCall(disappearAfter, () => {
              gsap.to(el, {
                [axis]: reverse ? distance : -distance,
                scale,
                opacity: animateOpacity ? initialOpacity : 1,
                duration: disappearDuration,
                ease: disappearEase,
                onComplete: () => onDisappearanceComplete?.(),
              })
            })
          }
        },
      }

      if (playOnMount) {
        gsap.fromTo(el, fromVars, toVars)
      } else {
        gsap.fromTo(el, fromVars, {
          ...toVars,
          scrollTrigger: {
            trigger: el,
            scroller: scrollerTarget || undefined,
            start: `top ${startPct}%`,
            once: true,
          },
        })
      }
    }, ref)

    return () => {
      ctx.revert()
    }
  }, [
    container,
    distance,
    direction,
    reverse,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    scale,
    threshold,
    delay,
    disappearAfter,
    disappearDuration,
    disappearEase,
    playOnMount,
    onComplete,
    onDisappearanceComplete,
  ])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export default AnimatedContent
