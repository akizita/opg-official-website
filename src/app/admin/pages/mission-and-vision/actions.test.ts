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

import { saveMissionVisionAction } from '@/app/admin/pages/mission-and-vision/actions'
import { getAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

describe('saveMissionVisionAction server action', () => {
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
      title: 'New Mission',
    })

    const result = await saveMissionVisionAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Authentication required')
  })

  it('rejects requests without AAL2 MFA verification', async () => {
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
      title: 'New Mission',
    })

    const result = await saveMissionVisionAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.message).toContain(
      'Two-factor authentication (MFA) verification required',
    )
  })

  it('rejects editor role attempting to publish', async () => {
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
      title: 'Publish attempt',
      missionBody: 'Body content',
      visionBody: 'Vision content',
    })

    const result = await saveMissionVisionAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.message).toContain(
      'Forbidden: You do not have permission to publish',
    )
  })

  it('rejects save draft with empty title', async () => {
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
      intent: 'save_draft',
      title: '   ',
      missionBody: 'Body content',
      visionBody: 'Vision content',
    })

    const result = await saveMissionVisionAction({}, formData)
    expect(result.success).toBe(false)
    expect(result.errors?.title).toContain('Title is required')
  })

  it('allows editor to save draft and revalidates path', async () => {
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      profile: {
        id: 'user-editor',
        email: 'editor@opglobal.com.hk',
        displayName: 'Editor User',
        roleKey: 'editor',
        roleDisplayName: 'Editor',
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
              data: { id: 'doc-123', version: 3 },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const formData = createFormData({
      intent: 'save_draft',
      title: 'Updated Mission & Vision',
      summary: 'Updated summary.',
      missionTitle: 'Our Mission',
      missionBody: 'Our mission body text.',
      visionTitle: 'Our Vision',
      visionBody: 'Our vision body text.',
    })

    const result = await saveMissionVisionAction({}, formData)

    expect(result.success).toBe(true)
    expect(result.status).toBe('draft')
    expect(result.version).toBe(4)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Mission & Vision',
        status: 'draft',
        version: 4,
        updated_by: 'user-editor',
      }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/mission-and-vision')
    expect(revalidatePath).toHaveBeenCalledWith(
      '/admin/pages/mission-and-vision',
    )
  })

  it('allows publisher to publish and sets published_at and published_by', async () => {
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
              data: { id: 'doc-123', version: 1 },
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
      title: 'Official Mission & Vision',
      missionBody: 'Published mission.',
      visionBody: 'Published vision.',
    })

    const result = await saveMissionVisionAction({}, formData)

    expect(result.success).toBe(true)
    expect(result.status).toBe('published')
    expect(result.version).toBe(2)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        published_by: 'user-pub',
      }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/mission-and-vision')
  })
})
