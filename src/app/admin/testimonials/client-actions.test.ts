import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

import {
  createClientTestimonialAction,
  deleteClientTestimonialAction,
  updateClientTestimonialAction,
} from '@/app/admin/testimonials/client-actions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

const mockTestimonialId = '11111111-2222-3333-4444-555555555555'
const mockClientId = '99999999-8888-7777-6666-555555555555'

function setRole(roleKey: string) {
  vi.mocked(requireAdminSession).mockResolvedValue({
    profile: { roleKey, userId: 'admin-user-id' },
  } as never)
}

describe('client testimonial actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole('publisher')
  })

  describe('createClientTestimonialAction', () => {
    it('rejects users without publish permission', async () => {
      setRole('viewer')
      const result = await createClientTestimonialAction({
        quote: 'Outstanding delivery and speed.',
        author_name: 'John Smith',
        author_role: 'VP of Tech',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('permission')
    })

    it('rejects input missing quote or author name', async () => {
      const result = await createClientTestimonialAction({
        quote: '',
        author_name: 'John Smith',
        author_role: 'VP of Tech',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Quote is required')
    })

    it('creates client testimonial with client association and revalidates paths', async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: mockTestimonialId },
        error: null,
      })
      const select = vi.fn().mockReturnValue({ single })
      const insert = vi.fn().mockReturnValue({ select })
      const clientMaybeSingle = vi.fn().mockResolvedValue({
        data: { name: 'Acme Corp' },
      })
      const clientEq = vi.fn().mockReturnValue({ maybeSingle: clientMaybeSingle })
      const clientSelect = vi.fn().mockReturnValue({ eq: clientEq })

      const from = vi.fn((table: string) => {
        if (table === 'clients') {
          return { select: clientSelect }
        }
        return { insert }
      })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await createClientTestimonialAction({
        client_id: mockClientId,
        headline: 'Scale without boundaries',
        quote: 'OutPro Global transformed our capacity in record time.',
        author_name: 'Sarah Connor',
        author_role: 'Chief Operating Officer',
        photo_url: 'https://example.com/sarah.jpg',
        rating: 5,
        status: 'published',
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe(mockTestimonialId)
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: mockClientId,
          headline: 'Scale without boundaries',
          quote: 'OutPro Global transformed our capacity in record time.',
          author_name: 'Sarah Connor',
          author_role: 'Chief Operating Officer',
          author_company: 'Acme Corp',
          photo_url: 'https://example.com/sarah.jpg',
          rating: 5,
          status: 'published',
        }),
      )
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/testimonials')
    })
  })

  describe('updateClientTestimonialAction', () => {
    it('updates an existing testimonial', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await updateClientTestimonialAction(mockTestimonialId, {
        quote: 'Updated testimonial text here.',
        author_name: 'Jane Smith',
        author_role: 'Director of HR',
        headline: 'Updated headline',
      })

      expect(result.success).toBe(true)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          quote: 'Updated testimonial text here.',
          author_name: 'Jane Smith',
          author_role: 'Director of HR',
          headline: 'Updated headline',
        }),
      )
      expect(eq).toHaveBeenCalledWith('id', mockTestimonialId)
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
    })
  })

  describe('deleteClientTestimonialAction', () => {
    it('requires archive permission to delete', async () => {
      setRole('editor')
      const result = await deleteClientTestimonialAction(mockTestimonialId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('permission')
    })

    it('deletes testimonial and revalidates paths', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null })
      const del = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ delete: del })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await deleteClientTestimonialAction(mockTestimonialId)
      expect(result.success).toBe(true)
      expect(eq).toHaveBeenCalledWith('id', mockTestimonialId)
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/testimonials')
    })
  })
})
