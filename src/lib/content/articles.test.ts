import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  getArticleBySlug,
  getArticleCategories,
  getArticleTags,
  getPublishedArticles,
  validateArticleInput,
} from '@/lib/content/articles'
import { createClient } from '@/lib/supabase/server'

describe('articles schema & validation', () => {
  it('validates a correct article input', () => {
    const valid = {
      title: 'Building Distributed Engineering Pods',
      slug: 'building-distributed-engineering-pods',
      excerpt: 'How leading tech firms scale engineering across timezones.',
      content: [{ type: 'paragraph', content: 'Distributed velocity requires trust.' }],
      author_id: 'a1',
      reading_time_minutes: 5,
      status: 'published',
    }

    const { data, errors } = validateArticleInput(valid)
    expect(errors).toEqual({})
    expect(data).not.toBeNull()
    expect(data?.title).toBe(valid.title)
    expect(data?.reading_time_minutes).toBe(5)
  })

  it('rejects an article without title or excerpt', () => {
    const invalid = {
      title: '',
      excerpt: '',
    }

    const { data, errors } = validateArticleInput(invalid)
    expect(data).toBeNull()
    expect(errors.title).toBe('Title is required')
    expect(errors.excerpt).toBe('Excerpt is required')
  })

  it('rejects invalid slug format', () => {
    const invalid = {
      title: 'Valid Title',
      excerpt: 'Valid excerpt text.',
      slug: 'Invalid Slug!',
    }

    const { data, errors } = validateArticleInput(invalid)
    expect(data).toBeNull()
    expect(errors.slug).toContain('lowercase letters')
  })
})

describe('articles data queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches published articles with pagination metadata', async () => {
    const mockArticles = [
      {
        id: '1',
        slug: 'distributed-pods',
        title: 'Distributed Pods',
        excerpt: 'Summary',
        content: [],
        reading_time_minutes: 4,
        status: 'published',
        published_at: new Date().toISOString(),
        author: { full_name: 'Elena Rostova' },
        category_mappings: [{ category: { name: 'Engineering', slug: 'engineering' } }],
        tag_mappings: [{ tag: { name: 'Cloud', slug: 'cloud' } }],
      },
    ]

    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockArticles, count: 1, error: null }),
    }

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await getPublishedArticles({ page: 1, pageSize: 6 })
    expect(result.articles).toHaveLength(1)
    expect(result.articles[0].author?.full_name).toBe('Elena Rostova')
    expect(result.articles[0].categories?.[0].name).toBe('Engineering')
    expect(result.total).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it('fetches single article by slug', async () => {
    const mockArticle = {
      id: 'art-1',
      slug: 'distributed-pods',
      title: 'Distributed Pods',
      excerpt: 'Summary',
      content: [{ type: 'paragraph', content: 'Details' }],
      status: 'published',
      author: { full_name: 'Marcus Chen' },
      category_mappings: [],
      tag_mappings: [],
    }

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
          }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const article = await getArticleBySlug('distributed-pods')
    expect(article).not.toBeNull()
    expect(article?.title).toBe('Distributed Pods')
    expect(article?.author?.full_name).toBe('Marcus Chen')
  })

  it('fetches article categories and tags', async () => {
    const mockCategories = [{ id: 1, slug: 'tech', name: 'Technology' }]
    const mockTags = [{ id: 1, slug: 'remote', name: 'Remote' }]

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'article_categories' ? mockCategories : mockTags,
              error: null,
            }),
          }),
        }),
      })),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const cats = await getArticleCategories()
    const tags = await getArticleTags()

    expect(cats).toHaveLength(1)
    expect(cats[0].name).toBe('Technology')
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Remote')
  })
})

