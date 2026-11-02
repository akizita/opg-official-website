'use server'

import { headers } from 'next/headers'

import { hashValue, verifyTurnstileToken } from '@/lib/content/inquiries'
import {
  applicationReference,
  JazzHrSubmissionError,
  submitApplicationToJazzHr,
} from '@/lib/jazzhr/application-client'
import {
  hasValidResumeSignature,
  validateCareerApplication,
} from '@/lib/jazzhr/application-validation'
import {
  getCareerJobBySlug,
  getCareerQuestions,
  JazzHrApiError,
} from '@/lib/jazzhr/client'
import { logger } from '@/lib/logger'

export type CareerApplicationActionState = {
  errors?: Record<string, string>
  referenceId?: string
  success: boolean
}

const applicationRateLimits = new Map<
  string,
  { count: number; resetAt: number }
>()

function allowApplicationAttempt(
  key: string,
  maximum: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  const current = applicationRateLimits.get(key)
  if (current && current.resetAt > now) {
    if (current.count >= maximum) return false
    current.count += 1
  } else {
    applicationRateLimits.set(key, { count: 1, resetAt: now + windowMs })
  }
  return true
}

function textField(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function submitCareerApplicationAction(
  slug: string,
  formData: FormData,
): Promise<CareerApplicationActionState> {
  const job = await getCareerJobBySlug(slug)
  if (!job) {
    return {
      errors: { form: 'This role is no longer accepting applications.' },
      success: false,
    }
  }

  let questions
  try {
    questions = await getCareerQuestions(job)
  } catch (error) {
    logger.error('Could not load JazzHR questions during application', {
      error,
      jobId: job.id,
    })
    return {
      errors: {
        form: 'The application form could not be verified. Please try again shortly.',
      },
      success: false,
    }
  }

  const answers: Record<string, string> = {}
  for (const question of questions) {
    const values = formData
      .getAll(question.fieldName)
      .filter((value): value is string => typeof value === 'string')
    answers[question.fieldName] =
      question.format === 'checkbox' ? values.join('|') : values[0] || ''
  }

  const validation = validateCareerApplication(
    {
      answers,
      coverLetter: textField(formData, 'coverLetter'),
      elapsedSeconds: textField(formData, 'elapsedSeconds'),
      email: textField(formData, 'email'),
      firstName: textField(formData, 'firstName'),
      honeypot: textField(formData, 'website'),
      lastName: textField(formData, 'lastName'),
      phone: textField(formData, 'phone'),
      privacyConsent:
        formData.get('privacyConsent') === 'on' ||
        formData.get('privacyConsent') === 'true',
      resume: formData.get('resume'),
    },
    questions,
  )
  if (!validation.data) {
    return { errors: validation.errors, success: false }
  }

  if (!(await hasValidResumeSignature(validation.data.resume))) {
    return {
      errors: {
        resume:
          'The file contents do not match the selected résumé format. Please attach a valid file.',
      },
      success: false,
    }
  }

  const headerList = await headers()
  const clientIp =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    '127.0.0.1'

  if (
    !allowApplicationAttempt(`ip:${hashValue(clientIp)}`, 5, 10 * 60 * 1000)
  ) {
    return {
      errors: {
        form: 'Too many recent application attempts. Please wait before trying again.',
      },
      success: false,
    }
  }

  const turnstileConfigured = Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  )
  if (process.env.NODE_ENV === 'production' && !turnstileConfigured) {
    logger.error('Career application Turnstile is not configured')
    return {
      errors: {
        form: 'Applications are temporarily unavailable. Please contact recruitment@opglobal.com.hk.',
      },
      success: false,
    }
  }

  const turnstile = await verifyTurnstileToken(
    textField(formData, 'cf-turnstile-response') ||
      textField(formData, 'turnstileToken') ||
      undefined,
    clientIp,
  )
  if (!turnstile.success) {
    return {
      errors: {
        form: turnstile.error || 'Challenge verification failed.',
      },
      success: false,
    }
  }

  if (
    !allowApplicationAttempt(
      `email:${hashValue(validation.data.email)}`,
      2,
      60 * 60 * 1000,
    )
  ) {
    return {
      errors: {
        form: 'This email has reached the recent application limit. Please wait before trying again.',
      },
      success: false,
    }
  }

  try {
    const result = await submitApplicationToJazzHr(
      job,
      questions,
      validation.data,
    )
    return {
      referenceId: applicationReference(result.applicantId),
      success: true,
    }
  } catch (error) {
    if (error instanceof JazzHrSubmissionError) {
      const referenceId = applicationReference(error.applicantId)
      logger.error('JazzHR application was only partially completed', {
        error,
        jobId: job.id,
        referenceId,
      })
      return {
        errors: {
          form: `We created your candidate record but could not finalize the application. Do not resubmit. Email recruitment@opglobal.com.hk with reference ${referenceId}.`,
        },
        referenceId,
        success: false,
      }
    }

    logger.error('JazzHR application submission failed', {
      error,
      jobId: job.id,
      status: error instanceof JazzHrApiError ? error.status : null,
    })
    return {
      errors: {
        form: 'We could not submit your application. No application was completed; please try again shortly.',
      },
      success: false,
    }
  }
}
