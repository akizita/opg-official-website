import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    profile: {
      id: 'admin-user-id',
      roleKey: 'super_admin',
    },
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn().mockReturnValue(null),
}))

import {
  resetClientsBlogAction,
  saveClientsBlogAction,
  uploadClientsBlogImageAction,
} from '@/app/admin/blog/actions'
import { CLIENTS_BLOG_SETTING_KEY } from '@/lib/content/clients-blog-types'
import { createClient } from '@/lib/supabase/server'

describe('Admin Clients Blog Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates required title, authorName, and minimum one block', async () => {
    const emptyTitle = new FormData()
    emptyTitle.set('payload', JSON.stringify({ title: '', authorName: 'OPG' }))
    const res1 = await saveClientsBlogAction({ status: 'idle' }, emptyTitle)
    expect(res1.status).toBe('error')

    const noBlocks = new FormData()
    noBlocks.set(
      'payload',
      JSON.stringify({
        title: 'Valid Headline',
        authorName: 'OPG Team',
        blocks: [],
      }),
    )
    const res2 = await saveClientsBlogAction({ status: 'idle' }, noBlocks)
    expect(res2.status).toBe('error')
  })

  it('persists blog studio configuration to site_settings and uploads blog photos', async () => {
    const upserted: Record<string, unknown>[] = []
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/blog/hero.png',
      },
    })

    const mockClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'site_settings') {
          return {
            upsert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
              upserted.push(row)
              return Promise.resolve({ error: null })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {}
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const uploadForm = new FormData()
    uploadForm.set(
      'file',
      new File([new Uint8Array([137, 80, 78, 71])], 'hero.png', {
        type: 'image/png',
      }),
    )
    const uploadRes = await uploadClientsBlogImageAction(uploadForm)
    expect(uploadRes.success).toBe(true)
    expect(uploadRes.url).toContain('public-media/blog/hero.png')

    const saveForm = new FormData()
    saveForm.set(
      'payload',
      JSON.stringify({
        title: 'Embedded Pod Playbook',
        lead: 'Refined strategy summary.',
        heroImageUrl: null,
        authorMode: 'team',
        authorName: 'Armi Escamilla',
        authorRole: 'Talent Acquisition Team Leader',
        featuredArticleMode: 'custom',
        featuredArticleSlug: 'tribute-to-true-connection',
        blocks: [
          {
            id: 'b1',
            type: 'rich_text',
            markdown: '### Key Outcomes\n\n- Rapid scale',
          },
        ],
      }),
    )

    const saveRes = await saveClientsBlogAction({ status: 'idle' }, saveForm)
    expect(saveRes.status).toBe('success')
    expect(upserted[0]).toMatchObject({
      setting_key: CLIENTS_BLOG_SETTING_KEY,
    })
    expect(saveRes.savedConfig?.heroImageUrl).toBeNull()
    expect(saveRes.savedConfig?.featuredArticleSlug).toBe(
      'tribute-to-true-connection',
    )

    const resetRes = await resetClientsBlogAction()
    expect(resetRes.success).toBe(true)
    expect(resetRes.config?.blocks.length).toBeGreaterThan(0)
  })
})
