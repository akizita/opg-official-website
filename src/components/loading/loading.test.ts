import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BrandLoader,
  BrandLoaderOverlay,
  brandLoaderCoordinator,
  OPG_SWOOSH_PATH,
  OpgLogoMark,
  PageSkeleton,
} from './index'

describe('Loading components', () => {
  afterEach(() => {
    vi.useRealTimers()
    brandLoaderCoordinator.resetForTests()
  })

  it('exports BrandLoader, BrandLoaderOverlay, PageSkeleton, and inline SVG OpgLogoMark swoosh path', () => {
    expect(typeof BrandLoader).toBe('function')
    expect(typeof BrandLoaderOverlay).toBe('function')
    expect(typeof PageSkeleton).toBe('function')
    expect(typeof OpgLogoMark).toBe('function')
    expect(OPG_SWOOSH_PATH).toContain('M 9.5 61.5')
    expect(OPG_SWOOSH_PATH.endsWith('Z')).toBe(true)
  })

  it('keeps the loader overlay visible until its full animation sequence completes before fading out', () => {
    vi.useFakeTimers()
    const unregister = brandLoaderCoordinator.registerHost()
    expect(brandLoaderCoordinator.hasOverlayHost()).toBe(true)

    const token = Symbol('route-load')
    brandLoaderCoordinator.acquire(token, { label: 'Loading clients' })
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: true,
      exiting: false,
      label: 'Loading clients',
    })

    // Page finishes streaming quickly at 300ms — loader must NOT cut off yet
    vi.advanceTimersByTime(300)
    brandLoaderCoordinator.release(token)
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: true,
      exiting: false,
    })

    // Intro draw + fill + diagonal sweep finishes (~2350ms total) -> enters 250ms fade exit
    vi.advanceTimersByTime(2050)
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: true,
      exiting: true,
    })

    // After 250ms exit fade completes, overlay unmounts cleanly
    vi.advanceTimersByTime(250)
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: false,
      exiting: false,
    })

    unregister()
  })

  it('waits until slow data also finishes after intro animation completes before exiting', () => {
    vi.useFakeTimers()
    const unregister = brandLoaderCoordinator.registerHost()
    const token = Symbol('slow-load')
    brandLoaderCoordinator.acquire(token, { label: 'Loading careers' })

    // Intro animation finishes at 2350ms, but data is still loading
    vi.advanceTimersByTime(2400)
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: true,
      exiting: false,
    })

    // Data resolves at 2800ms -> immediately triggers 250ms exit fade
    vi.advanceTimersByTime(400)
    brandLoaderCoordinator.release(token)
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: true,
      exiting: true,
    })

    vi.advanceTimersByTime(250)
    expect(brandLoaderCoordinator.getSnapshot()).toMatchObject({
      visible: false,
      exiting: false,
    })

    unregister()
  })
})
