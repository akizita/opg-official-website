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
}))

import {
  bulkDeleteTeamMembersAction,
  bulkSetTeamMembersVisibilityAction,
  deleteTeamMemberAction,
  saveTeamMemberAction,
  toggleTeamMemberVisibilityAction,
} from '@/app/admin/team/actions'
import { createClient } from '@/lib/supabase/server'

describe('Admin Team Management Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates required full_name, position, and department', async () => {
    const formData = new FormData()
    formData.append('full_name', '')
    formData.append('position', '')

    const result = await saveTeamMemberAction({ status: 'idle' }, formData)
    expect(result.status).toBe('error')
    expect(result.errors?.full_name).toBeDefined()
    expect(result.errors?.position).toBeDefined()
    expect(result.errors?.department).toBeDefined()
  })

  it('adds a new team member, uploads photo to public-media, and syncs author', async () => {
    const formData = new FormData()
    formData.append('full_name', 'Alex Rivera')
    formData.append('position', 'Senior Delivery Lead')
    formData.append('new_department_name', 'Delivery Leadership')
    formData.append('display_order', '3')
    formData.append('is_active', 'true')
    formData.append(
      'photo_file',
      new File([new Uint8Array([137, 80, 78, 71])], 'alex.png', {
        type: 'image/png',
      }),
    )

    const insertedMembers: Record<string, unknown>[] = []
    const insertedAuthors: Record<string, unknown>[] = []
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/team/alex-rivera.png',
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
        if (table === 'departments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: { id: 7 }, error: null }),
              }),
            }),
          }
        }
        if (table === 'team_members') {
          return {
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              insertedMembers.push(payload)
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'aaaaaaaa-bbbb-4ccc-8ddd-111111111111' },
                    error: null,
                  }),
                }),
              }
            }),
          }
        }
        if (table === 'authors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              insertedAuthors.push(payload)
              return Promise.resolve({ error: null })
            }),
          }
        }
        if (table === 'site_settings') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await saveTeamMemberAction({ status: 'idle' }, formData)
    expect(result.status).toBe('success')
    expect(mockUpload).toHaveBeenCalled()
    expect(insertedMembers[0]).toMatchObject({
      department_id: 7,
      full_name: 'Alex Rivera',
      position: 'Senior Delivery Lead',
      is_active: true,
    })
    expect(insertedAuthors[0]).toMatchObject({
      full_name: 'Alex Rivera',
      slug: 'alex-rivera',
      is_active: true,
    })
  })

  it('toggles visibility and deletes a team member cleanly', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    const mockUpdateMember = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { full_name: 'Alex Rivera', photo_url: null },
            error: null,
          }),
        }),
      }),
    })

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { full_name: 'Alex Rivera', photo_url: null },
                  error: null,
                }),
              }),
            }),
            update: mockUpdateMember,
            delete: mockDelete,
          }
        }
        if (table === 'authors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const vis = await toggleTeamMemberVisibilityAction(
      'aaaaaaaa-bbbb-4ccc-8ddd-111111111111',
      false,
    )
    expect(vis.success).toBe(true)
    expect(mockUpdateMember).toHaveBeenCalled()

    const delForm = new FormData()
    delForm.append('memberId', 'aaaaaaaa-bbbb-4ccc-8ddd-111111111111')
    const del = await deleteTeamMemberAction(delForm)
    expect(del.success).toBe(true)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('supports bulk hide/show visibility and bulk delete for selected team members', async () => {
    const firstId = 'aaaaaaaa-bbbb-4ccc-8ddd-111111111111'
    const secondId = 'bbbbbbbb-cccc-4ddd-8eee-222222222222'
    const mockInUpdate = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { id: firstId, full_name: 'Aki Zita', photo_url: null },
          { id: secondId, full_name: 'Glam Tan', photo_url: null },
        ],
        error: null,
      }),
    })
    const mockInDelete = vi.fn().mockResolvedValue({ error: null })

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'team_members') {
          return {
            update: vi.fn().mockReturnValue({ in: mockInUpdate }),
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: firstId, full_name: 'Aki Zita', photo_url: null },
                  { id: secondId, full_name: 'Glam Tan', photo_url: null },
                ],
                error: null,
              }),
            }),
            delete: vi.fn().mockReturnValue({ in: mockInDelete }),
          }
        }
        if (table === 'authors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const visRes = await bulkSetTeamMembersVisibilityAction(
      [firstId, secondId, 'not-a-uuid'],
      false,
    )
    expect(visRes).toEqual({ success: true, count: 2 })
    expect(mockInUpdate).toHaveBeenCalledWith('id', [firstId, secondId])

    const delRes = await bulkDeleteTeamMembersAction([firstId, secondId])
    expect(delRes).toEqual({ success: true, count: 2 })
    expect(mockInDelete).toHaveBeenCalledWith('id', [firstId, secondId])
  })
})
