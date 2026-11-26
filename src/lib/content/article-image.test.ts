import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ARTICLE_COVER_IMAGE,
  formatSafeArticleDate,
  getSafeDateTimestamp,
  resolvePublicMetadataImageUrl,
  resolveSafeArticleImage,
} from '@/lib/content/article-image'

describe('article-image helpers', () => {
  it('returns default placeholder for empty or invalid URLs', () => {
    expect(resolveSafeArticleImage(null)).toEqual({
      src: DEFAULT_ARTICLE_COVER_IMAGE,
      unoptimized: false,
    })
    expect(resolveSafeArticleImage('')).toEqual({
      src: DEFAULT_ARTICLE_COVER_IMAGE,
      unoptimized: false,
    })
    expect(resolveSafeArticleImage('not-a-valid-path')).toEqual({
      src: DEFAULT_ARTICLE_COVER_IMAGE,
      unoptimized: false,
    })
    expect(resolveSafeArticleImage('javascript:alert(1)')).toEqual({
      src: DEFAULT_ARTICLE_COVER_IMAGE,
      unoptimized: false,
    })
  })

  it('bypasses optimization for data URIs and external unconfigured hosts', () => {
    expect(resolveSafeArticleImage('data:image/png;base64,iVBORw0KGgo=')).toEqual({
      src: 'data:image/png;base64,iVBORw0KGgo=',
      unoptimized: true,
    })
    expect(
      resolveSafeArticleImage('https://example.com/custom-cover.jpg'),
    ).toEqual({
      src: 'https://example.com/custom-cover.jpg',
      unoptimized: true,
    })
    expect(
      resolveSafeArticleImage('https://media.licdn.com/dms/image/test.jpg'),
    ).toEqual({
      src: 'https://media.licdn.com/dms/image/test.jpg',
      unoptimized: true,
    })
  })

  it('keeps Next optimization enabled for local and allowlisted hosts', () => {
    expect(resolveSafeArticleImage('/images/cover.jpg')).toEqual({
      src: '/images/cover.jpg',
      unoptimized: false,
    })
    expect(
      resolveSafeArticleImage(
        'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/cover.png',
      ),
    ).toEqual({
      src: 'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/cover.png',
      unoptimized: false,
    })
  })

  it('omits data URIs from public metadata images and formats invalid dates safely', () => {
    expect(
      resolvePublicMetadataImageUrl('data:image/png;base64,abc123='),
    ).toBeUndefined()
    expect(resolvePublicMetadataImageUrl('https://cdn.example.com/a.jpg')).toBe(
      'https://cdn.example.com/a.jpg',
    )
    expect(formatSafeArticleDate('not-a-date')).toBe('')
    expect(formatSafeArticleDate('2026-11-26T00:00:00.000Z', 'short')).toBe(
      'Nov 26, 2026',
    )
    expect(getSafeDateTimestamp('not-a-date')).toBe(0)
  })
})
