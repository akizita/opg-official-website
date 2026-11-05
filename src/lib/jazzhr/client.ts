import 'server-only'

import { cache } from 'react'

import {
  isJazzHrRecord,
  normalizeJazzHrJob,
  normalizeJazzHrQuestion,
} from '@/lib/jazzhr/normalize'
import type { CareerJob, CareerQuestion, CareersFeed } from '@/lib/jazzhr/types'

const JAZZHR_API_BASE_URL = 'https://api.resumatorapi.com/v1'
const JAZZHR_PAGE_SIZE = 100
const JAZZHR_MAX_PAGES = 25

const TALENT_POOL_JOB_IDS = [
  'job_20251203043549_1EKIK1MUNLB7HIHQ', // Loan Associate (Pooling)
  'job_20251203223256_4SVMCPDQS2ZVFLDC', // Loan Settlement Officer (Pooling)
  'job_20251203232902_2PLJFVRKRVTKDYLG', // Senior Loan Associate - Parabroker (Pooling)
] as const

export class JazzHrApiError extends Error {
  status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'JazzHrApiError'
    this.status = status
  }
}

function extractRows(payload: unknown, resource: string): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') {
    throw new JazzHrApiError(`JazzHR returned an invalid ${resource} payload.`)
  }

  const object = payload as Record<string, unknown>
  for (const key of ['results', 'jobs', 'questions', 'data', 'value']) {
    if (Array.isArray(object[key])) return object[key]
  }

  // Handle single record object returned by JazzHR when matching count is 1
  if (typeof object.id === 'string' && object.id.trim()) {
    return [object]
  }

  // Handle dictionary of records { [id]: { id, ... } }
  const values = Object.values(object)
  if (
    values.length > 0 &&
    values.every((v) => v && typeof v === 'object' && 'id' in (v as object))
  ) {
    return values
  }

  // Handle empty object {} returned by JazzHR when 0 records match
  if (Object.keys(object).length === 0) {
    return []
  }

  throw new JazzHrApiError(
    `JazzHR returned an unrecognized ${resource} payload.`,
  )
}

async function fetchJazzHrJobById(
  apiKey: string,
  id: string,
): Promise<unknown | null> {
  const endpoint = new URL(
    `${JAZZHR_API_BASE_URL}/jobs/${encodeURIComponent(id)}`,
  )
  endpoint.searchParams.set('apikey', apiKey)

  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function fetchJazzHrPage(
  apiKey: string,
  page: number,
): Promise<unknown[]> {
  const endpoint = new URL(
    `${JAZZHR_API_BASE_URL}/jobs/status/open/confidential/false/private/false/page/${page}`,
  )
  endpoint.searchParams.set('apikey', apiKey)

  let response: Response
  try {
    response = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
  } catch (error) {
    throw new JazzHrApiError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'JazzHR did not respond before the request timed out.'
        : 'JazzHR could not be reached.',
    )
  }

  if (!response.ok) {
    throw new JazzHrApiError(
      `JazzHR jobs request failed with status ${response.status}.`,
      response.status,
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new JazzHrApiError('JazzHR returned a non-JSON jobs response.')
  }

  return extractRows(payload, 'jobs')
}

async function fetchAllJazzHrJobs(apiKey: string): Promise<CareerJob[]> {
  const jobs = new Map<string, CareerJob>()

  for (let page = 1; page <= JAZZHR_MAX_PAGES; page += 1) {
    const rows = await fetchJazzHrPage(apiKey, page)

    for (const row of rows) {
      if (!isJazzHrRecord(row)) continue
      const job = normalizeJazzHrJob(row)
      if (job) jobs.set(job.id, job)
    }

    if (rows.length < JAZZHR_PAGE_SIZE) break
    if (page === JAZZHR_MAX_PAGES) {
      throw new JazzHrApiError(
        'JazzHR pagination exceeded the configured safety limit.',
      )
    }
  }

  // Ensure active talent pooling opportunities are accessible for candidates
  for (const poolId of TALENT_POOL_JOB_IDS) {
    if (!jobs.has(poolId)) {
      const raw = await fetchJazzHrJobById(apiKey, poolId)
      if (isJazzHrRecord(raw)) {
        const job = normalizeJazzHrJob(raw, { allowPooling: true })
        if (job) jobs.set(job.id, job)
      }
    }
  }

  return [...jobs.values()].sort((left, right) => {
    const leftDate = left.publishedAt ? Date.parse(left.publishedAt) : 0
    const rightDate = right.publishedAt ? Date.parse(right.publishedAt) : 0
    return rightDate - leftDate || left.title.localeCompare(right.title)
  })
}

async function fetchQuestionnaireQuestions(
  apiKey: string,
  questionnaireId: string,
): Promise<CareerQuestion[]> {
  const endpoint = new URL(
    `${JAZZHR_API_BASE_URL}/questionnaire_questions/questionnaire_id/${encodeURIComponent(questionnaireId)}/question_status/1`,
  )
  endpoint.searchParams.set('apikey', apiKey)

  let response: Response
  try {
    response = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
  } catch (error) {
    throw new JazzHrApiError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'JazzHR did not return the application questions in time.'
        : 'JazzHR application questions could not be reached.',
    )
  }

  if (!response.ok) {
    throw new JazzHrApiError(
      `JazzHR questionnaire request failed with status ${response.status}.`,
      response.status,
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new JazzHrApiError(
      'JazzHR returned a non-JSON questionnaire response.',
    )
  }

  const questions: CareerQuestion[] = []
  for (const row of extractRows(payload, 'questionnaire')) {
    if (!isJazzHrRecord(row)) continue
    const question = normalizeJazzHrQuestion(row)
    if (!question) {
      throw new JazzHrApiError(
        'A JazzHR application question uses an unsupported configuration.',
      )
    }
    questions.push(question)
  }

  return questions.sort((left, right) => left.order - right.order)
}

export const getCareersFeed = cache(async (): Promise<CareersFeed> => {
  const apiKey = process.env.JAZZHR_API_KEY?.trim()
  if (!apiKey) {
    return { configured: false, fetchedAt: null, jobs: [] }
  }

  try {
    const jobs = await fetchAllJazzHrJobs(apiKey)
    return {
      configured: true,
      fetchedAt: new Date().toISOString(),
      jobs,
    }
  } catch {
    return {
      configured: true,
      fetchedAt: null,
      jobs: [],
    }
  }
})

export async function getCareerJobBySlug(
  slug: string,
): Promise<CareerJob | null> {
  const { jobs } = await getCareersFeed()
  const exact = jobs.find((job) => job.slug === slug)
  if (exact) return exact

  const code = slug.split('-')[0]
  return (
    jobs.find((job) => job.boardCode.toLowerCase() === code?.toLowerCase()) ||
    null
  )
}

export const getCareerQuestions = cache(
  async (job: CareerJob): Promise<CareerQuestion[]> => {
    if (!job.questionnaireId) return []

    const apiKey = process.env.JAZZHR_API_KEY?.trim()
    if (!apiKey) {
      throw new JazzHrApiError('JazzHR is not configured.')
    }

    return fetchQuestionnaireQuestions(apiKey, job.questionnaireId)
  },
)
