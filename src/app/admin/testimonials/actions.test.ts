import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { revalidatePath } from 'next/cache'

import { reviewCandidateTestimonialAction } from '@/app/admin/testimonials/actions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

const testimonialId = '11111111-2222-4333-8444-555555555555'

function setRole(roleKey: string) {
  vi.mocked(requireAdminSession).mockResolvedValue({
    profile: { roleKey },
  } as never)
}

describe('candidate testimonial review action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole('publisher')
  })

  it('does not let an editor review submissions', async () => {
    setRole('editor')

    const result = await reviewCandidateTestimonialAction(
      testimonialId,
      'approved',
    )

    expect(result.success).toBe(false)
    expect(requireAdminSession).toHaveBeenCalledWith({ requireAal2: true })
    expect(createClient).not.toHaveBeenCalled()
  })

  it('rejects malformed IDs and decisions before contacting the database', async () => {
    const result = await reviewCandidateTestimonialAction(
      'not-an-id',
      'published' as never,
    )

    expect(result.success).toBe(false)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('approves through the atomic database function and refreshes both views', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc } as never)

    const result = await reviewCandidateTestimonialAction(
      testimonialId,
      'approved',
    )

    expect(result).toEqual({ success: true })
    expect(rpc).toHaveBeenCalledWith('review_candidate_testimonial', {
      p_id: testimonialId,
      p_decision: 'approved',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/testimonials')
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
    expect(revalidatePath).toHaveBeenCalledWith('/testimonials')
  })

  it('reports an already reviewed submission without refreshing', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc } as never)

    const result = await reviewCandidateTestimonialAction(
      testimonialId,
      'rejected',
    )

    expect(result).toMatchObject({ success: false })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
