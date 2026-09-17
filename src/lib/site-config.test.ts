import { afterEach, describe, expect, it } from 'vitest'

import { getSiteUrl, isSiteIndexable, siteConfig } from './site-config'

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
const originalIndexable = process.env.SITE_INDEXABLE

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
  }

  if (originalIndexable === undefined) {
    delete process.env.SITE_INDEXABLE
  } else {
    process.env.SITE_INDEXABLE = originalIndexable
  }
})

describe('site configuration', () => {
  it('uses the approved provisional canonical URL by default', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl().toString()).toBe(`${siteConfig.canonicalUrl}/`)
  })

  it('accepts an absolute environment URL for preview deployments', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.example.com'
    expect(getSiteUrl().hostname).toBe('preview.example.com')
  })

  it('rejects a relative environment URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '/preview'
    expect(() => getSiteUrl()).toThrow(
      'NEXT_PUBLIC_SITE_URL must be an absolute URL',
    )
  })

  it('keeps draft deployments non-indexable by default', () => {
    delete process.env.SITE_INDEXABLE
    expect(isSiteIndexable()).toBe(false)
    process.env.SITE_INDEXABLE = 'true'
    expect(isSiteIndexable()).toBe(true)
  })
})
