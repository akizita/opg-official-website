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
  buildMissionVisionBlocks,
  type DocumentStatus,
  validatePageDocumentInput,
} from '@/lib/content/page-documents'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export type MissionVisionActionState = {
  errors?: Record<string, string>
  message?: string
  status?: DocumentStatus
  success?: boolean
  updatedAt?: string
  version?: number
}

export async function saveMissionVisionAction(
  prevState: MissionVisionActionState,
  formData: FormData,
): Promise<MissionVisionActionState> {
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

  // Determine target status and verify permissions
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
      successMessage = 'Page published successfully. Live page updated.'
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
        'Page unpublished. It is no longer visible to the public.'
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
      successMessage = 'Content submitted for review.'
      break

    case 'request_changes':
      if (!canRequestChanges(roleKey)) {
        return {
          success: false,
          message: 'Forbidden: You do not have permission to request changes.',
        }
      }
      targetStatus = 'changes_requested'
      successMessage = 'Content returned for revisions.'
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

  // Extract raw form data
  const rawTitle = formData.get('title')
  const rawSummary = formData.get('summary')
  const rawMissionTitle =
    (formData.get('missionTitle') as string) || 'Our Mission'
  const rawMissionBody = (formData.get('missionBody') as string) || ''
  const rawVisionTitle = (formData.get('visionTitle') as string) || 'Our Vision'
  const rawVisionBody = (formData.get('visionBody') as string) || ''
  const rawCalloutText = (formData.get('calloutText') as string) || ''
  const rawCalloutVariant =
    formData.get('calloutVariant') === 'warning' ? 'warning' : 'info'
  const rawSeoTitle = formData.get('seoTitle')
  const rawSeoDescription = formData.get('seoDescription')
  const rawOgImageUrl = formData.get('ogImageUrl')
  const rawCanonicalUrl = formData.get('canonicalUrl')

  // Build RichText blocks for Mission & Vision
  const contentBlocks = buildMissionVisionBlocks({
    missionTitle: rawMissionTitle,
    missionBody: rawMissionBody,
    visionTitle: rawVisionTitle,
    visionBody: rawVisionBody,
    calloutText: rawCalloutText,
    calloutVariant: rawCalloutVariant,
  })

  // Validate payload against schema
  const validation = validatePageDocumentInput({
    title: rawTitle,
    summary: rawSummary,
    content: contentBlocks,
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

  // Retrieve current document to get version
  const { data: existingDoc, error: fetchError } = await supabase
    .from('page_documents')
    .select('id, version')
    .eq('slug', 'mission-and-vision')
    .maybeSingle()

  if (fetchError) {
    logger.error('Failed to query existing page document', {
      error: fetchError.message,
      slug: 'mission-and-vision',
    })
    return {
      success: false,
      message: 'Database query error while checking page document.',
    }
  }

  const currentVersion = existingDoc?.version ?? 0
  const nextVersion = currentVersion + 1
  const now = new Date().toISOString()

  const documentData = {
    slug: 'mission-and-vision',
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
    logger.error('Failed to mutate page document in database', {
      error: mutationError.message,
      slug: 'mission-and-vision',
      userId: session.profile.id,
    })
    return {
      success: false,
      message: `Failed to save changes: ${mutationError.message}`,
    }
  }

  logger.info('Page document updated successfully', {
    slug: 'mission-and-vision',
    status: targetStatus,
    version: nextVersion,
    userId: session.profile.id,
    intent,
  })

  // Revalidate ISR cache for public pages and admin view
  revalidatePath('/mission-and-vision')
  revalidatePath('/admin/pages/mission-and-vision')
  revalidatePath('/sitemap.xml')

  return {
    success: true,
    message: successMessage,
    status: targetStatus,
    version: nextVersion,
    updatedAt: now,
  }
}
