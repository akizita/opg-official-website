import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({ getAdminSession: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { saveHomeAction } from '@/app/admin/pages/home/actions'
import { getAdminSession } from '@/lib/auth/admin-session'
import { HOME_COPY_SECTIONS } from '@/lib/content/page-copy'
import { createClient } from '@/lib/supabase/server'

describe('saveHomeAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes the Home page document and revalidates the homepage', async () => {
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      profile: {
        id: 'publisher',
        email: 'publisher@example.com',
        displayName: 'Publisher',
        roleKey: 'publisher',
        roleDisplayName: 'Publisher',
        isActive: true,
      },
    })
    const update = vi
      .fn()
      .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const eq = vi
      .fn()
      .mockReturnValue({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({
            data: { id: 'home-doc', version: 1 },
            error: null,
          }),
      })
    vi.mocked(createClient).mockResolvedValue({
      from: vi
        .fn()
        .mockReturnValue({ select: vi.fn().mockReturnValue({ eq }), update }),
    } as never)
    const form = new FormData()
    form.set('intent', 'publish')
    form.set('title', 'Our global team')
    form.set('summary', 'A new Home introduction.')
    for (const section of HOME_COPY_SECTIONS) {
      for (const field of section.fields)
        form.set(field.key, field.defaultValue)
    }
    form.set('card2Metric', '4+ Years')

    const result = await saveHomeAction({}, form)

    expect(result).toMatchObject({
      success: true,
      status: 'published',
      version: 2,
    })
    expect(eq).toHaveBeenCalledWith('slug', 'home')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'home',
        content: expect.arrayContaining([
          { type: 'paragraph', key: 'card2Metric', content: '4+ Years' },
        ]),
      }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })
})
