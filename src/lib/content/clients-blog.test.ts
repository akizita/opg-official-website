import { describe, expect, it } from 'vitest'

import {
  cloneDefaultClientsBlogConfig,
  computeAuthorMonogram,
  estimateClientsBlogReadTime,
  normalizeClientsBlogConfig,
  normalizeSafeBlogMediaUrl,
} from '@/lib/content/clients-blog-types'

describe('Clients Blog Config & Helpers', () => {
  it('provides full default blocks matching the /clients editorial section', () => {
    const config = cloneDefaultClientsBlogConfig()
    expect(config.title).toContain('OPG')
    expect(config.heroImageUrl).toBe('/images/clients-blog-hero.jpg')
    expect(config.blocks.length).toBe(3)
    expect(config.blocks[1]).toMatchObject({
      type: 'image',
      url: '/images/clients-blog-secondary.jpg',
    })
  })

  it('normalizes unsafe URLs, allows removing hero & photos, and computes monograms', () => {
    expect(normalizeSafeBlogMediaUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeSafeBlogMediaUrl('/images/clients-blog-hero.jpg')).toBe(
      '/images/clients-blog-hero.jpg',
    )
    expect(computeAuthorMonogram('Armi Escamilla')).toBe('AE')
    expect(computeAuthorMonogram('Outsourced')).toBe('OUT')

    const normalized = normalizeClientsBlogConfig({
      title: 'Updated Clients Playbook',
      heroImageUrl: null,
      authorName: 'Aki Zita',
      authorAvatarUrl: null,
      showFeaturedArticle: false,
      featuredArticleMode: 'custom',
      featuredArticleSlug: 'talent-spotlight',
      blocks: [
        { id: 't1', type: 'rich_text', markdown: '### Hello World\n\nBody.' },
        { id: 'img-bad', type: 'image', url: 'javascript:evil()', alt: 'bad' },
      ],
    })

    expect(normalized.heroImageUrl).toBeNull()
    expect(normalized.authorMonogram).toBe('AZ')
    expect(normalized.showFeaturedArticle).toBe(false)
    expect(normalized.featuredArticleMode).toBe('custom')
    expect(normalized.featuredArticleSlug).toBe('talent-spotlight')
    expect(normalized.blocks).toHaveLength(1)
  })

  it('estimates reading time from rich_text blocks and lead summary', () => {
    const label = estimateClientsBlogReadTime(
      [
        {
          id: 'b1',
          type: 'rich_text',
          markdown: Array(410).fill('word').join(' '),
        },
      ],
      'Short intro',
    )
    expect(label).toBe('3 min read')
  })
})
