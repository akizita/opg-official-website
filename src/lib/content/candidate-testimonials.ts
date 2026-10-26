import type { SupabaseClient } from '@supabase/supabase-js'

import {
  checkRateLimits,
  hashValue,
  verifyTurnstileToken,
} from '@/lib/content/inquiries'
import { createStaticClient } from '@/lib/supabase/server'

export type CandidateTestimonial = {
  id: string
  author_name: string
  relationship: 'prospective' | 'past'
  role_title: string | null
  rating: number | null
  quote: string
  published_at: string
}

export type CandidateTestimonialInput = {
  authorName: string
  email: string
  relationship: 'prospective' | 'past'
  roleTitle: string
  rating: number
  quote: string
  publicationConsent: boolean
  honeypot?: string
  elapsedSeconds?: number
  turnstileToken?: string
}

export type CandidateTestimonialResult = {
  success: boolean
  errors?: Record<string, string>
}

export function validateCandidateTestimonialInput(raw: unknown): {
  data: CandidateTestimonialInput | null
  errors: Record<string, string>
} {
  if (!raw || typeof raw !== 'object') {
    return { data: null, errors: { form: 'Invalid submission.' } }
  }
  const value = raw as Record<string, unknown>
  const authorName =
    typeof value.authorName === 'string' ? value.authorName.trim() : ''
  const email =
    typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
  const roleTitle =
    typeof value.roleTitle === 'string' ? value.roleTitle.trim() : ''
  const quote = typeof value.quote === 'string' ? value.quote.trim() : ''
  const rating = Number(value.rating)
  const relationship = value.relationship
  const errors: Record<string, string> = {}

  if (JSON.stringify(value).length > 5000)
    errors.form = 'The submission is too large.'
  if (authorName.length < 2 || authorName.length > 100)
    errors.authorName = 'Enter a name between 2 and 100 characters.'
  if (
    email.length > 254 ||
    !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
  )
    errors.email = 'Enter a valid email address.'
  if (relationship !== 'prospective' && relationship !== 'past')
    errors.relationship = 'Select your connection with OPG.'
  if (roleTitle.length > 120)
    errors.roleTitle = 'Role or field must be 120 characters or fewer.'
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    errors.rating = 'Choose a rating from 1 to 5 stars.'
  if (quote.length < 20 || quote.length > 1200)
    errors.quote = 'Your story must be between 20 and 1,200 characters.'
  if (value.publicationConsent !== true)
    errors.publicationConsent = 'Consent is required to share your story.'
  if (value.honeypot) errors.form = 'Unable to submit this form.'
  if (
    typeof value.elapsedSeconds !== 'number' ||
    !Number.isFinite(value.elapsedSeconds) ||
    value.elapsedSeconds < 2
  )
    errors.form = 'Please take a moment to complete the form and try again.'

  return {
    data:
      Object.keys(errors).length === 0
        ? {
            authorName,
            email,
            relationship: relationship as 'prospective' | 'past',
            roleTitle,
            rating,
            quote,
            publicationConsent: true,
            turnstileToken:
              typeof value.turnstileToken === 'string'
                ? value.turnstileToken
                : undefined,
          }
        : null,
    errors,
  }
}

export async function getApprovedCandidateTestimonials(
  client: SupabaseClient = createStaticClient(),
): Promise<CandidateTestimonial[]> {
  let { data, error } = await client.rpc(
    'get_approved_candidate_testimonials_with_rating',
  )
  if (error?.code === 'PGRST202') {
    ;({ data, error } = await client.rpc('get_approved_candidate_testimonials'))
  }
  if (error) {
    console.error(
      'Could not load approved candidate testimonials:',
      error.message,
    )
    return []
  }
  return ((data ?? []) as CandidateTestimonial[]).map((story) => ({
    ...story,
    rating: story.rating ?? null,
  }))
}

export async function submitCandidateTestimonial(
  raw: unknown,
  clientIp: string,
  client: SupabaseClient = createStaticClient(),
): Promise<CandidateTestimonialResult> {
  const validation = validateCandidateTestimonialInput(raw)
  if (!validation.data) return { success: false, errors: validation.errors }

  const limit = checkRateLimits(clientIp, validation.data.email)
  if (!limit.allowed)
    return {
      success: false,
      errors: { form: limit.error ?? 'Try again later.' },
    }

  const challenge = await verifyTurnstileToken(
    validation.data.turnstileToken,
    clientIp,
  )
  if (!challenge.success)
    return {
      success: false,
      errors: { form: challenge.error ?? 'Verification failed.' },
    }

  const entry = validation.data
  const { error } = await client
    .from('candidate_testimonials')
    .insert({
      author_name: entry.authorName,
      email: entry.email,
      relationship: entry.relationship,
      role_title: entry.roleTitle || null,
      rating: entry.rating,
      quote: entry.quote,
      publication_consent: true,
      submission_fingerprint: hashValue(`${entry.email}:${entry.quote}`),
    })

  if (error?.code === 'P0001') {
    return {
      success: false,
      errors: {
        form: 'You have submitted several stories recently. Please try again later.',
      },
    }
  }

  if (error && error.code !== '23505') {
    console.error('Could not submit candidate testimonial:', error.message)
    return {
      success: false,
      errors: {
        form: 'We could not submit your story. Please try again later.',
      },
    }
  }

  return { success: true }
}
