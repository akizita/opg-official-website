import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

import {
  createClientPartnerAction,
  deleteClientPartnerAction,
  toggleClientVisibilityAction,
  updateClientPartnerAction,
} from '@/app/admin/clients/clients-actions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

const mockClientId = 'c1100000-0000-4000-8000-000000000001'

function setRole(roleKey: string) {
  vi.mocked(requireAdminSession).mockResolvedValue({
    profile: { roleKey, userId: 'admin-user-id' },
  } as never)
}

describe('client partner actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole('publisher')
  })

  describe('createClientPartnerAction', () => {
    it('rejects users without publish permission', async () => {
      setRole('viewer')
      const result = await createClientPartnerAction({
        name: 'New Partner',
        logo_url: '/images/clients/partner.svg',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('permission')
    })

    it('rejects input missing name or logo_url', async () => {
      const result = await createClientPartnerAction({
        name: '',
        logo_url: '',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Client name is required')
    })

    it('creates client partner and revalidates paths', async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: mockClientId },
        error: null,
      })
      const select = vi.fn().mockReturnValue({ single })
      const insert = vi.fn().mockReturnValue({ select })
      const from = vi.fn().mockReturnValue({ insert })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await createClientPartnerAction({
        name: 'Acme Cloud',
        logo_url: '/images/clients/acme.svg',
        type_of_company: 'Cloud Infrastructure',
        hero_domain: 'Cloud Systems',
        tagline: 'High-velocity cloud migration',
        description: 'Accelerating enterprise cloud transitions.',
        operational_base: 'North America (Seattle, WA)',
        dedicated_capability: 'Cloud DevOps & SRE Pod',
        website_url: 'https://acme.example.com',
        display_order: 1,
        is_visible: true,
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe(mockClientId)
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme Cloud',
          logo_url: '/images/clients/acme.svg',
          type_of_company: 'Cloud Infrastructure',
          hero_domain: 'Cloud Systems',
          is_visible: true,
        }),
      )
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/clients')
    })
  })

  describe('updateClientPartnerAction', () => {
    it('rejects invalid client ID', async () => {
      const result = await updateClientPartnerAction('invalid-id', {
        name: 'Updated Name',
        logo_url: '/images/clients/acme.svg',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid client ID')
    })

    it('updates client partner and revalidates paths', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await updateClientPartnerAction(mockClientId, {
        name: 'Northstar Labs Updated',
        logo_url: '/images/clients/northstar.svg',
        type_of_company: 'Enterprise Software',
      })

      expect(result.success).toBe(true)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Northstar Labs Updated',
        }),
      )
      expect(eq).toHaveBeenCalledWith('id', mockClientId)
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/clients')
    })
  })

  describe('deleteClientPartnerAction', () => {
    it('requires archive permission to delete', async () => {
      setRole('editor')
      const result = await deleteClientPartnerAction(mockClientId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('permission')
    })

    it('deletes client partner and revalidates paths', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null })
      const del = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ delete: del })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await deleteClientPartnerAction(mockClientId)
      expect(result.success).toBe(true)
      expect(eq).toHaveBeenCalledWith('id', mockClientId)
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
      expect(revalidatePath).toHaveBeenCalledWith('/admin/clients')
    })
  })

  describe('toggleClientVisibilityAction', () => {
    it('toggles visibility and revalidates paths', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      vi.mocked(createClient).mockResolvedValue({ from } as never)

      const result = await toggleClientVisibilityAction(mockClientId, false)
      expect(result.success).toBe(true)
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_visible: false,
        }),
      )
      expect(eq).toHaveBeenCalledWith('id', mockClientId)
      expect(revalidatePath).toHaveBeenCalledWith('/clients')
    })
  })
})
