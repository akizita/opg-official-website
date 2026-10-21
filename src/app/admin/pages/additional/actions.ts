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
  ADDITIONAL_PAGE_COPY,
  type AdditionalPage,
  pageCopyBlocks,
  readPageCopy,
} from '@/lib/content/page-copy'
import {
  type DocumentStatus,
  validatePageDocumentInput,
} from '@/lib/content/page-documents'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export type AdditionalPageActionState = {
  errors?: Record<string, string>
  message?: string
  status?: DocumentStatus
  success?: boolean
  updatedAt?: string
  version?: number
}

const primaryFields: Record<
  AdditionalPage,
  { title: string; summary: string }
> = {
  careers: { title: 'heroTitle', summary: 'heroLead' },
  articles: { title: 'pageTitle', summary: 'collectionLead' },
  contact: { title: 'heroTitle', summary: 'heroLead' },
}

export async function saveAdditionalPageAction(
  page: AdditionalPage,
  _previous: AdditionalPageActionState,
  formData: FormData,
): Promise<AdditionalPageActionState> {
  if (!Object.prototype.hasOwnProperty.call(ADDITIONAL_PAGE_COPY, page))
    return { success: false, message: 'Unknown page.' }
  const session = await getAdminSession()
  if (!session) return { success: false, message: 'Sign in to save changes.' }
  if (isAdminMfaRequired() && session.currentLevel !== 'aal2')
    return { success: false, message: 'Two-factor authentication is required.' }

  const role = session.profile.roleKey
  const intent = String(formData.get('intent') || 'save_draft')
  let status: DocumentStatus
  switch (intent) {
    case 'publish':
      if (!canPublish(role))
        return { success: false, message: 'You cannot publish content.' }
      status = 'published'
      break
    case 'unpublish':
      if (!canPublish(role))
        return { success: false, message: 'You cannot unpublish content.' }
      status = 'unpublished'
      break
    case 'submit_review':
      if (!canSubmitReview(role) || role === 'super_admin')
        return {
          success: false,
          message: 'You cannot submit this page for review.',
        }
      status = 'in_review'
      break
    case 'request_changes':
      if (!canRequestChanges(role))
        return { success: false, message: 'You cannot request changes.' }
      status = 'changes_requested'
      break
    case 'save_draft':
      if (!canEditDraft(role))
        return { success: false, message: 'You cannot edit content.' }
      status = 'draft'
      break
    default:
      return { success: false, message: 'Unknown page action.' }
  }

  const copy = readPageCopy(formData, ADDITIONAL_PAGE_COPY[page])
  if (Object.keys(copy.errors).length)
    return {
      success: false,
      errors: copy.errors,
      message: Object.values(copy.errors)[0],
    }
  const primary = primaryFields[page]
  const validation = validatePageDocumentInput({
    title: copy.values[primary.title],
    summary: copy.values[primary.summary],
    content: pageCopyBlocks(copy.values),
    seo_title: formData.get('seoTitle'),
    seo_description: formData.get('seoDescription'),
    og_image_url: formData.get('ogImageUrl'),
    canonical_url: formData.get('canonicalUrl'),
    status,
  })
  if (!validation.success)
    return {
      success: false,
      errors: validation.errors,
      message: validation.message,
    }

  const supabase = await createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('page_documents')
    .select('id, version')
    .eq('slug', page)
    .maybeSingle()
  if (fetchError) {
    logger.error('Failed to query marketing page document', {
      page,
      error: fetchError.message,
    })
    return {
      success: false,
      message: `Could not load the ${page} page document.`,
    }
  }
  const now = new Date().toISOString()
  const version = (existing?.version ?? 0) + 1
  const documentData = {
    slug: page,
    ...validation.data,
    status,
    version,
    updated_at: now,
    updated_by: session.profile.id,
    ...(status === 'published'
      ? { published_at: now, published_by: session.profile.id }
      : {}),
  }
  const { error } = existing
    ? await supabase
        .from('page_documents')
        .update(documentData)
        .eq('id', existing.id)
    : await supabase
        .from('page_documents')
        .insert({
          ...documentData,
          created_at: now,
          created_by: session.profile.id,
        })
  if (error) {
    logger.error('Failed to save marketing page document', {
      page,
      error: error.message,
    })
    return {
      success: false,
      message: `Could not save the ${page} page: ${error.message}`,
    }
  }
  revalidatePath(`/${page}`)
  revalidatePath('/admin/pages')
  return {
    success: true,
    message:
      status === 'published'
        ? `${page} page published.`
        : `${page} page saved.`,
    status,
    updatedAt: now,
    version,
  }
}
