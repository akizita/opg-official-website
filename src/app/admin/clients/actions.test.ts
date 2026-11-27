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
  bulkDeleteClientsAction,
  bulkSetClientsVisibilityAction,
  deleteClientAction,
  saveClientAction,
  toggleClientVisibilityAction,
} from '@/app/admin/clients/actions'
import { createClient } from '@/lib/supabase/server'

describe('Admin Clients Management Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates all required Partner Profile fields and logo requirement', async () => {
    const formData = new FormData()
    formData.append('name', '')
    formData.append('type_of_company', '')
    formData.append('tagline', '')
    formData.append('description', '')
    formData.append('operational_base', '')
    formData.append('dedicated_capability', '')

    const result = await saveClientAction({ status: 'idle' }, formData)
    expect(result.status).toBe('error')
    expect(result.errors?.name).toBeDefined()
    expect(result.errors?.type_of_company).toBeDefined()
    expect(result.errors?.tagline).toBeDefined()
    expect(result.errors?.description).toBeDefined()
    expect(result.errors?.operational_base).toBeDefined()
    expect(result.errors?.dedicated_capability).toBeDefined()
    expect(result.errors?.logo).toBeDefined()
  })

  it('adds a new client partner, uploads logo to public-media/clients, and normalizes URLs', async () => {
    const formData = new FormData()
    formData.append('name', 'Apex Robotics')
    formData.append('type_of_company', 'Industrial Automation')
    formData.append('tagline', 'Autonomous factory orchestration systems')
    formData.append(
      'description',
      'Apex Robotics deploys predictive telemetry and robotic coordination platforms across automated plants.',
    )
    formData.append('operational_base', 'United States (Austin, TX)')
    formData.append('dedicated_capability', 'Embedded Firmware & Cloud Ops Pod')
    formData.append('website_url', 'apexrobotics.example.com')
    formData.append('linkedin_url', 'https://linkedin.com/company/apex-robotics')
    formData.append('is_visible', 'true')
    formData.append(
      'logo_file',
      new File([new Uint8Array([137, 80, 78, 71])], 'apex.png', {
        type: 'image/png',
      }),
    )

    const insertedClients: Record<string, unknown>[] = []
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: {
        publicUrl:
          'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/clients/apex-robotics.png',
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
        if (table === 'clients') {
          return {
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              insertedClients.push(payload)
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'cccccccc-1111-4222-8333-444444444444' },
                    error: null,
                  }),
                }),
              }
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

    const result = await saveClientAction({ status: 'idle' }, formData)
    expect(result.status).toBe('success')
    expect(mockUpload).toHaveBeenCalled()
    expect(insertedClients[0]).toMatchObject({
      name: 'Apex Robotics',
      type_of_company: 'Industrial Automation',
      hero_domain: 'Industrial Automation',
      tagline: 'Autonomous factory orchestration systems',
      operational_base: 'United States (Austin, TX)',
      dedicated_capability: 'Embedded Firmware & Cloud Ops Pod',
      website_url: 'https://apexrobotics.example.com/',
      linkedin_url: 'https://linkedin.com/company/apex-robotics',
      is_visible: true,
    })
  })

  it('toggles visibility, deletes single client, and runs bulk visibility and bulk delete cleanly', async () => {
    const firstId = 'cccccccc-1111-4222-8333-444444444444'
    const secondId = 'dddddddd-2222-4333-8444-555555555555'

    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockInUpdate = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: firstId }, { id: secondId }],
        error: null,
      }),
    })
    const mockEqDelete = vi.fn().mockResolvedValue({ error: null })
    const mockInDelete = vi.fn().mockResolvedValue({ error: null })

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            update: vi.fn().mockReturnValue({
              eq: mockEqUpdate,
              in: mockInUpdate,
            }),
            delete: vi.fn().mockReturnValue({
              eq: mockEqDelete,
              in: mockInDelete,
            }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const vis = await toggleClientVisibilityAction(firstId, false)
    expect(vis.success).toBe(true)
    expect(mockEqUpdate).toHaveBeenCalledWith('id', firstId)

    const delForm = new FormData()
    delForm.append('clientId', firstId)
    const del = await deleteClientAction(delForm)
    expect(del.success).toBe(true)
    expect(mockEqDelete).toHaveBeenCalledWith('id', firstId)

    const bulkVis = await bulkSetClientsVisibilityAction(
      [firstId, secondId, 'bad-id'],
      true,
    )
    expect(bulkVis).toEqual({ success: true, count: 2 })
    expect(mockInUpdate).toHaveBeenCalledWith('id', [firstId, secondId])

    const bulkDel = await bulkDeleteClientsAction([firstId, secondId])
    expect(bulkDel).toEqual({ success: true, count: 2 })
    expect(mockInDelete).toHaveBeenCalledWith('id', [firstId, secondId])
  })
})
