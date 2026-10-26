'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canPublish } from '@/lib/auth/permissions'
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
