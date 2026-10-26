'use server'

import { headers } from 'next/headers'

import {
  type CandidateTestimonialResult,
  submitCandidateTestimonial,
} from '@/lib/content/candidate-testimonials'

export async function submitCandidateTestimonialAction(
  formData: FormData,
): Promise<CandidateTestimonialResult> {
  const headerList = await headers()
  const clientIp =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'

  return submitCandidateTestimonial(
    {
      authorName: formData.get('authorName'),
      email: formData.get('email'),
      relationship: formData.get('relationship'),
      roleTitle: formData.get('roleTitle'),
      rating: formData.get('rating'),
      quote: formData.get('quote'),
      publicationConsent: formData.get('publicationConsent') === 'on',
      honeypot: formData.get('website'),
      elapsedSeconds: Number(formData.get('elapsedSeconds')),
      turnstileToken: formData.get('cf-turnstile-response'),
    },
    clientIp,
  )
}
