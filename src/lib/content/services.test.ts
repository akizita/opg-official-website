import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  getPublishedServices,
  getServiceBySlug,
  validateServiceInput,
} from '@/lib/content/services'
import { createClient } from '@/lib/supabase/server'

describe('services schema & validation', () => {
  it('validates a valid service payload', () => {
    const input = {
      title: 'Dedicated Remote Teams',
      slug: 'dedicated-remote-teams',
      summary: 'High performing teams aligned to your goals.',
      content: [
        { type: 'paragraph', content: 'Detailed service description.' },
      ],
      icon_url: '/icons/team.svg',
      cta_text: 'Talk to us',
      cta_url: '/contact',
      display_order: 1,
      status: 'published',
    }

    const result = validateServiceInput(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Dedicated Remote Teams')
      expect(result.data.slug).toBe('dedicated-remote-teams')
      expect(result.data.display_order).toBe(1)
    }
  })

  it('rejects invalid slug format', () => {
    const input = {
      title: 'Invalid Slug Service',
      slug: 'Invalid Slug!',
      summary: 'Some summary.',
    }

    const result = validateServiceInput(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.slug).toContain('Slug must be lowercase')
    }
  })

  it('rejects missing summary', () => {
    const input = {
      title: 'No Summary Service',
      slug: 'no-summary',
      summary: '',
    }

    const result = validateServiceInput(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.summary).toContain('Summary is required')
    }
  })
})

describe('services queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries published services in display order', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        { id: '1', title: 'Service A', display_order: 1 },
        { id: '2', title: 'Service B', display_order: 2 },
      ],
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const services = await getPublishedServices()
    expect(services).toHaveLength(2)
    expect(mockFrom).toHaveBeenCalledWith('services')
    expect(mockEq).toHaveBeenCalledWith('status', 'published')
    expect(mockOrder).toHaveBeenCalledWith('display_order', { ascending: true })
  })

  it('queries service by slug', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: '1', slug: 'dedicated-teams', title: 'Dedicated Teams' },
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const service = await getServiceBySlug('dedicated-teams')
    expect(service?.title).toBe('Dedicated Teams')
    expect(mockEq).toHaveBeenCalledWith('slug', 'dedicated-teams')
  })
})
