'use server'

import { revalidatePath } from 'next/cache'

import { getAdminSession } from '@/lib/auth/admin-session'
import { isAdminMfaRequired } from '@/lib/auth/config'
import {
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
} from '@/lib/auth/permissions'
import {
  type DocumentStatus,
  validatePageDocumentInput,
} from '@/lib/content/page-documents'
import {
  CLIENTS_COPY_SECTIONS,
  pageCopyBlocks,
  readPageCopy,
} from '@/lib/content/page-copy'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export type ClientsActionState = {
  errors?: Record<string, string>
  message?: string
  status?: DocumentStatus
  success?: boolean
  updatedAt?: string
  version?: number
}

export async function saveClientsAction(
  _previous: ClientsActionState,
  formData: FormData,
): Promise<ClientsActionState> {
  const session = await getAdminSession()
  if (!session) {
    return { success: false, message: 'Sign in to save changes.' }
  }
  if (isAdminMfaRequired() && session.currentLevel !== 'aal2') {
    return { success: false, message: 'Two-factor authentication is required.' }
  }

  const roleKey = session.profile.roleKey
  const intent = String(formData.get('intent') || 'save_draft')
  let targetStatus: DocumentStatus
  let successMessage: string

  switch (intent) {
    case 'publish':
      if (!canPublish(roleKey))
        return { success: false, message: 'You cannot publish content.' }
      targetStatus = 'published'
      successMessage = 'Clients page published.'
      break
    case 'unpublish':
      if (!canPublish(roleKey))
        return { success: false, message: 'You cannot unpublish content.' }
      targetStatus = 'unpublished'
      successMessage = 'Clients page unpublished.'
      break
    case 'submit_review':
      if (!canSubmitReview(roleKey) || roleKey === 'super_admin') {
        return {
          success: false,
          message: 'You cannot submit this page for review.',
        }
      }
      targetStatus = 'in_review'
      successMessage = 'Clients page submitted for review.'
      break
    case 'request_changes':
      if (!canRequestChanges(roleKey)) {
        return { success: false, message: 'You cannot request changes.' }
      }
      targetStatus = 'changes_requested'
      successMessage = 'Clients page returned for revisions.'
      break
    case 'save_draft':
      if (!canEditDraft(roleKey))
        return { success: false, message: 'You cannot edit content.' }
      targetStatus = 'draft'
      successMessage = 'Clients page draft saved.'
      break
    default:
      return { success: false, message: 'Unknown page action.' }
  }

  const editorialTitle = String(formData.get('editorialTitle') || '').trim()
  const editorialLead = String(formData.get('editorialLead') || '').trim()
  const summary = String(formData.get('summary') || '').trim()
  const errors: Record<string, string> = {}
  if (!summary) errors.summary = 'Add a hero introduction.'
  if (!editorialTitle) errors.editorialTitle = 'Add an editorial heading.'
  if (editorialTitle.length > 200)
    errors.editorialTitle = 'Keep the heading under 200 characters.'
  if (!editorialLead) errors.editorialLead = 'Add an editorial introduction.'
  if (editorialLead.length > 1000)
    errors.editorialLead = 'Keep the introduction under 1,000 characters.'
  if (Object.keys(errors).length) {
    return { success: false, errors, message: Object.values(errors)[0] }
  }
  const pageCopy = readPageCopy(formData, CLIENTS_COPY_SECTIONS)
  if (Object.keys(pageCopy.errors).length) {
    return {
      success: false,
      errors: pageCopy.errors,
      message: Object.values(pageCopy.errors)[0],
    }
  }

  const validation = validatePageDocumentInput({
    title: formData.get('title'),
    summary,
    content: [
      { type: 'heading', level: 2, content: editorialTitle },
      { type: 'paragraph', content: editorialLead },
      ...pageCopyBlocks(pageCopy.values),
    ],
    seo_title: formData.get('seoTitle'),
    seo_description: formData.get('seoDescription'),
    og_image_url: formData.get('ogImageUrl'),
    canonical_url: formData.get('canonicalUrl'),
    status: targetStatus,
  })
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
      message: validation.message,
    }
  }

  const supabase = await createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('page_documents')
    .select('id, version')
    .eq('slug', 'clients')
    .maybeSingle()
  if (fetchError) {
    logger.error('Failed to query Clients page document', {
      error: fetchError.message,
    })
    return {
      success: false,
      message: 'Could not load the Clients page document.',
    }
  }

  const now = new Date().toISOString()
  const version = (existing?.version ?? 0) + 1
  const documentData = {
    slug: 'clients',
    ...validation.data,
    status: targetStatus,
    version,
    updated_at: now,
    updated_by: session.profile.id,
    ...(targetStatus === 'published'
      ? { published_at: now, published_by: session.profile.id }
      : {}),
  }
  const { error: mutationError } = existing
    ? await supabase
        .from('page_documents')
        .update(documentData)
        .eq('id', existing.id)
    : await supabase.from('page_documents').insert({
        ...documentData,
        created_at: now,
        created_by: session.profile.id,
      })

  if (mutationError) {
    logger.error('Failed to save Clients page document', {
      error: mutationError.message,
    })
    return {
      success: false,
      message: `Could not save the Clients page: ${mutationError.message}`,
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/pages')
  revalidatePath('/sitemap.xml')

  return {
    success: true,
    message: successMessage,
    status: targetStatus,
    updatedAt: now,
    version,
  }
}
