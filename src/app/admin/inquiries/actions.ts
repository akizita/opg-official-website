'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canManageInquiries } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

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
  return { success: true }
}
