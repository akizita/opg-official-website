import { describe, expect, it } from 'vitest'

import {
  OPG_SPLASH_VIDEO_URL,
  shouldShowSplashOnMount,
  shouldSkipSplashForPath,
  SiteSplashScreen,
} from './site-splash-screen'

describe('SiteSplashScreen', () => {
  it('exports the SiteSplashScreen component and canonical Supabase splash video URL', () => {
    expect(typeof SiteSplashScreen).toBe('function')
    expect(OPG_SPLASH_VIDEO_URL).toBe(
      'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/splash/animation1.mp4',
    )
  })

  it('skips the splash screen on admin and auth routes while enabling it on public pages', () => {
    expect(shouldSkipSplashForPath('/admin')).toBe(true)
    expect(shouldSkipSplashForPath('/admin/articles')).toBe(true)
    expect(shouldSkipSplashForPath('/auth/callback')).toBe(true)
    expect(shouldSkipSplashForPath('/sign-in')).toBe(true)
    expect(shouldSkipSplashForPath('/sign-up')).toBe(true)

    expect(shouldSkipSplashForPath('/')).toBe(false)
    expect(shouldSkipSplashForPath('/about')).toBe(false)
    expect(shouldSkipSplashForPath('/clients')).toBe(false)
    expect(shouldSkipSplashForPath('/careers')).toBe(false)
    expect(shouldSkipSplashForPath(null)).toBe(false)
  })

  it('shows on home page refresh, first visit to public routes, and skips reduced motion or repeat subpage reloads', () => {
    expect(shouldShowSplashOnMount('/', false, false)).toBe(true)
    expect(shouldShowSplashOnMount('/', true, false)).toBe(true)

    expect(shouldShowSplashOnMount('/about', false, false)).toBe(true)
    expect(shouldShowSplashOnMount('/about', true, false)).toBe(false)

    expect(shouldShowSplashOnMount('/', false, true)).toBe(false)
    expect(shouldShowSplashOnMount('/', true, true)).toBe(false)
    expect(shouldShowSplashOnMount('/admin', false, false)).toBe(false)
  })
})
