import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  getJobOpeningBySlug,
  getPublishedJobOpenings,
  validateJobOpeningInput,
} from '@/lib/content/careers'
import { createClient } from '@/lib/supabase/server'

describe('careers schema & validation', () => {
  it('validates a valid job opening input', () => {
    const valid = {
      title: 'Senior Full Stack Engineer',
      slug: 'senior-full-stack-engineer',
      department_id: 1,
      location: 'Remote',
      work_arrangement: 'remote',
      employment_type: 'full_time',
      summary: 'Build high impact cloud systems.',
      external_apply_url: 'https://outsourcedproglobal.applytojob.com',
      status: 'published',
    }

    const { data, errors } = validateJobOpeningInput(valid)
    expect(errors).toEqual({})
    expect(data).not.toBeNull()
    expect(data?.work_arrangement).toBe('remote')
  })

  it('rejects missing apply url or invalid department', () => {
    const invalid = {
      title: 'Engineer',
      department_id: -1,
      external_apply_url: '',
    }

    const { data, errors } = validateJobOpeningInput(invalid)
    expect(data).toBeNull()
    expect(errors.department_id).toBe('A valid department is required')
    expect(errors.external_apply_url).toBe('External apply URL is required')
  })
})

describe('careers data queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches published job openings with department details', async () => {
    const mockOpenings = [
      {
        id: 'job-1',
        slug: 'senior-engineer',
        title: 'Senior Engineer',
        department_id: 1,
        location: 'Remote',
        work_arrangement: 'remote',
        employment_type: 'full_time',
        summary: 'Cloud roles',
        description: [],
        external_apply_url: 'https://example.com/apply',
        status: 'published',
        department: { id: 1, slug: 'engineering', name: 'Engineering' },
      },
    ]

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi
              .fn()
              .mockResolvedValue({ data: mockOpenings, error: null }),
          }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const openings = await getPublishedJobOpenings()
    expect(openings).toHaveLength(1)
    expect(openings[0].department?.name).toBe('Engineering')
  })

  it('fetches job opening by slug', async () => {
    const mockOpening = {
      id: 'job-1',
      slug: 'senior-engineer',
      title: 'Senior Engineer',
      department_id: 1,
      location: 'Remote',
      work_arrangement: 'remote',
      employment_type: 'full_time',
      external_apply_url: 'https://example.com/apply',
      status: 'published',
      department: { id: 1, name: 'Engineering' },
    }

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockOpening, error: null }),
          }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const opening = await getJobOpeningBySlug('senior-engineer')
    expect(opening).not.toBeNull()
    expect(opening?.title).toBe('Senior Engineer')
  })
})
