'use server'

import { revalidatePath } from 'next/cache'

import {
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
} from '@/lib/auth/permissions'
import { getAdminSession } from '@/lib/auth/admin-session'
import {
  type DocumentStatus,
  validatePageDocumentInput,
} from '@/lib/content/page-documents'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export type AboutActionState = {
  errors?: Record<string, string>
  message?: string
  status?: DocumentStatus
  success?: boolean
  updatedAt?: string
  version?: number
}

export async function saveAboutAction(
  prevState: AboutActionState,
  formData: FormData,
): Promise<AboutActionState> {
  const session = await getAdminSession()

  if (!session) {
    return {
      success: false,
      message: 'Authentication required. Please sign in to save changes.',
    }
  }

  if (session.currentLevel !== 'aal2') {
    return {
      success: false,
      message: 'Two-factor authentication (MFA) verification required.',
    }
  }

  const roleKey = session.profile.roleKey
  const intent = formData.get('intent') as string

  let targetStatus: DocumentStatus = 'draft'
  let successMessage = 'Draft saved successfully.'

  switch (intent) {
    case 'publish':
      if (!canPublish(roleKey)) {
        return {
          success: false,
          message: 'Forbidden: You do not have permission to publish content.',
        }
      }
      targetStatus = 'published'
      successMessage = 'About page published successfully. Live page updated.'
      break

    case 'unpublish':
      if (!canPublish(roleKey)) {
        return {
          success: false,
          message:
            'Forbidden: You do not have permission to unpublish content.',
        }
      }
      targetStatus = 'unpublished'
      successMessage =
        'About page unpublished. It is no longer visible to the public.'
      break

    case 'submit_review':
      if (!canSubmitReview(roleKey)) {
        return {
          success: false,
          message:
            'Forbidden: You do not have permission to submit content for review.',
        }
      }
      targetStatus = 'in_review'
      successMessage = 'About page submitted for review.'
      break

    case 'request_changes':
      if (!canRequestChanges(roleKey)) {
        return {
          success: false,
          message: 'Forbidden: You do not have permission to request changes.',
        }
      }
      targetStatus = 'changes_requested'
      successMessage = 'About page returned for revisions.'
      break

    case 'save_draft':
    default:
      if (!canEditDraft(roleKey)) {
        return {
          success: false,
          message: 'Forbidden: You do not have permission to edit content.',
        }
      }
      targetStatus = 'draft'
      successMessage = 'Draft changes saved.'
      break
  }

  const rawTitle = formData.get('title')
  const rawSummary = formData.get('summary')
  const rawBody = (formData.get('body') as string) || ''
  const rawSeoTitle = formData.get('seoTitle')
  const rawSeoDescription = formData.get('seoDescription')
  const rawOgImageUrl = formData.get('ogImageUrl')
  const rawCanonicalUrl = formData.get('canonicalUrl')

  const paragraphs = rawBody
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const contentBlocks = paragraphs.map((p) => ({
    type: 'paragraph' as const,
    content: p,
  }))

  const validation = validatePageDocumentInput({
    title: rawTitle,
    summary: rawSummary,
    content:
      contentBlocks.length > 0
        ? contentBlocks
        : [{ type: 'paragraph', content: 'About Outsourced Pro Global.' }],
    seo_title: rawSeoTitle,
    seo_description: rawSeoDescription,
    og_image_url: rawOgImageUrl,
    canonical_url: rawCanonicalUrl,
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

  const { data: existingDoc, error: fetchError } = await supabase
    .from('page_documents')
    .select('id, version')
    .eq('slug', 'about')
    .maybeSingle()

  if (fetchError) {
    logger.error('Failed to query existing about page document', {
      error: fetchError.message,
    })
    return {
      success: false,
      message: 'Database query error while checking about page document.',
    }
  }

  const currentVersion = existingDoc?.version ?? 0
  const nextVersion = currentVersion + 1
  const now = new Date().toISOString()

  const documentData = {
    slug: 'about',
    title: validation.data.title,
    summary: validation.data.summary,
    content: validation.data.content,
    seo_title: validation.data.seo_title,
    seo_description: validation.data.seo_description,
    canonical_url: validation.data.canonical_url,
    og_image_url: validation.data.og_image_url,
    status: targetStatus,
    version: nextVersion,
    updated_at: now,
    updated_by: session.profile.id,
    ...(targetStatus === 'published'
      ? { published_at: now, published_by: session.profile.id }
      : {}),
  }

  let mutationError = null

  if (existingDoc) {
    const { error } = await supabase
      .from('page_documents')
      .update(documentData)
      .eq('id', existingDoc.id)
    mutationError = error
  } else {
    const { error } = await supabase.from('page_documents').insert({
      ...documentData,
      created_by: session.profile.id,
      created_at: now,
    })
    mutationError = error
  }

  if (mutationError) {
    logger.error('Failed to mutate about page document', {
      error: mutationError.message,
      userId: session.profile.id,
    })
    return {
      success: false,
      message: `Failed to save changes: ${mutationError.message}`,
    }
  }

  logger.info('About page updated successfully', {
    status: targetStatus,
    version: nextVersion,
    userId: session.profile.id,
    intent,
  })

  revalidatePath('/about')
  revalidatePath('/admin/pages/about')
  revalidatePath('/sitemap.xml')

  return {
    success: true,
    message: successMessage,
    status: targetStatus,
    version: nextVersion,
    updatedAt: now,
  }
}
