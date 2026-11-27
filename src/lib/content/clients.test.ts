import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import {
  normalizeOptionalHttpUrl,
  resolveSafeClientLogo,
} from '@/lib/content/client-logo'
import {
  getAllTestimonials,
  getPublishedTestimonials,
  getVisibleClients,
  validateClientInput,
  validateTestimonialInput,
} from '@/lib/content/clients'
import { createClient } from '@/lib/supabase/server'

describe('clients & testimonials validation', () => {
  it('validates client input', () => {
    const valid = {
      name: 'Acme Corp',
      logo_url: '/images/clients/acme.svg',
      website_url: 'https://acme.example',
      display_order: 1,
    }
    const result = validateClientInput(valid)
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Acme Corp')
  })

  it('rejects client without name or logo', () => {
    expect(validateClientInput({ name: '', logo_url: '' }).success).toBe(false)
  })

  it('validates testimonial input', () => {
    const valid = {
      quote: 'Exceptional talent and partnership.',
      author_name: 'Jane Doe',
      author_role: 'CTO',
      author_company: 'Acme Corp',
    }
    const result = validateTestimonialInput(valid)
    expect(result.success).toBe(true)
    expect(result.data?.quote).toBe('Exceptional talent and partnership.')
  })

  it('validates testimonial input with enhanced client fields', () => {
    const valid = {
      quote: 'Exceptional talent and partnership.',
      author_name: 'Jane Doe',
      author_role: 'CTO',
      headline: 'Game-Changing Partnership',
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      photo_url: 'https://example.com/photo.jpg',
      rating: 5,
    }
    const result = validateTestimonialInput(valid)
    expect(result.success).toBe(true)
    expect(result.data?.headline).toBe('Game-Changing Partnership')
    expect(result.data?.client_id).toBe('123e4567-e89b-12d3-a456-426614174000')
    expect(result.data?.photo_url).toBe('https://example.com/photo.jpg')
    expect(result.data?.rating).toBe(5)
  })

  it('rejects testimonial missing required fields', () => {
    expect(validateTestimonialInput({ quote: '' }).success).toBe(false)
  })
})

describe('clients & testimonials queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries visible clients in display order', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Client 1', is_visible: true }],
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const clients = await getVisibleClients()
    expect(clients).toHaveLength(1)
    expect(mockEq).toHaveBeenCalledWith('is_visible', true)
  })

  it('queries published testimonials in display order', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: '1', quote: 'Great work', status: 'published' }],
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const testimonials = await getPublishedTestimonials()
    expect(testimonials).toHaveLength(1)
    expect(mockEq).toHaveBeenCalledWith('status', 'published')
  })

  it('queries all testimonials in display order', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: '1', quote: 'Great work', status: 'draft' }],
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const testimonials = await getAllTestimonials()
    expect(testimonials).toHaveLength(1)
    expect(mockOrder).toHaveBeenCalledWith('display_order', { ascending: true })
  })

  it('validates safe client logos, SVG unoptimized flags, and optional HTTP URLs', () => {
    expect(resolveSafeClientLogo('')).toBeNull()
    expect(resolveSafeClientLogo('javascript:alert(1)')).toBeNull()
    expect(resolveSafeClientLogo('/images/clients/northstar.svg')).toEqual({
      src: '/images/clients/northstar.svg',
      unoptimized: true,
    })
    expect(
      resolveSafeClientLogo(
        'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/clients/acme.png',
      ),
    ).toEqual({
      src: 'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/clients/acme.png',
      unoptimized: false,
    })
    expect(
      normalizeOptionalHttpUrl('example.com/about', 'Website URL'),
    ).toEqual({ value: 'https://example.com/about' })
    expect(
      normalizeOptionalHttpUrl('ftp://invalid.example.com', 'Website URL').error,
    ).toBeDefined()
  })

  it('sorts visible clients alphabetically and respects clients_seeded_v1 when empty', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      if (table === 'site_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { setting_value: true },
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const emptySeeded = await getVisibleClients()
    expect(emptySeeded).toEqual([])
  })
})
