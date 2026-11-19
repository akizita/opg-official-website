import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  getCareerJobBySlug,
  getCareerQuestions,
  getCareersFeed,
  resolveJazzHrApiKey,
} from '@/lib/jazzhr/client'

describe('multi-account JazzHR client integration', () => {
  const originalOffshoreKey = process.env.JAZZHR_API_KEY
  const originalOnshoreKey = process.env.JAZZHR_FPI_API_KEY

  beforeEach(() => {
    vi.restoreAllMocks()
    delete process.env.JAZZHR_API_KEY
    delete process.env.JAZZHR_FPI_API_KEY
  })

  afterEach(() => {
    if (originalOffshoreKey === undefined) delete process.env.JAZZHR_API_KEY
    else process.env.JAZZHR_API_KEY = originalOffshoreKey

    if (originalOnshoreKey === undefined) delete process.env.JAZZHR_FPI_API_KEY
    else process.env.JAZZHR_FPI_API_KEY = originalOnshoreKey
  })

  it('resolves the matching API key for offshore and onshore roles', () => {
    process.env.JAZZHR_API_KEY = 'offshore-secret'
    process.env.JAZZHR_FPI_API_KEY = 'onshore-secret'

    expect(resolveJazzHrApiKey({ account: 'offshore' })).toBe(
      'offshore-secret',
    )
    expect(resolveJazzHrApiKey({ account: 'onshore' })).toBe('onshore-secret')
    expect(resolveJazzHrApiKey()).toBe('offshore-secret')
  })

  it('returns configured: false when neither JazzHR API key is set', async () => {
    const feed = await getCareersFeed()
    expect(feed).toEqual({
      configured: false,
      fetchedAt: null,
      jobs: [],
    })
  })

  it('fetches, tags, and merges open jobs from both Offshore and Onshore accounts', async () => {
    process.env.JAZZHR_API_KEY = 'offshore-key'
    process.env.JAZZHR_FPI_API_KEY = 'onshore-key'

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = new URL(String(input))
        const apiKey = url.searchParams.get('apikey')

        if (apiKey === 'offshore-key') {
          return new Response(
            JSON.stringify([
              {
                board_code: 'OFF01',
                city: 'Manila',
                country_id: 'Philippines',
                id: 'job_offshore_1',
                original_open_date: '2026-11-10',
                status: 'Open',
                title: 'Offshore Operations Coordinator',
              },
              {
                board_code: 'TEST01',
                id: 'job_offshore_test',
                status: 'Open',
                title: 'Testing',
              },
            ]),
            { status: 200 },
          )
        }

        if (apiKey === 'onshore-key') {
          return new Response(
            JSON.stringify([
              {
                board_code: 'FPI01',
                city: 'Sydney',
                country_id: 'Australia',
                id: 'job_onshore_1',
                original_open_date: '2026-11-18',
                questionnaire: 'q_onshore_99',
                status: 'Open',
                title: 'Onshore Property Strategist',
              },
            ]),
            { status: 200 },
          )
        }

        return new Response('Unauthorized', { status: 401 })
      })

    const feed = await getCareersFeed()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(feed.configured).toBe(true)
    expect(feed.jobs).toHaveLength(2)
    expect(feed.jobs.map((job) => `${job.account}:${job.title}`)).toEqual([
      'onshore:Onshore Property Strategist',
      'offshore:Offshore Operations Coordinator',
    ])

    const resolvedJob = await getCareerJobBySlug('FPI01-onshore-property-strategist')
    expect(resolvedJob?.account).toBe('onshore')
  })

  it('keeps working if one JazzHR account temporarily fails', async () => {
    process.env.JAZZHR_API_KEY = 'offshore-key'
    process.env.JAZZHR_FPI_API_KEY = 'onshore-key'

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input))
      if (url.searchParams.get('apikey') === 'offshore-key') {
        return new Response('Server error', { status: 500 })
      }
      return new Response(
        JSON.stringify([
          {
            board_code: 'FPI02',
            city: 'Melbourne',
            country_id: 'Australia',
            id: 'job_onshore_2',
            original_open_date: '2026-11-19',
            status: 'Open',
            title: 'Senior Investment Advisor',
          },
        ]),
        { status: 200 },
      )
    })

    const feed = await getCareersFeed()
    expect(feed.configured).toBe(true)
    expect(feed.fetchedAt).not.toBeNull()
    expect(feed.jobs).toHaveLength(1)
    expect(feed.jobs[0].account).toBe('onshore')
  })

  it('queries questionnaire questions using the API key for the job account', async () => {
    process.env.JAZZHR_API_KEY = 'offshore-key'
    process.env.JAZZHR_FPI_API_KEY = 'onshore-key'

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            question_format: 'Text Field',
            question_mandatory: 'Yes',
            question_order: '1',
            question_text: 'Are you eligible to work in Australia?',
          },
        ]),
        { status: 200 },
      ),
    )

    const questions = await getCareerQuestions({
      account: 'onshore',
      applyPath: '/careers/FPI01-role/apply',
      boardCode: 'FPI01',
      city: 'Sydney',
      compensation: null,
      country: 'Australia',
      department: null,
      descriptionText: 'Role details',
      employmentType: 'full_time',
      employmentTypeLabel: 'Full Time',
      id: 'job_onshore_1',
      location: 'Sydney, Australia',
      minimumExperience: null,
      publishedAt: '2026-11-18T00:00:00.000Z',
      questionnaireId: 'q_onshore_99',
      slug: 'FPI01-role',
      state: null,
      summary: null,
      title: 'Onshore Property Strategist',
      workArrangement: 'onsite',
    })

    expect(questions).toHaveLength(1)
    const calledUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]))
    expect(calledUrl.searchParams.get('apikey')).toBe('onshore-key')
  })
})
