import 'server-only'

import type { CareerJob, CareerQuestion } from '@/lib/jazzhr/types'
import { JazzHrApiError, resolveJazzHrApiKey } from '@/lib/jazzhr/client'
import type { CareerApplicationInput } from '@/lib/jazzhr/application-validation'
import {
  PDF_INLINE_PREVIEW_MAX_BYTES,
  sanitizeResumeFilename,
} from '@/lib/jazzhr/application-validation'
import { extractResumePlainText } from '@/lib/jazzhr/resume-text'
import { logger } from '@/lib/logger'

const JAZZHR_API_BASE_URL = 'https://api.resumatorapi.com/v1'
const BASE64_APPLICANT_TIMEOUT_MS = 30_000
const WRITE_TIMEOUT_MS = 60_000
// JazzHR's /v1/applicants base64-resume parser rejects payloads above ~5 MB raw
// (~6.7 MB base64). Larger files attach cleanly through /v1/files after creation.
const BASE64_APPLICANT_MAX_BYTES = PDF_INLINE_PREVIEW_MAX_BYTES

type JazzHrWriteResult = {
  applicantId: string
}

export class JazzHrSubmissionError extends Error {
  applicantId: string

  constructor(applicantId: string, cause: unknown) {
    super('JazzHR could not finalize the application.', { cause })
    this.name = 'JazzHrSubmissionError'
    this.applicantId = applicantId
  }
}

const VALID_IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{3,128}$/
const JAZZHR_ERROR_TEXT_PATTERN =
  /^(?:error\b|failed\b|invalid\b|unable to\b|cannot\b|<[!a-z])|(?:\bwas not set\b|\bdoes not exist\b|\bunauthorized\b|\bforbidden\b|\bnot allowed\b|\btoo large\b|\bexceeds\b|\brejected\b)/i

function isValidIdentifier(value: string): boolean {
  return VALID_IDENTIFIER_PATTERN.test(value)
}

function extractJazzHrError(payload: unknown): string | null {
  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (!trimmed) return null
    return JAZZHR_ERROR_TEXT_PATTERN.test(trimmed) ? trimmed : null
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const error = extractJazzHrError(item)
      if (error) return error
    }
    return null
  }
  if (!payload || typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>
  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error.trim()
  }
  if (Array.isArray(record.errors) && record.errors.length > 0) {
    return record.errors.map(String).join('; ')
  }
  const normalizedStatus =
    typeof record.status === 'string' ? record.status.trim().toLowerCase() : ''
  if (normalizedStatus === 'error' || record.success === false) {
    return typeof record.message === 'string' && record.message.trim()
      ? record.message.trim()
      : 'JazzHR rejected the request.'
  }
  return null
}

function findIdentifier(payload: unknown, keys: string[]): string | null {
  if (typeof payload === 'string') {
    const value = payload.trim().replace(/^"|"$/g, '')
    return isValidIdentifier(value) ? value : null
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const id = findIdentifier(item, keys)
      if (id) return id
    }
    return null
  }
  if (!payload || typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>
  for (const key of keys) {
    if (typeof record[key] === 'string') {
      const candidate = record[key].trim()
      if (isValidIdentifier(candidate)) return candidate
    }
  }
  for (const key of ['data', 'result', 'results', 'applicant']) {
    if (record[key] !== undefined) {
      const id = findIdentifier(record[key], keys)
      if (id) return id
    }
  }
  return null
}

async function postJazzHr(
  apiKey: string,
  resource: string,
  fields: Record<string, string>,
  timeoutMs = WRITE_TIMEOUT_MS,
): Promise<{ location: string | null; payload: unknown }> {
  const endpoint = new URL(`${JAZZHR_API_BASE_URL}/${resource}`)
  endpoint.searchParams.set('apikey', apiKey)

  let response: Response
  try {
    response = await fetch(endpoint, {
      body: JSON.stringify(fields),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw new JazzHrApiError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'JazzHR did not accept the application before the request timed out.'
        : 'JazzHR could not be reached while submitting the application.',
    )
  }

  if (!response.ok) {
    throw new JazzHrApiError(
      `JazzHR ${resource} request failed with status ${response.status}.`,
      response.status,
    )
  }

  const responseText = await response.text()
  let payload: unknown = responseText
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      // Some legacy JazzHR write endpoints return the created ID as plain text.
    }
  }

  const apiError = extractJazzHrError(payload)
  if (apiError) {
    throw new JazzHrApiError(
      `JazzHR ${resource} rejected the request: ${apiError}`,
    )
  }

  return { location: response.headers.get('location'), payload }
}

function applicationDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function referenceFromApplicantId(applicantId: string): string {
  const suffix = applicantId.replace(/[^a-z0-9]/gi, '').slice(-10)
  return `OPG-${suffix.toUpperCase()}`
}

export function applicationReference(applicantId: string): string {
  return referenceFromApplicantId(applicantId)
}

function formatSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function createApplicantRecord(
  apiKey: string,
  fields: Record<string, string>,
  timeoutMs = WRITE_TIMEOUT_MS,
): Promise<string> {
  const response = await postJazzHr(apiKey, 'applicants', fields, timeoutMs)
  let applicantId = findIdentifier(response.payload, [
    'id',
    'prospect_id',
    'applicant_id',
  ])
  if (!applicantId && response.location) {
    applicantId = response.location.split('/').filter(Boolean).pop() || null
  }
  if (!applicantId) {
    throw new JazzHrApiError(
      'JazzHR created the candidate but did not return an applicant ID.',
    )
  }
  return applicantId
}

export async function submitApplicationToJazzHr(
  job: CareerJob,
  questions: CareerQuestion[],
  application: CareerApplicationInput,
): Promise<JazzHrWriteResult> {
  const apiKey = resolveJazzHrApiKey(job)
  if (!apiKey) throw new JazzHrApiError('JazzHR is not configured.')

  const safeFilename = sanitizeResumeFilename(application.resume.name)
  const isPdfResume =
    safeFilename.toLowerCase().endsWith('.pdf') ||
    application.resume.type.toLowerCase() === 'application/pdf'
  const resumeBuffer = Buffer.from(await application.resume.arrayBuffer())
  const resumeData = resumeBuffer.toString('base64')
  const extractedText = await extractResumePlainText(resumeBuffer, safeFilename)
  const fallbackResumeText =
    extractedText ||
    `Résumé file attached: ${safeFilename} (${formatSizeLabel(application.resume.size)}). View or download the full document under the Documents tab.`

  const baseApplicantFields: Record<string, string> = {
    apply_date: applicationDate(),
    coverletter: application.coverLetter,
    email: application.email,
    first_name: application.firstName,
    last_name: application.lastName,
    phone: application.phone,
    source: 'OPG Website',
  }

  const location = application.location?.trim()
  const linkedin = application.linkedinUrl?.trim()
  const website = application.websiteUrl?.trim()
  if (location) baseApplicantFields.address = location
  if (linkedin) baseApplicantFields.linkedin = linkedin
  if (website) baseApplicantFields.website = website

  let applicantId: string
  if (
    (isPdfResume || !extractedText) &&
    resumeBuffer.byteLength <= BASE64_APPLICANT_MAX_BYTES
  ) {
    try {
      // Send base64-resume so JazzHR ingests and displays the original PDF
      // inside its candidate Resume viewer (matching native applytojob uploads).
      applicantId = await createApplicantRecord(
        apiKey,
        {
          ...baseApplicantFields,
          'base64-resume': resumeData,
        },
        BASE64_APPLICANT_TIMEOUT_MS,
      )
    } catch (error) {
      // If JazzHR's /applicants parser rejects, times out, or omits an ID on
      // base64-resume, create the candidate with resumetext and attach via /files.
      logger.warn('JazzHR /applicants base64-resume fallback triggered', {
        fileSizeBytes: resumeBuffer.byteLength,
        message: error instanceof Error ? error.message : String(error),
      })
      applicantId = await createApplicantRecord(apiKey, {
        ...baseApplicantFields,
        resumetext: fallbackResumeText,
      })
    }
  } else {
    applicantId = await createApplicantRecord(apiKey, {
      ...baseApplicantFields,
      resumetext: fallbackResumeText,
    })
  }

  try {
    await postJazzHr(apiKey, 'files', {
      applicant_id: applicantId,
      file_data: resumeData,
      file_privacy: '0',
      filename: safeFilename,
    })

    // Associate the applicant only after JazzHR accepts the résumé. JazzHR's
    // questionnaire endpoint expects the resulting applicant/job relationship.
    await postJazzHr(apiKey, 'applicants2jobs', {
      applicant_id: applicantId,
      job_id: job.id,
      submission_date: applicationDate(),
    })

    if (job.questionnaireId && questions.length > 0) {
      const answerFields: Record<string, string> = {
        applicant_id: applicantId,
        job_id: job.id,
        questionnaire_id: job.questionnaireId,
      }
      for (const question of questions) {
        answerFields[
          `answer_value_${String(question.order).padStart(2, '0')}`
        ] = application.answers[question.fieldName] || ''
      }
      await postJazzHr(apiKey, 'questionnaire_answers', answerFields)
    }
  } catch (error) {
    throw new JazzHrSubmissionError(applicantId, error)
  }

  return { applicantId }
}
