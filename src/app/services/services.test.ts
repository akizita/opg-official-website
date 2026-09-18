import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  getAdminSession: vi.fn(),
}))

vi.mock('@/lib/content/services', () => ({
  getPublishedServices: vi.fn(),
  getServiceBySlug: vi.fn(),
}))

import { generateMetadata as generateCatalogMetadata } from '@/app/services/page'
import {
  generateMetadata as generateDetailMetadata,
  generateStaticParams,
} from '@/app/services/[slug]/page'
import { getPublishedServices, getServiceBySlug } from '@/lib/content/services'

describe('Services metadata and static params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates services catalog metadata', () => {
    const metadata = generateCatalogMetadata()
    expect(metadata.title).toBe('Services & Delivery Models | OPG')
    expect(metadata.description).toContain('Outsourced Pro Global services')
  })

  it('generates service detail metadata with custom SEO', async () => {
    vi.mocked(getServiceBySlug).mockResolvedValue({
      id: 's1',
      title: 'Dedicated Teams',
      slug: 'dedicated-teams',
      summary: 'Team summary',
      content: [],
      icon_url: null,
      cta_text: null,
      cta_url: null,
      display_order: 1,
      status: 'published',
      seo_title: 'Custom Service SEO | OPG',
      seo_description: 'Custom Service Description',
      created_by: null,
      updated_by: null,
      published_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })

    const metadata = await generateDetailMetadata({
      params: Promise.resolve({ slug: 'dedicated-teams' }),
    })

    expect(metadata.title).toBe('Custom Service SEO | OPG')
    expect(metadata.description).toBe('Custom Service Description')
  })

  it('generates static params for all published services', async () => {
    vi.mocked(getPublishedServices).mockResolvedValue([
      { slug: 'dedicated-teams' } as never,
      { slug: 'staff-augmentation' } as never,
    ])

    const params = await generateStaticParams()
    expect(params).toEqual([
      { slug: 'dedicated-teams' },
      { slug: 'staff-augmentation' },
    ])
  })
})
