import 'server-only'

import { cache } from 'react'

import {
  isJazzHrRecord,
  normalizeJazzHrJob,
  normalizeJazzHrQuestion,
} from '@/lib/jazzhr/normalize'
import type {
  CareerJob,
  CareerQuestion,
  CareersFeed,
  JazzHrAccountKey,
} from '@/lib/jazzhr/types'

const JAZZHR_API_BASE_URL = 'https://api.resumatorapi.com/v1'
const JAZZHR_PAGE_SIZE = 100
const JAZZHR_MAX_PAGES = 25
const JAZZHR_FETCH_TIMEOUT_MS = 10_000
const JAZZHR_RETRY_DELAY_MS = 250
const JAZZHR_FALLBACK_TTL_MS = 10 * 60 * 1000

const fallbackFeedByAccounts = new Map<
  string,
  { cachedAtMs: number; feed: CareersFeed }
>()

type JazzHrAccountConfig = {
  apiKey: string
  key: JazzHrAccountKey
}

function getConfiguredJazzHrAccounts(): JazzHrAccountConfig[] {
  const accounts: JazzHrAccountConfig[] = []
  const offshoreKey = process.env.JAZZHR_API_KEY?.trim()
  if (offshoreKey) {
    accounts.push({ apiKey: offshoreKey, key: 'offshore' })
  }

  const onshoreKey = process.env.JAZZHR_FPI_API_KEY?.trim()
  if (onshoreKey && onshoreKey !== offshoreKey) {
    accounts.push({ apiKey: onshoreKey, key: 'onshore' })
  }

  return accounts
}

export function resolveJazzHrApiKey(
  job?: Pick<CareerJob, 'account'>,
): string | null {
  if (job?.account === 'onshore') {
    return process.env.JAZZHR_FPI_API_KEY?.trim() || null
  }
  if (job?.account === 'offshore') {
    return process.env.JAZZHR_API_KEY?.trim() || null
  }
  return (
    process.env.JAZZHR_API_KEY?.trim() ||
    process.env.JAZZHR_FPI_API_KEY?.trim() ||
    null
  )
}

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableJazzHrStatus(status: number): boolean {
  return status === 429 || status >= 500
}

async function fetchJazzHrPageOnce(
  endpoint: URL,
): Promise<unknown[]> {
  let response: Response
  try {
    response = await fetch(endpoint, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(JAZZHR_FETCH_TIMEOUT_MS),
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

async function fetchJazzHrPage(
  apiKey: string,
  page: number,
): Promise<unknown[]> {
  const endpoint = new URL(
    `${JAZZHR_API_BASE_URL}/jobs/status/open/page/${page}`,
  )
  endpoint.searchParams.set('apikey', apiKey)

  try {
    return await fetchJazzHrPageOnce(endpoint)
  } catch (error) {
    const canRetry =
      error instanceof JazzHrApiError &&
      (error.status === null || isRetryableJazzHrStatus(error.status))
    if (!canRetry) throw error
    await delay(JAZZHR_RETRY_DELAY_MS)
    return fetchJazzHrPageOnce(endpoint)
  }
}

async function fetchAllJazzHrJobs(
  account: JazzHrAccountConfig,
): Promise<CareerJob[]> {
  const jobs = new Map<string, CareerJob>()

  for (let page = 1; page <= JAZZHR_MAX_PAGES; page += 1) {
    const rows = await fetchJazzHrPage(account.apiKey, page)

    for (const row of rows) {
      if (!isJazzHrRecord(row)) continue
      const job = normalizeJazzHrJob(row, { account: account.key })
      if (job) jobs.set(job.id, job)
    }

    if (rows.length < JAZZHR_PAGE_SIZE) break
    if (page === JAZZHR_MAX_PAGES) {
      throw new JazzHrApiError(
        'JazzHR pagination exceeded the configured safety limit.',
      )
    }
  }

  return [...jobs.values()]
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
  const accounts = getConfiguredJazzHrAccounts()
  if (accounts.length === 0) {
    return { configured: false, fetchedAt: null, jobs: [] }
  }

  const accountsCacheKey = accounts
    .map((account) => `${account.key}:${account.apiKey}`)
    .sort()
    .join('|')

  const results = await Promise.allSettled(
    accounts.map((account) => fetchAllJazzHrJobs(account)),
  )

  const mergedJobs = new Map<string, CareerJob>()
  let anySucceeded = false

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    anySucceeded = true
    for (const job of result.value) {
      const dedupeKey = `${job.account || 'offshore'}:${job.id}`
      mergedJobs.set(dedupeKey, job)
    }
  }

  if (!anySucceeded) {
    const cachedFallback = fallbackFeedByAccounts.get(accountsCacheKey)
    if (
      cachedFallback &&
      Date.now() - cachedFallback.cachedAtMs <= JAZZHR_FALLBACK_TTL_MS
    ) {
      return cachedFallback.feed
    }

    return {
      configured: true,
      fetchedAt: null,
      jobs: [],
    }
  }

  const jobs = [...mergedJobs.values()].sort((left, right) => {
    const leftDate = left.publishedAt ? Date.parse(left.publishedAt) : 0
    const rightDate = right.publishedAt ? Date.parse(right.publishedAt) : 0
    return rightDate - leftDate || left.title.localeCompare(right.title)
  })

  const feed: CareersFeed = {
    configured: true,
    fetchedAt: new Date().toISOString(),
    jobs,
  }

  if (jobs.length > 0) {
    fallbackFeedByAccounts.set(accountsCacheKey, {
      cachedAtMs: Date.now(),
      feed,
    })
  }

  return feed
})

export async function getCareerJobBySlug(
  slug: string,
): Promise<CareerJob | null> {
  let normalizedSlug = slug.trim()
  try {
    normalizedSlug = decodeURIComponent(normalizedSlug).trim()
  } catch {
    // Keep original trimmed slug if percent-encoding is malformed
  }
  if (!normalizedSlug) return null

  const { jobs } = await getCareersFeed()
  const exact = jobs.find((job) => job.slug === normalizedSlug)
  if (exact) return exact

  const lowerSlug = normalizedSlug.toLowerCase()
  const caseInsensitiveExact = jobs.find(
    (job) => job.slug.toLowerCase() === lowerSlug,
  )
  if (caseInsensitiveExact) return caseInsensitiveExact

  const byBoardPrefix = jobs.find((job) => {
    const lowerBoardCode = job.boardCode.toLowerCase()
    return (
      lowerSlug === lowerBoardCode ||
      lowerSlug.startsWith(`${lowerBoardCode}-`)
    )
  })
  if (byBoardPrefix) return byBoardPrefix

  const code = lowerSlug.split('-')[0]
  return (
    jobs.find((job) => job.boardCode.toLowerCase() === code) || null
  )
}

export const getCareerQuestions = cache(
  async (job: CareerJob): Promise<CareerQuestion[]> => {
    if (!job.questionnaireId) return []

    const apiKey = resolveJazzHrApiKey(job)
    if (!apiKey) {
      throw new JazzHrApiError('JazzHR is not configured.')
    }

    return fetchQuestionnaireQuestions(apiKey, job.questionnaireId)
  },
)
