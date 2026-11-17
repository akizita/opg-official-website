import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

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
})
