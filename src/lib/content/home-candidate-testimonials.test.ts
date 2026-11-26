import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/content/candidate-testimonials', () => ({
  getApprovedCandidateTestimonials: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createPrivilegedClient: vi.fn(),
}))
vi.mock('@/lib/auth/user-avatars', () => ({
  buildGravatarUrl: vi.fn((email: string) =>
    email ? `https://www.gravatar.com/avatar/${email}` : null,
  ),
  resolveAuthAvatarsByEmail: vi.fn().mockResolvedValue(new Map()),
}))

import { resolveAuthAvatarsByEmail } from '@/lib/auth/user-avatars'
import { getApprovedCandidateTestimonials } from '@/lib/content/candidate-testimonials'
import { getHomeCandidateTestimonials } from '@/lib/content/home-candidate-testimonials'
import { createPrivilegedClient } from '@/lib/supabase/server'

describe('getHomeCandidateTestimonials', () => {
  it('slices approved testimonials to limit and enriches photos without exposing emails', async () => {
    vi.mocked(getApprovedCandidateTestimonials).mockResolvedValue([
      {
        id: 't1',
        author_name: 'Aaron Calusa',
        relationship: 'past',
        role_title: 'Senior Video Editor',
        rating: 5,
        quote: 'Great experience at OPG.',
        published_at: '2026-11-25T00:00:00Z',
      },
      {
        id: 't2',
        author_name: 'Gelo Milabo',
        relationship: 'past',
        role_title: 'Data Analyst',
        rating: 5,
        quote: 'Very supportive team.',
        published_at: '2026-11-24T00:00:00Z',
      },
      {
        id: 't3',
        author_name: 'Extra Candidate',
        relationship: 'prospective',
        role_title: 'Designer',
        rating: 4,
        quote: 'Should be excluded when limit=2.',
        published_at: '2026-11-23T00:00:00Z',
      },
    ])

    const inFn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 't1',
          email: 'aaron@example.com',
          profile_photo_data: 'YWJj',
          profile_photo_path: null,
        },
        {
          id: 't2',
          email: 'gelo@example.com',
          profile_photo_data: null,
          profile_photo_path: null,
        },
      ],
      error: null,
    })
    const eqFn = vi.fn().mockReturnValue({ in: inFn })
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
    const fromFn = vi.fn().mockReturnValue({ select: selectFn })

    vi.mocked(createPrivilegedClient).mockReturnValue({
      from: fromFn,
    } as never)
    vi.mocked(resolveAuthAvatarsByEmail).mockResolvedValue(
      new Map([['gelo@example.com', 'https://cdn.example.com/gelo.jpg']]),
    )

    const result = await getHomeCandidateTestimonials(2)

    expect(result).toHaveLength(2)
    expect(result[0]?.author_name).toBe('Aaron Calusa')
    expect(result[0]?.avatarUrl).toBe('data:image/webp;base64,YWJj')
    expect(result[0]?.gravatarUrl).toBe(
      'https://www.gravatar.com/avatar/aaron@example.com',
    )
    expect(result[1]?.avatarUrl).toBe('https://cdn.example.com/gelo.jpg')
    expect('email' in (result[0] ?? {})).toBe(false)
    expect('email' in (result[1] ?? {})).toBe(false)
  })

  it('degrades gracefully when privileged client is unavailable', async () => {
    vi.mocked(getApprovedCandidateTestimonials).mockResolvedValue([
      {
        id: 't1',
        author_name: 'Aaron Calusa',
        relationship: 'past',
        role_title: null,
        rating: 5,
        quote: 'Great experience at OPG.',
        published_at: '2026-11-25T00:00:00Z',
      },
    ])
    vi.mocked(createPrivilegedClient).mockReturnValue(null)

    const result = await getHomeCandidateTestimonials(4)
    expect(result).toHaveLength(1)
    expect(result[0]?.avatarUrl).toBeNull()
    expect(result[0]?.gravatarUrl).toBeNull()
  })
})
