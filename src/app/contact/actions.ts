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

  const textField = (name: string) => {
    const value = formData.get(name)
    return typeof value === 'string' ? value : ''
  }
  const fullName = textField('fullName')
  const email = textField('email')
  const subject = textField('subject')
  const message = textField('message')
  const intent: InquiryIntent =
    textField('intent') === 'talent' ? 'talent' : 'client'
  const privacyConsent =
    formData.get('privacyConsent') === 'on' ||
    formData.get('privacyConsent') === 'true'
  const honeypot = textField('website') || textField('honeypot')
  const elapsedSecondsRaw = textField('elapsedSeconds')
  const elapsedSeconds = elapsedSecondsRaw
    ? Number(elapsedSecondsRaw)
    : undefined
  const turnstileToken =
    textField('cf-turnstile-response') || textField('turnstileToken')

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
