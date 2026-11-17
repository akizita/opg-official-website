'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canArchive, canPublish } from '@/lib/auth/permissions'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type TestimonialReviewDecision = 'approved' | 'rejected'
export type TestimonialReviewResult = {
  success: boolean
  error?: string
}

export type CreateCandidateTestimonialInput = {
  author_name: string
  quote: string
  role_title?: string | null
  profile_photo_data?: string | null
  rating?: number
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function reviewCandidateTestimonialAction(
  id: string,
  decision: TestimonialReviewDecision,
): Promise<TestimonialReviewResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return { success: false, error: 'You do not have review permission.' }
  }
  if (!UUID_PATTERN.test(id) || !['approved', 'rejected'].includes(decision)) {
    return { success: false, error: 'Invalid review request.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('review_candidate_testimonial', {
    p_id: id,
    p_decision: decision,
  })

  if (error) {
    console.error('Could not review candidate testimonial:', error.message)
    return {
      success: false,
      error: 'The review could not be saved. Try again.',
    }
  }
  if (data !== true) {
    return {
      success: false,
      error: 'This submission has already been reviewed. Refresh the page.',
    }
  }

  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')
  revalidatePath('/testimonials')
  return { success: true }
}

export async function deleteCandidateTestimonialAction(
  id: string,
): Promise<TestimonialReviewResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canArchive(profile.roleKey)) {
    return { success: false, error: 'You do not have delete permission.' }
  }
  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid testimonial.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('delete_candidate_testimonial', {
    p_id: id,
  })

  if (error) {
    console.error('Could not delete candidate testimonial:', error.message)
    return {
      success: false,
      error: 'The testimonial could not be deleted. Try again.',
    }
  }
  if (data !== true) {
    return {
      success: false,
      error: 'This testimonial was already removed. Refresh the page.',
    }
  }

  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')
  revalidatePath('/testimonials')
  return { success: true }
}

export async function deleteCandidateTestimonialsAction(
  ids: string[],
): Promise<{ deletedIds: string[]; error?: string }> {
  const { profile } = await requireAdminSession({ requireAal2: true })
  if (!canArchive(profile.roleKey)) {
    return { deletedIds: [], error: 'You do not have delete permission.' }
  }
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 20 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))
  ) {
    return { deletedIds: [], error: 'Invalid testimonial selection.' }
  }

  const supabase = await createClient()
  const results = await Promise.allSettled(
    ids.map((id) => supabase.rpc('delete_candidate_testimonial', { p_id: id })),
  )
  const deletedIds = ids.filter((_, index) => {
    const result = results[index]
    if (result.status === 'rejected') {
      console.error('Could not delete candidate testimonial:', result.reason)
      return false
    }
    if (result.value.error) {
      console.error(
        'Could not delete candidate testimonial:',
        result.value.error.message,
      )
    }
    return !result.value.error && result.value.data === true
  })

  if (deletedIds.length > 0) {
    revalidatePath('/admin/testimonials')
    revalidatePath('/admin')
    revalidatePath('/testimonials')
  }
  return deletedIds.length === ids.length
    ? { deletedIds }
    : {
        deletedIds,
        error:
          deletedIds.length > 0
            ? `Deleted ${deletedIds.length} of ${ids.length} testimonials. Refresh and retry the rest.`
            : 'The selected testimonials could not be deleted. Refresh and try again.',
      }
}

export async function createCandidateTestimonialAction(
  input: CreateCandidateTestimonialInput,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to create candidate testimonials.',
    }
  }

  const author_name = input.author_name?.trim() || ''
  const quote = input.quote?.trim() || ''
  const role_title = input.role_title?.trim() || null
  const rating =
    typeof input.rating === 'number' &&
    Number.isInteger(input.rating) &&
    input.rating >= 1 &&
    input.rating <= 5
      ? input.rating
      : 5

  if (author_name.length < 2 || author_name.length > 100) {
    return {
      success: false,
      error: 'Candidate name must be between 2 and 100 characters.',
    }
  }

  if (quote.length < 20 || quote.length > 1200) {
    return {
      success: false,
      error: 'Story quote must be between 20 and 1,200 characters.',
    }
  }

  if (role_title && role_title.length > 120) {
    return {
      success: false,
      error: 'Role title must be 120 characters or fewer.',
    }
  }

  let photoData: string | null = null
  if (input.profile_photo_data && typeof input.profile_photo_data === 'string') {
    const trimmedPhoto = input.profile_photo_data.trim()
    if (trimmedPhoto.startsWith('data:image/')) {
      const commaIndex = trimmedPhoto.indexOf(',')
      photoData =
        commaIndex >= 0 ? trimmedPhoto.slice(commaIndex + 1) : trimmedPhoto
    } else {
      photoData = trimmedPhoto
    }
  }

  const now = new Date().toISOString()
  const randomSuffix = crypto.randomUUID()
  const fallbackEmail = `admin-manual-${randomSuffix.slice(0, 8)}@candidate.opg.internal`

  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  const insertPayload: Record<string, unknown> = {
    author_name,
    quote,
    role_title,
    rating,
    relationship: 'past',
    email: fallbackEmail,
    publication_consent: true,
    submission_fingerprint: `admin-import-${randomSuffix}`,
    status: 'approved',
    published_at: now,
    reviewed_at: now,
    reviewed_by: profile.id || null,
  }

  if (photoData) {
    insertPayload.profile_photo_data = photoData
  }

  const { data, error } = await supabase
    .from('candidate_testimonials')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) {
    console.error('Could not create candidate testimonial:', error.message)
    return {
      success: false,
      error: 'Could not save the candidate testimonial. Try again.',
    }
  }

  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')
  revalidatePath('/testimonials')

  return { success: true, id: (data as { id: string } | null)?.id }
}
