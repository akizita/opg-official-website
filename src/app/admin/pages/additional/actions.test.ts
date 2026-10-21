import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({ getAdminSession: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { saveAdditionalPageAction } from '@/app/admin/pages/additional/actions'
import { getAdminSession } from '@/lib/auth/admin-session'
import {
  ADDITIONAL_PAGE_COPY,
  type AdditionalPage,
} from '@/lib/content/page-copy'
import { createClient } from '@/lib/supabase/server'

function formFor(page: AdditionalPage) {
  const form = new FormData()
  form.set('intent', 'publish')
  for (const section of ADDITIONAL_PAGE_COPY[page]) {
    for (const field of section.fields) form.set(field.key, field.defaultValue)
  }
  return form
}

describe('saveAdditionalPageAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves a Contact page and validates its email links', async () => {
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
            data: { id: 'contact-doc', version: 2 },
            error: null,
          }),
      })
    vi.mocked(createClient).mockResolvedValue({
      from: vi
        .fn()
        .mockReturnValue({ select: vi.fn().mockReturnValue({ eq }), update }),
    } as never)

    const invalid = formFor('contact')
    invalid.set('clientEmail', 'not-an-email')
    expect(
      await saveAdditionalPageAction('contact', {}, invalid),
    ).toMatchObject({
      success: false,
      errors: { clientEmail: expect.any(String) },
    })
    expect(update).not.toHaveBeenCalled()

    const valid = formFor('contact')
    valid.set('heroTitle', 'Talk to our team')
    const result = await saveAdditionalPageAction('contact', {}, valid)
    expect(result).toMatchObject({
      success: true,
      status: 'published',
      version: 3,
    })
    expect(eq).toHaveBeenCalledWith('slug', 'contact')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'contact',
        title: 'Talk to our team',
        content: expect.arrayContaining([
          {
            type: 'paragraph',
            key: 'clientEmail',
            content: 'inquiries@opglobal.com.hk',
          },
        ]),
      }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/contact')
  })
})
