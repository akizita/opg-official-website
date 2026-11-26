import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn(),
}))
vi.mock('@/lib/email/inquiry-reply', () => ({
  sendInquiryReplyEmail: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

import {
  bulkDeleteInquiriesAction,
  bulkUpdateInquiryStatusAction,
} from '@/app/admin/inquiries/actions'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

const id1 = '11111111-2222-4333-8444-555555555555'
const id2 = '22222222-3333-4444-8555-666666666666'

function setRole(roleKey: string) {
  vi.mocked(requireAdminSession).mockResolvedValue({
    profile: { roleKey, email: 'admin@opglobal.com.hk' },
  } as never)
}

describe('inquiry bulk status & delete actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRole('inquiry_manager')
  })

  it('rejects unauthorized roles before touching the database', async () => {
    setRole('editor')

    const statusRes = await bulkUpdateInquiryStatusAction([id1], 'read')
    const deleteRes = await bulkDeleteInquiriesAction([id1])

    expect(statusRes.success).toBe(false)
    expect(deleteRes.success).toBe(false)
    expect(createPrivilegedClient).not.toHaveBeenCalled()
    expect(createClient).not.toHaveBeenCalled()
  })

  it('rejects invalid UUID selections for bulk updates and deletes', async () => {
    const statusRes = await bulkUpdateInquiryStatusAction(['bad-id'], 'new')
    const deleteRes = await bulkDeleteInquiriesAction([])

    expect(statusRes.success).toBe(false)
    expect(deleteRes.success).toBe(false)
    expect(createPrivilegedClient).not.toHaveBeenCalled()
  })

  it('updates multiple inquiry statuses (read, new, archived) and revalidates', async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ id: id1 }, { id: id2 }],
      error: null,
    })
    const inFn = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ in: inFn })
    const from = vi.fn().mockReturnValue({ update })
    vi.mocked(createPrivilegedClient).mockReturnValue({ from } as never)

    const res = await bulkUpdateInquiryStatusAction([id1, id2], 'archived')

    expect(res).toEqual({ success: true, updatedIds: [id1, id2] })
    expect(from).toHaveBeenCalledWith('contact_inquiries')
    expect(update).toHaveBeenCalledWith({ status: 'archived' })
    expect(inFn).toHaveBeenCalledWith('id', [id1, id2])
    expect(revalidatePath).toHaveBeenCalledWith('/admin/inquiries')
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
  })

  it('deletes selected inquiries via privileged client and revalidates', async () => {
    const select = vi.fn().mockResolvedValue({
      data: [{ id: id1 }, { id: id2 }],
      error: null,
    })
    const inFn = vi.fn().mockReturnValue({ select })
    const del = vi.fn().mockReturnValue({ in: inFn })
    const from = vi.fn().mockReturnValue({ delete: del })
    vi.mocked(createPrivilegedClient).mockReturnValue({ from } as never)

    const res = await bulkDeleteInquiriesAction([id1, id2])

    expect(res).toEqual({ success: true, deletedIds: [id1, id2] })
    expect(from).toHaveBeenCalledWith('contact_inquiries')
    expect(inFn).toHaveBeenCalledWith('id', [id1, id2])
    expect(revalidatePath).toHaveBeenCalledWith('/admin/inquiries')
    expect(revalidatePath).toHaveBeenCalledWith('/admin')
  })
})
