'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canManageInquiries } from '@/lib/auth/permissions'
import { broadcastAdminInquiriesChanged } from '@/lib/content/admin-inquiries'
import { sendInquiryReplyEmail } from '@/lib/email/inquiry-reply'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const BULK_STATUS_VALUES = new Set(['new', 'read', 'archived'] as const)
export type BulkInquiryStatus = 'new' | 'read' | 'archived'

function normalizeInquiryIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) return null
  const unique: string[] = []
  const seen = new Set<string>()
  for (const raw of ids) {
    if (typeof raw !== 'string') return null
    const id = raw.trim()
    if (!UUID_PATTERN.test(id)) return null
    if (!seen.has(id)) {
      seen.add(id)
      unique.push(id)
    }
  }
  return unique
}

export async function updateInquiryStatusAction(
  inquiryId: string,
  newStatus: 'new' | 'read' | 'replied' | 'archived',
) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageInquiries(profile.roleKey)) {
    throw new Error('Unauthorized to manage inquiry status')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_inquiries')
    .update({ status: newStatus })
    .eq('id', inquiryId)

  if (error) {
    throw new Error('Failed to update inquiry status')
  }

  revalidatePath('/admin/inquiries')
  revalidatePath(`/admin/inquiries/${inquiryId}`)
  void broadcastAdminInquiriesChanged()
  return { success: true }
}

export type SendInquiryReplyActionResult =
  | { messageId: string | null; success: true }
  | { configured: boolean; error: string; success: false }

export async function sendInquiryReplyAction({
  body,
  inquiryId,
  subject,
}: {
  body: string
  inquiryId: string
  subject: string
}): Promise<SendInquiryReplyActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageInquiries(profile.roleKey)) {
    return {
      success: false,
      configured: true,
      error: 'You do not have permission to reply to contacts.',
    }
  }

  const supabase = await createClient()
  const { data: inquiry, error: fetchError } = await supabase
    .from('contact_inquiries')
    .select('id, full_name, email, subject, status')
    .eq('id', inquiryId)
    .maybeSingle<{
      id: string
      full_name: string
      email: string
      subject: string
      status: string
    }>()

  if (fetchError || !inquiry) {
    return {
      success: false,
      configured: true,
      error: 'Could not locate the selected contact inquiry.',
    }
  }

  const referenceId = `OPG-${inquiry.id.slice(0, 8).toUpperCase()}`
  const replyTo =
    process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || profile.email || undefined

  const delivery = await sendInquiryReplyEmail({
    to: inquiry.email,
    toName: inquiry.full_name,
    subject,
    body,
    referenceId,
    replyTo,
  })

  if (!delivery.ok) {
    return {
      success: false,
      configured: delivery.configured,
      error: delivery.error,
    }
  }

  const { error: updateError } = await supabase
    .from('contact_inquiries')
    .update({ status: 'replied' })
    .eq('id', inquiry.id)

  if (updateError) {
    return {
      success: false,
      configured: true,
      error:
        'Email was sent, but the contact status could not be updated to Replied.',
    }
  }

  revalidatePath('/admin/inquiries')
  revalidatePath(`/admin/inquiries/${inquiry.id}`)
  revalidatePath('/admin')
  void broadcastAdminInquiriesChanged()
  return { success: true, messageId: delivery.messageId }
}

export async function bulkUpdateInquiryStatusAction(
  inquiryIds: string[],
  newStatus: BulkInquiryStatus,
): Promise<{ success: boolean; updatedIds?: string[]; error?: string }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageInquiries(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to update contacts.',
    }
  }

  const normalizedIds = normalizeInquiryIds(inquiryIds)
  if (!normalizedIds || !BULK_STATUS_VALUES.has(newStatus)) {
    return {
      success: false,
      error: 'Select one or more valid contacts to update.',
    }
  }

  const supabase = createPrivilegedClient() || (await createClient())
  const { data, error } = await supabase
    .from('contact_inquiries')
    .update({ status: newStatus })
    .in('id', normalizedIds)
    .select('id')

  if (error) {
    console.error('Could not bulk update contact statuses:', error.message)
    return {
      success: false,
      error: 'Failed to update the selected contacts. Try again.',
    }
  }

  const updatedIds = ((data ?? []) as Array<{ id: string }>).map((row) => row.id)
  if (updatedIds.length === 0) {
    return {
      success: false,
      error: 'No matching contacts were updated.',
    }
  }

  revalidatePath('/admin/inquiries')
  revalidatePath('/admin')
  void broadcastAdminInquiriesChanged()
  return { success: true, updatedIds }
}

export async function bulkDeleteInquiriesAction(
  inquiryIds: string[],
): Promise<{ success: boolean; deletedIds?: string[]; error?: string }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageInquiries(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to delete contacts.',
    }
  }

  const normalizedIds = normalizeInquiryIds(inquiryIds)
  if (!normalizedIds) {
    return {
      success: false,
      error: 'Select one or more valid contacts to delete.',
    }
  }

  const privileged = createPrivilegedClient()
  if (!privileged) {
    return {
      success: false,
      error: 'Server configuration does not allow permanent contact deletion.',
    }
  }

  const { data, error } = await privileged
    .from('contact_inquiries')
    .delete()
    .in('id', normalizedIds)
    .select('id')

  if (error) {
    console.error('Could not bulk delete contacts:', error.message)
    return {
      success: false,
      error: 'Failed to delete the selected contacts. Try again.',
    }
  }

  const deletedIds = ((data ?? []) as Array<{ id: string }>).map((row) => row.id)
  if (deletedIds.length === 0) {
    return {
      success: false,
      error: 'The selected contacts were already removed.',
    }
  }

  revalidatePath('/admin/inquiries')
  revalidatePath('/admin')
  void broadcastAdminInquiriesChanged()
  return { success: true, deletedIds }
}
