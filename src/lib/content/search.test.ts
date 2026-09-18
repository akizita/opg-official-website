import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  sanitizeSearchQuery,
  searchPublishedDocuments,
} from '@/lib/content/search'
import { createClient } from '@/lib/supabase/server'

describe('search query sanitizer', () => {
  it('sanitizes input and limits to 100 characters', () => {
    const raw = '   engineering  teams!@#$%^   '
    const sanitized = sanitizeSearchQuery(raw)
    expect(sanitized).toBe('engineering  teams')

    const longQuery = 'a'.repeat(150)
    const clamped = sanitizeSearchQuery(longQuery)
    expect(clamped.length).toBe(100)
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeSearchQuery('')).toBe('')
    expect(sanitizeSearchQuery('    ')).toBe('')
  })
})

describe('search published documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes full text search query', async () => {
    const mockResults = [
      {
        id: '1',
        entity_type: 'service',
        entity_id: 'dedicated-teams',
        title: 'Dedicated Remote Teams',
        excerpt: 'High performing teams.',
        url_path: '/services/dedicated-teams',
        created_at: new Date().toISOString(),
      },
    ]

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          textSearch: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockResults,
              count: 1,
              error: null,
            }),
          }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const response = await searchPublishedDocuments('dedicated teams')
    expect(response.results).toHaveLength(1)
    expect(response.results[0].title).toBe('Dedicated Remote Teams')
    expect(response.total).toBe(1)
  })
})

