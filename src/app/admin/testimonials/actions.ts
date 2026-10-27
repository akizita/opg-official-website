'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canArchive, canPublish } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export type TestimonialReviewDecision = 'approved' | 'rejected'
export type TestimonialReviewResult = {
  success: boolean
  error?: string
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
