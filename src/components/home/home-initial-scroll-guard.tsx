'use client'

import { useEffect, useLayoutEffect } from 'react'

/**
 * Ensures opening the Home page without a `#fragment` always starts at the
 * Hero section (`y = 0`) even if browser scroll-restoration, scroll-snap, or
 * splash-screen unlock shifts layout on initial load. Yields immediately on
 * any genuine user scroll/pointer/keyboard input.
 */
export function HomeInitialScrollGuard() {
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || window.location.hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash) return

    const previousRestoration =
      'scrollRestoration' in window.history
        ? window.history.scrollRestoration
        : null

    if (previousRestoration !== null) {
      window.history.scrollRestoration = 'manual'
    }

    let userInteracted = false
    const markUserInteracted = () => {
      userInteracted = true
    }

    const scrollKeys = new Set([
      'ArrowDown',
      'ArrowUp',
      'PageDown',
      'PageUp',
      'Home',
      'End',
      ' ',
    ])

    const onKeyDown = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key)) {
        userInteracted = true
      }
    }

    const enforceTop = () => {
      if (userInteracted || window.location.hash) return
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }

    const onScroll = () => {
      enforceTop()
    }

    window.addEventListener('wheel', markUserInteracted, { passive: true })
    window.addEventListener('touchstart', markUserInteracted, { passive: true })
    window.addEventListener('pointerdown', markUserInteracted, { passive: true })
    window.addEventListener('keydown', onKeyDown, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })

    enforceTop()
    const rafId = window.requestAnimationFrame(enforceTop)
    const settleTimer = window.setTimeout(enforceTop, 350)

    // Keep guarding until after splash/hydration completes, then stop cleanly.
    const releaseTimer = window.setTimeout(() => {
      window.removeEventListener('scroll', onScroll)
    }, 6500)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(settleTimer)
      window.clearTimeout(releaseTimer)
      window.removeEventListener('wheel', markUserInteracted)
      window.removeEventListener('touchstart', markUserInteracted)
      window.removeEventListener('pointerdown', markUserInteracted)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll)
      if (previousRestoration !== null) {
        window.history.scrollRestoration = previousRestoration
      }
    }
  }, [])

  return null
}
