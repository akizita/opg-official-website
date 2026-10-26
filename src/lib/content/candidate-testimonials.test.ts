import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createStaticClient: vi.fn(),
}))
vi.mock('@/lib/content/inquiries', () => ({
  checkRateLimits: vi.fn().mockReturnValue({ allowed: true }),
  hashValue: vi.fn().mockReturnValue('test-fingerprint'),
  verifyTurnstileToken: vi.fn().mockResolvedValue({ success: true }),
}))

import {
  getApprovedCandidateTestimonials,
  submitCandidateTestimonial,
  validateCandidateTestimonialInput,
} from '@/lib/content/candidate-testimonials'

const validInput = {
  authorName: 'Aki Candidate',
  email: 'Candidate@Example.com',
  relationship: 'past',
  roleTitle: 'Designer',
  rating: 4,
  quote: 'The OPG team kept me informed throughout the process.',
  publicationConsent: true,
  honeypot: '',
  elapsedSeconds: 10,
}

describe('candidate testimonial validation', () => {
  it('normalizes a consented candidate story', () => {
    const result = validateCandidateTestimonialInput(validInput)
    expect(result.errors).toEqual({})
    expect(result.data).toMatchObject({
      email: 'candidate@example.com',
      relationship: 'past',
      rating: 4,
      publicationConsent: true,
    })
  })

  it('rejects missing consent, bot fields, and short stories', () => {
    const result = validateCandidateTestimonialInput({
      ...validInput,
      quote: 'Too short',
      publicationConsent: false,
      honeypot: 'spam',
    })
    expect(result.data).toBeNull()
    expect(result.errors).toHaveProperty('quote')
    expect(result.errors).toHaveProperty('publicationConsent')
    expect(result.errors).toHaveProperty('form')
  })

  it('requires a valid relationship and enough time to complete the form', () => {
    const result = validateCandidateTestimonialInput({
      ...validInput,
      relationship: 'client',
      elapsedSeconds: 0,
    })
    expect(result.data).toBeNull()
    expect(result.errors).toHaveProperty('relationship')
    expect(result.errors).toHaveProperty('form')
  })

  it('requires a whole-number rating from one to five', () => {
    for (const rating of [0, 6, 2.5, '']) {
      const result = validateCandidateTestimonialInput({
        ...validInput,
        rating,
      })
      expect(result.errors).toHaveProperty('rating')
    }
  })
})

describe('candidate testimonial public read', () => {
  it('uses the approved-stories RPC and returns its public fields', async () => {
    const rows = [
      {
        id: 'story-1',
        author_name: 'Aki Candidate',
        relationship: 'past',
        role_title: 'Designer',
        rating: 4,
        quote: validInput.quote,
        published_at: '2026-10-22T00:00:00Z',
      },
    ]
    const rpc = vi.fn().mockResolvedValue({ data: rows, error: null })
    const result = await getApprovedCandidateTestimonials({ rpc } as never)
    expect(rpc).toHaveBeenCalledWith(
      'get_approved_candidate_testimonials_with_rating',
    )
    expect(result).toEqual(rows)
  })

  it('uses the prior public reader when the rating RPC is absent', async () => {
    const legacyRow = {
      id: 'story-1',
      author_name: 'Aki Candidate',
      relationship: 'past',
      role_title: 'Designer',
      quote: validInput.quote,
      published_at: '2026-10-22T00:00:00Z',
    }
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'Function not in schema cache' },
      })
      .mockResolvedValueOnce({
        data: [legacyRow],
        error: null,
      })

    const result = await getApprovedCandidateTestimonials({ rpc } as never)

    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      'get_approved_candidate_testimonials_with_rating',
      'get_approved_candidate_testimonials',
    ])
    expect(result).toEqual([{ ...legacyRow, rating: null }])
  })
})

describe('candidate testimonial submission', () => {
  it('stores new stories as pending review', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn().mockReturnValue({ insert })
    const result = await submitCandidateTestimonial(validInput, '127.0.0.1', {
      from,
    } as never)
    expect(result).toEqual({ success: true })
    expect(from).toHaveBeenCalledWith('candidate_testimonials')
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_name: 'Aki Candidate',
        email: 'candidate@example.com',
        rating: 4,
        publication_consent: true,
      }),
    )
    expect(insert.mock.calls[0][0]).not.toHaveProperty('status')
    expect(insert.mock.calls[0][0]).not.toHaveProperty('profile_photo_data')
  })
})
