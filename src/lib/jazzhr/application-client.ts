import 'server-only'

import type { CareerJob, CareerQuestion } from '@/lib/jazzhr/types'
import { JazzHrApiError } from '@/lib/jazzhr/client'
import type { CareerApplicationInput } from '@/lib/jazzhr/application-validation'
import { sanitizeResumeFilename } from '@/lib/jazzhr/application-validation'

const JAZZHR_API_BASE_URL = 'https://api.resumatorapi.com/v1'
const WRITE_TIMEOUT_MS = 15_000

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

function findIdentifier(payload: unknown, keys: string[]): string | null {
  if (typeof payload === 'string') {
    const value = payload.trim().replace(/^"|"$/g, '')
    return value || null
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
    if (typeof record[key] === 'string' && record[key].trim()) {
      return record[key].trim()
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
): Promise<{ location: string | null; payload: unknown }> {
  const endpoint = new URL(`${JAZZHR_API_BASE_URL}/${resource}`)
  endpoint.searchParams.set('apikey', apiKey)

  let response: Response
  try {
    response = await fetch(endpoint, {
      body: new URLSearchParams(fields),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      method: 'POST',
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
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

export async function submitApplicationToJazzHr(
  job: CareerJob,
  questions: CareerQuestion[],
  application: CareerApplicationInput,
): Promise<JazzHrWriteResult> {
  const apiKey = process.env.JAZZHR_API_KEY?.trim()
  if (!apiKey) throw new JazzHrApiError('JazzHR is not configured.')

  const applicantResponse = await postJazzHr(apiKey, 'applicants', {
    apply_date: applicationDate(),
    coverletter: application.coverLetter,
    email: application.email,
    first_name: application.firstName,
    last_name: application.lastName,
    phone: application.phone,
    source: 'OPG Website',
  })

  let applicantId = findIdentifier(applicantResponse.payload, [
    'id',
    'applicant_id',
  ])
  if (!applicantId && applicantResponse.location) {
    applicantId =
      applicantResponse.location.split('/').filter(Boolean).pop() || null
  }
  if (!applicantId) {
    throw new JazzHrApiError(
      'JazzHR created the candidate but did not return an applicant ID.',
    )
  }

  try {
    const resumeData = Buffer.from(
      await application.resume.arrayBuffer(),
    ).toString('base64')
    await postJazzHr(apiKey, 'files', {
      applicant_id: applicantId,
      file_data: resumeData,
      file_privacy: '0',
      filename: sanitizeResumeFilename(application.resume.name),
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
