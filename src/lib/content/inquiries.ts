import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createPrivilegedClient } from '@/lib/supabase/server'

export type InquiryIntent = 'client' | 'talent'

export type ContactInquiry = {
  id: string
  full_name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived' | 'spam_suspected'
  ip_hash: string
  assigned_to: string | null
  submitted_at: string
  retention_expires_at: string
}

export type InquirySubmissionInput = {
  fullName: string
  email: string
  subject: string
  message: string
  intent?: InquiryIntent
  privacyConsent: boolean
  honeypot?: string
  elapsedSeconds?: number
  turnstileToken?: string
}

export type SubmissionResult = {
  success: boolean
  referenceId?: string
  errors?: Record<string, string>
}

const MAX_STORED_SUBJECT_LENGTH = 120

function subjectPrefix(intent: InquiryIntent): string {
  return intent === 'talent' ? '[Talent] ' : '[Client] '
}

// Best-effort per-instance throttling; Turnstile provides the primary bot check.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function hashValue(val: string): string {
  return createHash('sha256').update(val.toLowerCase().trim()).digest('hex')
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()

  // In local development or test, allow test bypass if key is not configured
  if (!secretKey) {
    return { success: true }
  }

  if (!token) {
    return { success: false, error: 'Verification token is required' }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      },
    )

    const outcome = (await response.json()) as {
      success: boolean
      'error-codes'?: string[]
    }
    if (!outcome.success) {
      return {
        success: false,
        error:
          'Bot verification challenge failed. Please refresh and try again.',
      }
    }

    return { success: true }
  } catch {
    // Fail closed in production if verification endpoint cannot be reached
    return {
      success: false,
      error: 'Unable to verify challenge at this time. Please try again later.',
    }
  }
}

export function validateInquiryInput(input: unknown): {
  data: InquirySubmissionInput | null
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  if (!input || typeof input !== 'object') {
    return { data: null, errors: { form: 'Invalid submission payload' } }
  }

  const raw = input as Record<string, unknown>
  const fullName = typeof raw.fullName === 'string' ? raw.fullName.trim() : ''
  const email =
    typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : ''
  const subject = typeof raw.subject === 'string' ? raw.subject.trim() : ''
  const message = typeof raw.message === 'string' ? raw.message.trim() : ''
  const privacyConsent = Boolean(raw.privacyConsent)
  const honeypot = typeof raw.honeypot === 'string' ? raw.honeypot.trim() : ''
  const elapsedSeconds =
    typeof raw.elapsedSeconds === 'number' ? raw.elapsedSeconds : undefined
  const turnstileToken =
    typeof raw.turnstileToken === 'string'
      ? raw.turnstileToken.trim()
      : undefined
  const intent: InquiryIntent = raw.intent === 'talent' ? 'talent' : 'client'
  const maxSubjectLength = MAX_STORED_SUBJECT_LENGTH - subjectPrefix(intent).length

  // Honeypot trap check
  if (honeypot) {
    errors.form = 'Unable to submit this form. Please try again.'
  }

  // Time trap: human takes at least 2 seconds
  if (
    elapsedSeconds === undefined ||
    !Number.isFinite(elapsedSeconds) ||
    elapsedSeconds < 2
  ) {
    errors.form = 'Please take a moment to complete the form and try again.'
  }

  // Payload size safety
  if (JSON.stringify(input).length > 10240) {
    errors.form = 'Payload exceeds 10 KB limit'
  }

  // Name: 2-100 characters
  if (!fullName || fullName.length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters)'
  } else if (fullName.length > 100) {
    errors.fullName = 'Full name must be 100 characters or fewer'
  }

  // Email: valid email, max 254 chars
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address'
  } else if (email.length > 254) {
    errors.email = 'Email must be 254 characters or fewer'
  }

  // The stored subject includes its inquiry-category prefix.
  if (!subject || subject.length < 2) {
    errors.subject = 'Please enter a subject (at least 2 characters)'
  } else if (subject.length > maxSubjectLength) {
    errors.subject = `Subject must be ${maxSubjectLength} characters or fewer`
  }

  // Message: 20-5,000 characters
  if (!message || message.length < 20) {
    errors.message =
      'Please provide details in your message (at least 20 characters)'
  } else if (message.length > 5000) {
    errors.message = 'Message must be 5,000 characters or fewer'
  }

  if (!privacyConsent) {
    errors.privacyConsent = 'You must acknowledge the Privacy Notice to submit'
  }

  return {
    data:
      Object.keys(errors).length === 0
        ? {
            fullName,
            email,
            subject,
            message,
            intent,
            privacyConsent,
            honeypot,
            elapsedSeconds,
            turnstileToken,
          }
        : null,
    errors,
  }
}

