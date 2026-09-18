import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  getAdminSession: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

import { saveAboutAction } from '@/app/admin/pages/about/actions'
import { getAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

describe('saveAboutAction server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createFormData(fields: Record<string, string>): FormData {
    const formData = new FormData()
    for (const [key, val] of Object.entries(fields)) {
      formData.set(key, val)
    }
    return formData
  }

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getAdminSession).mockResolvedValue(null)

    const formData = createFormData({
      intent: 'save_draft',
      title: 'New About',
    })

    const result = await saveAboutAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Authentication required')
  })

  it('rejects requests without AAL2 MFA', async () => {
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      profile: {
        id: 'user-1',
        email: 'editor@opglobal.com.hk',
        displayName: 'Editor User',
        roleKey: 'editor',
        roleDisplayName: 'Editor',
        isActive: true,
      },
    })

    const formData = createFormData({
      intent: 'save_draft',
      title: 'New About',
    })

    const result = await saveAboutAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.message).toContain(
      'Two-factor authentication (MFA) verification required',
    )
  })

  it('rejects editor role attempting to publish About page', async () => {
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      profile: {
        id: 'user-1',
        email: 'editor@opglobal.com.hk',
        displayName: 'Editor User',
        roleKey: 'editor',
        roleDisplayName: 'Editor',
        isActive: true,
      },
    })

    const formData = createFormData({
      intent: 'publish',
      title: 'About Us',
      body: 'About us narrative content.',
    })

    const result = await saveAboutAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.message).toContain(
      'Forbidden: You do not have permission to publish',
    )
  })

  it('allows publisher to publish About page and revalidates cache', async () => {
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      profile: {
        id: 'user-pub',
        email: 'publisher@opglobal.com.hk',
        displayName: 'Publisher User',
        roleKey: 'publisher',
        roleDisplayName: 'Publisher',
        isActive: true,
      },
    })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'doc-about', version: 2 },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const formData = createFormData({
      intent: 'publish',
      title: 'About Outsourced Pro Global',
      summary: 'Executive summary of OPG.',
      body: 'Leading international remote workforce partner.',
    })

    const result = await saveAboutAction({}, formData)

    expect(result.success).toBe(true)
    expect(result.status).toBe('published')
    expect(result.version).toBe(3)
    expect(revalidatePath).toHaveBeenCalledWith('/about')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages/about')
  })
})
