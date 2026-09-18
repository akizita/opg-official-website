'use server'

import { headers } from 'next/headers'

import {
  type InquiryIntent,
  type SubmissionResult,
  submitContactInquiry,
} from '@/lib/content/inquiries'

export type ContactActionState = {
  success: boolean
  referenceId?: string
  errors?: Record<string, string>
}

export async function submitContactAction(
  formData: FormData,
): Promise<ContactActionState> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  const realIp = headerList.get('x-real-ip')
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'

  const fullName = String(formData.get('fullName') || '')
  const email = String(formData.get('email') || '')
  const subject = String(formData.get('subject') || '')
  const message = String(formData.get('message') || '')
  const intent = (formData.get('intent') as InquiryIntent) || 'client'
  const privacyConsent =
    formData.get('privacyConsent') === 'on' ||
    formData.get('privacyConsent') === 'true'
  const honeypot = String(
    formData.get('website') || formData.get('honeypot') || '',
  )
  const elapsedSecondsRaw = formData.get('elapsedSeconds')
  const elapsedSeconds = elapsedSecondsRaw
    ? Number(elapsedSecondsRaw)
    : undefined
  const turnstileToken = String(formData.get('turnstileToken') || '')

  const result: SubmissionResult = await submitContactInquiry(
    {
      fullName,
      email,
      subject,
      message,
      intent,
      privacyConsent,
      honeypot,
      elapsedSeconds,
      turnstileToken: turnstileToken || undefined,
    },
    { clientIp },
  )

  return result
}