export function checkRateLimits(
  ip: string,
  email: string,
): { allowed: boolean; error?: string } {
  const now = Date.now()
  const ipKey = `ip:${hashValue(ip)}`
  const emailKey = `email:${hashValue(email)}`

  // IP Rate Limit: 10 per 10 minutes
  const ipRecord = rateLimitStore.get(ipKey)
  if (ipRecord && ipRecord.resetAt > now) {
    if (ipRecord.count >= 10) {
      return {
        allowed: false,
        error:
          'Too many requests from your network. Please try again in 10 minutes.',
      }
    }
    ipRecord.count += 1
  } else {
    rateLimitStore.set(ipKey, { count: 1, resetAt: now + 600000 })
  }

  // Email Rate Limit: 3 per hour
  const emailRecord = rateLimitStore.get(emailKey)
  if (emailRecord && emailRecord.resetAt > now) {
    if (emailRecord.count >= 3) {
      return {
        allowed: false,
        error:
          'You have submitted multiple inquiries recently. We will respond shortly.',
      }
    }
    emailRecord.count += 1
  } else {
    rateLimitStore.set(emailKey, { count: 1, resetAt: now + 3600000 })
  }

  return { allowed: true }
}

export async function submitContactInquiry(
  input: InquirySubmissionInput,
  options?: {
    clientIp?: string
    client?: SupabaseClient
  },
): Promise<SubmissionResult> {
  const validation = validateInquiryInput(input)
  if (!validation.data) {
    return { success: false, errors: validation.errors }
  }

  const clientIp = options?.clientIp || '127.0.0.1'

  // Rate Limiting
  const rateLimit = checkRateLimits(clientIp, validation.data.email)
  if (!rateLimit.allowed) {
    return {
      success: false,
      errors: { form: rateLimit.error || 'Rate limit exceeded' },
    }
  }

  // Turnstile Verification
  const turnstile = await verifyTurnstileToken(
    validation.data.turnstileToken,
    clientIp,
  )
  if (!turnstile.success) {
    return {
      success: false,
      errors: { form: turnstile.error || 'Challenge verification failed' },
    }
  }

  // Anonymous clients cannot insert into the protected inquiries or outbox tables.
  const supabase = options?.client ?? createPrivilegedClient()
  if (!supabase) {
    console.error('Contact submissions require SUPABASE_SECRET_KEY.')
    return {
      success: false,
      errors: {
        form: 'The contact form is temporarily unavailable. Please use an email address listed on this page.',
      },
    }
  }
  const ipHash = hashValue(clientIp)

  // Insert into contact_inquiries
  const { data: inquiry, error: inquiryError } = await supabase
    .from('contact_inquiries')
    .insert({
      full_name: validation.data.fullName,
      email: validation.data.email,
      subject: `${subjectPrefix(validation.data.intent ?? 'client')}${validation.data.subject}`,
      message: validation.data.message,
      status: 'new',
      ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (inquiryError || !inquiry) {
    console.error('Could not save contact inquiry:', inquiryError?.message)
    return {
      success: false,
      errors: {
        form: 'Unable to process your inquiry at this moment. Please try again shortly.',
      },
    }
  }

  const referenceId = `OPG-${inquiry.id.slice(0, 8).toUpperCase()}`

  // Queue Notification Outbox entry
  try {
    const { error: notificationError } = await supabase
      .from('notification_outbox')
      .insert({
        idempotency_key: `inquiry-${inquiry.id}`,
        recipient:
          validation.data.intent === 'talent'
            ? 'recruitment@opglobal.com.hk'
            : 'inquiries@opglobal.com.hk',
        template: 'new_inquiry',
        payload: {
          inquiryId: inquiry.id,
          referenceId,
          intent: validation.data.intent,
          fullName: validation.data.fullName,
          subject: validation.data.subject,
        },
        status: 'queued',
      })
    if (notificationError) {
      console.error(
        'Could not queue contact inquiry notification:',
        notificationError.message,
      )
    }
  } catch (error) {
    console.error('Could not queue contact inquiry notification:', error)
  }

  return {
    success: true,
    referenceId,
  }
}
