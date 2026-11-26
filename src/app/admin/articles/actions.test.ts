import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import {
  deleteArticleAction,
  saveArticleAction,
  updateArticleStatusAction,
} from './actions'
import { initialArticleActionState } from './types'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

describe('Admin Articles Server Actions', () => {
  const mockAdminProfile = {
    id: 'admin-123',
    displayName: 'Super Admin',
    email: 'admin@opglobal.com.hk',
    roleKey: 'super_admin',
    roleDisplayName: 'Super Admin',
    aal: 'aal2',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdminSession).mockResolvedValue({
      profile: mockAdminProfile as never,
      currentLevel: 'aal2',
      nextLevel: 'aal2',
    })
  })

  it('rejects save when title or excerpt is missing', async () => {
    const formData = new FormData()
    formData.append('title', '')
    formData.append('excerpt', '')

    const result = await saveArticleAction(initialArticleActionState, formData)
    expect(result.status).toBe('error')
    expect(result.errors?.title).toBe('Title is required.')
    expect(result.errors?.excerpt).toBe('Excerpt/summary is required.')
  })

  it('rejects save when slug has invalid characters', async () => {
    const formData = new FormData()
    formData.append('title', 'Valid Title')
    formData.append('slug', 'INVALID_SLUG!')
    formData.append('excerpt', 'Valid excerpt summary.')

    const result = await saveArticleAction(initialArticleActionState, formData)
    expect(result.status).toBe('error')
    expect(result.errors?.slug).toContain('lowercase letters')
  })

  it('saves and creates a new article successfully', async () => {
    const formData = new FormData()
    formData.append('title', 'Scaling Offshore Engineering Pods')
    formData.append('slug', 'scaling-offshore-engineering-pods')
    formData.append('excerpt', 'How modern tech companies scale engineering.')
    formData.append('markdownContent', '## Heading\n\nParagraph text.')
    formData.append('status', 'draft')
    formData.append('category_id', '2')

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'c9b4e135-4db2-4d26-a05e-f001e3b2e001' },
          error: null,
        }),
      }),
    })

    const mockDeleteMappings = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const mockInsertMappings = vi.fn().mockResolvedValue({ error: null })
    const mockUpsertEngagement = vi.fn().mockResolvedValue({ error: null })

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'articles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: mockInsert,
          }
        }
        if (table === 'article_category_mappings') {
          return {
            delete: mockDeleteMappings,
            insert: mockInsertMappings,
          }
        }
        if (table === 'article_engagement') {
          return {
            upsert: mockUpsertEngagement,
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await saveArticleAction(initialArticleActionState, formData)
    expect(result.status).toBe('success')
    expect(result.articleId).toBe('c9b4e135-4db2-4d26-a05e-f001e3b2e001')
    expect(result.slug).toBe('scaling-offshore-engineering-pods')
  })

  it('deletes an article by UUID', async () => {
    const formData = new FormData()
    formData.append('articleId', 'c9b4e135-4db2-4d26-a05e-f001e3b2e001')
    formData.append('slug', 'scaling-offshore-engineering-pods')

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        delete: mockDelete,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await deleteArticleAction(formData)
    expect(result.success).toBe(true)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('updates article status to published', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await updateArticleStatusAction(
      'c9b4e135-4db2-4d26-a05e-f001e3b2e001',
      'published',
      'my-slug',
    )
    expect(result.success).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('resolves free-text author_name into a real author record and saves featured flag', async () => {
    const formData = new FormData()
    formData.append('title', 'Global Talent Playbook')
    formData.append('slug', 'global-talent-playbook')
    formData.append('excerpt', 'How remote leadership teams build trust.')
    formData.append('markdownContent', 'Executive operations guide.')
    formData.append('status', 'published')
    formData.append('author_name', 'Jane Doe')
    formData.append('is_featured', 'true')
    // Even if a stale fallback UUID were present, author_name takes precedence
    formData.append('author_id', '00000000-0000-0000-0000-000000000001')

    const createdAuthorId = '99999999-1111-4111-8111-111111111111'
    const insertedPayloads: Record<string, unknown>[] = []
    const mockUpsertSiteSetting = vi.fn().mockResolvedValue({ error: null })

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'authors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              insertedPayloads.push({ table, payload })
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: createdAuthorId },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }
        if (table === 'articles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              insertedPayloads.push({ table, payload })
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }
        if (table === 'site_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            upsert: mockUpsertSiteSetting,
          }
        }
        if (table === 'article_engagement') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await saveArticleAction(initialArticleActionState, formData)
    expect(result.status).toBe('success')

    const authorInsert = insertedPayloads.find((item) => item.table === 'authors')
    expect(authorInsert?.payload).toEqual({
      slug: 'jane-doe',
      full_name: 'Jane Doe',
      is_active: true,
    })

    const articleInsert = insertedPayloads.find(
      (item) => item.table === 'articles',
    )
    expect((articleInsert?.payload as Record<string, unknown>)?.author_id).toBe(
      createdAuthorId,
    )

    expect(mockUpsertSiteSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        setting_key: 'featured_article_slug',
        setting_value: 'global-talent-playbook',
      }),
      { onConflict: 'setting_key' },
    )
  })

  it('drops unverified fallback author UUIDs instead of hitting FK errors', async () => {
    const formData = new FormData()
    formData.append('title', 'Resilient Publishing')
    formData.append('slug', 'resilient-publishing')
    formData.append('excerpt', 'Avoid invalid FK writes.')
    formData.append('status', 'draft')
    formData.append('author_id', '00000000-0000-0000-0000-000000000001')

    let savedAuthorId: unknown = 'unset'
    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'authors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        if (table === 'articles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              savedAuthorId = payload.author_id
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee' },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }
        if (table === 'article_engagement') {
          return { upsert: vi.fn().mockResolvedValue({ error: null }) }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await saveArticleAction(initialArticleActionState, formData)
    expect(result.status).toBe('success')
    expect(savedAuthorId).toBeNull()
  })
})
