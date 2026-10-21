import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({ getAdminSession: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'

import { saveClientsAction } from '@/app/admin/pages/clients/actions'
import { getAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'
import { CLIENTS_COPY_SECTIONS } from '@/lib/content/page-copy'

function form(intent = 'publish') {
  const data = new FormData()
  data.set('intent', intent)
  data.set('title', 'A new Clients hero')
  data.set('summary', 'A short introduction to our clients.')
  data.set('editorialTitle', 'How we work together')
  data.set('editorialLead', 'Our teams build enduring partnerships.')
  for (const section of CLIENTS_COPY_SECTIONS) {
    for (const field of section.fields) data.set(field.key, field.defaultValue)
  }
  return data
}

function session(roleKey: string) {
  return {
    currentLevel: 'aal2' as const,
    nextLevel: 'aal2' as const,
    profile: {
      id: 'user-1',
      email: 'editor@example.com',
      displayName: 'Editor',
      roleKey,
      roleDisplayName: roleKey,
      isActive: true,
    },
  }
}

describe('saveClientsAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects editors trying to publish', async () => {
    vi.mocked(getAdminSession).mockResolvedValue(session('editor'))
    const result = await saveClientsAction({}, form())
    expect(result.success).toBe(false)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('skips the review step for super admins', async () => {
    vi.mocked(getAdminSession).mockResolvedValue(session('super_admin'))
    const result = await saveClientsAction({}, form('submit_review'))
    expect(result.success).toBe(false)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('publishes the Clients document and revalidates the public page', async () => {
    vi.mocked(getAdminSession).mockResolvedValue(session('publisher'))
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'clients-doc', version: 2 },
              error: null,
            }),
          }),
        }),
        update,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(client as never)

    const result = await saveClientsAction({}, form())

    expect(result).toMatchObject({
      success: true,
      status: 'published',
      version: 3,
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'clients',
        title: 'A new Clients hero',
        content: expect.arrayContaining([
          { type: 'heading', level: 2, content: 'How we work together' },
          {
            type: 'paragraph',
            content: 'Our teams build enduring partnerships.',
          },
          {
            type: 'paragraph',
            key: 'ctaTitle',
            content: 'Ready to Build Your Dedicated Offshore Team?',
          },
        ]),
      }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/clients')
  })
})
