import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  getAdminSession: vi.fn(),
}))

vi.mock('@/lib/content/team', () => ({
  getActiveDepartmentsWithMembers: vi.fn(),
}))

import { generateMetadata } from '@/app/about/page'
import { createClient } from '@/lib/supabase/server'

describe('About page metadata generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.SITE_INDEXABLE
  })

  it('generates metadata from published about document with SEO fields', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                title: 'About Outsourced Pro Global',
                summary: 'Standard about summary.',
                seo_title: 'Custom About SEO Title | OPG',
                seo_description: 'Custom SEO Description for search engines.',
                canonical_url: 'https://opglobal.com.hk/about',
                og_image_url: 'https://opglobal.com.hk/images/og-about.jpg',
                status: 'published',
              },
            }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const metadata = await generateMetadata()

    expect(metadata.title).toBe('Custom About SEO Title | OPG')
    expect(metadata.description).toBe(
      'Custom SEO Description for search engines.',
    )
    expect(metadata.alternates?.canonical).toBe('https://opglobal.com.hk/about')
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://opglobal.com.hk/images/og-about.jpg' },
    ])
  })

  it('falls back to default title and summary when SEO fields are null', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                title: 'About OPG',
                summary: 'Standard summary deck.',
                seo_title: null,
                seo_description: null,
                status: 'published',
              },
            }),
          }),
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const metadata = await generateMetadata()

    expect(metadata.title).toBe('About OPG | OPG')
    expect(metadata.description).toBe('Standard summary deck.')
  })
})
