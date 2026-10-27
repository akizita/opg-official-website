import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { revalidatePath } from 'next/cache'

import {
  deleteCandidateTestimonialAction,
  deleteCandidateTestimonialsAction,
  reviewCandidateTestimonialAction,
} from '@/app/admin/testimonials/actions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

const testimonialId = '11111111-2222-4333-8444-555555555555'
const secondTestimonialId = '22222222-3333-4444-8555-666666666666'

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

describe('candidate testimonial delete action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole('publisher')
  })

  it('requires archive permission and a valid ID', async () => {
    setRole('editor')
    expect(
      (await deleteCandidateTestimonialAction(testimonialId)).success,
    ).toBe(false)
    expect(createClient).not.toHaveBeenCalled()

    setRole('publisher')
    expect((await deleteCandidateTestimonialAction('bad-id')).success).toBe(
      false,
    )
    expect(createClient).not.toHaveBeenCalled()
  })

  it('deletes through the permission-checked function and refreshes the lists', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc } as never)

    expect(await deleteCandidateTestimonialAction(testimonialId)).toEqual({
      success: true,
    })
    expect(rpc).toHaveBeenCalledWith('delete_candidate_testimonial', {
      p_id: testimonialId,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/testimonials')
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
    expect(revalidatePath).toHaveBeenCalledWith('/testimonials')
  })

  it('does not report success when the story is already absent', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc } as never)

    expect(
      (await deleteCandidateTestimonialAction(testimonialId)).success,
    ).toBe(false)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('candidate testimonial bulk delete action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole('publisher')
  })

  it('checks archive permission and rejects invalid selections', async () => {
    setRole('editor')
    expect(
      (await deleteCandidateTestimonialsAction([testimonialId])).deletedIds,
    ).toEqual([])
    setRole('publisher')
    expect(
      (await deleteCandidateTestimonialsAction([testimonialId, testimonialId]))
        .deletedIds,
    ).toEqual([])
    expect(createClient).not.toHaveBeenCalled()
  })

  it('reports partial deletion and refreshes affected pages', async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: { message: 'Unavailable' } })
    vi.mocked(createClient).mockResolvedValue({ rpc } as never)
    const result = await deleteCandidateTestimonialsAction([
      testimonialId,
      secondTestimonialId,
    ])

    expect(result.deletedIds).toEqual([testimonialId])
    expect(result.error).toContain('Deleted 1 of 2')
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(revalidatePath).toHaveBeenCalledWith('/admin/testimonials')
    expect(revalidatePath).toHaveBeenCalledWith('/testimonials')
  })

  it('deletes every selected row when all RPC calls succeed', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    vi.mocked(createClient).mockResolvedValue({ rpc } as never)

    expect(
      await deleteCandidateTestimonialsAction([
        testimonialId,
        secondTestimonialId,
      ]),
    ).toEqual({ deletedIds: [testimonialId, secondTestimonialId] })
    expect(rpc).toHaveBeenNthCalledWith(1, 'delete_candidate_testimonial', {
      p_id: testimonialId,
    })
    expect(rpc).toHaveBeenNthCalledWith(2, 'delete_candidate_testimonial', {
      p_id: secondTestimonialId,
    })
  })
})
