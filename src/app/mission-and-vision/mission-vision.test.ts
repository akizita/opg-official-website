import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  getAdminSession: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { generateMetadata } from '@/app/mission-and-vision/page'
import { createClient } from '@/lib/supabase/server'

describe('Mission & Vision metadata generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.SITE_INDEXABLE
  })

  it('generates metadata from published document with SEO overrides', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                title: 'Mission & Vision',
                summary: 'Standard summary.',
                seo_title: 'Custom SEO Title | OPG',
                seo_description: 'Custom SEO Description for search engines.',
                canonical_url: 'https://opglobal.com.hk/mission-and-vision',
                og_image_url: 'https://opglobal.com.hk/images/og-mv.jpg',
                status: 'published',
              },
            }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const metadata = await generateMetadata()

    expect(metadata.title).toBe('Custom SEO Title | OPG')
    expect(metadata.description).toBe(
      'Custom SEO Description for search engines.',
    )
    expect(metadata.alternates?.canonical).toBe(
      'https://opglobal.com.hk/mission-and-vision',
    )
    expect(metadata.openGraph?.title).toBe('Custom SEO Title | OPG')
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://opglobal.com.hk/images/og-mv.jpg' },
    ])
  })

  it('falls back to standard title and summary when SEO fields are null', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                title: 'Our Purpose',
                summary: 'Default summary deck.',
                seo_title: null,
                seo_description: null,
                canonical_url: null,
                og_image_url: null,
                status: 'published',
              },
            }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const metadata = await generateMetadata()

    expect(metadata.title).toBe('Our Purpose | OPG')
    expect(metadata.description).toBe('Default summary deck.')
    expect(metadata.openGraph?.images).toBeUndefined()
  })

  it('sets robots to false when document is not published or site is not indexable', async () => {
    process.env.SITE_INDEXABLE = 'false'
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                title: 'Mission & Vision',
                status: 'draft',
              },
            }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const metadata = await generateMetadata()
    const robots =
      typeof metadata.robots === 'object' && metadata.robots !== null
        ? metadata.robots
        : {}
    expect('index' in robots ? robots.index : undefined).toBe(false)
    expect('follow' in robots ? robots.follow : undefined).toBe(false)
  })
})
