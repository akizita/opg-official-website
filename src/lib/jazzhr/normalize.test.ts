import { describe, expect, it } from 'vitest'

import {
  jazzHrHtmlToText,
  normalizeJazzHrJob,
  normalizeJazzHrQuestion,
  slugifyCareerTitle,
} from '@/lib/jazzhr/normalize'

describe('JazzHR job normalization', () => {
  it('maps a public open JazzHR job into the website model', () => {
    const job = normalizeJazzHrJob({
      board_code: 'AbC123xyZ9',
      city: 'Remote',
      country_id: 'Philippines',
      department: 'Investment Lending',
      description:
        '<h2>About the role</h2><p>Support a global lending team.</p><ul><li>Own client requests</li><li>Work across time zones</li></ul>',
      id: 'job_123',
      original_open_date: '2026-10-21',
      questionnaire: 'questionnaire_123',
      status: 'Open',
      title: 'Loan Associate (Pooling)',
      type: 'Full Time',
    })

    expect(job).not.toBeNull()
    expect(job).toMatchObject({
      applyPath: '/careers/AbC123xyZ9-loan-associate-pooling/apply',
      department: 'Investment Lending',
      employmentType: 'full_time',
      location: 'Remote, Philippines',
      questionnaireId: 'questionnaire_123',
      slug: 'AbC123xyZ9-loan-associate-pooling',
      workArrangement: 'remote',
    })
    expect(job?.descriptionText).toContain('• Own client requests')
  })

  it('rejects closed, private, confidential, and incomplete jobs', () => {
    const base = {
      board_code: 'Public1234',
      id: 'job_123',
      status: 'Open',
      title: 'Operations Coordinator',
    }

    expect(normalizeJazzHrJob({ ...base, status: 'Closed' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, private: 'Yes' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, confidential: true })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, board_code: '' })).toBeNull()
  })

  it('converts JazzHR HTML to inert readable text', () => {
    const value = jazzHrHtmlToText(
      '<script>alert("no")</script><p>Hello&nbsp;<strong>team</strong>.</p><li>First</li>',
    )

    expect(value).toBe('Hello team.\n\n• First')
    expect(value).not.toContain('<script>')
    expect(value).not.toContain('alert')
  })

  it('creates stable readable title slugs', () => {
    expect(slugifyCareerTitle('Paid Media & Data Analyst — PH')).toBe(
      'paid-media-and-data-analyst-ph',
    )
  })

  it('normalizes JazzHR questionnaire fields and answer choices', () => {
    expect(
      normalizeJazzHrQuestion({
        question_answers: 'Yes\r\nNo',
        question_format: 'Drop-down Menu',
        question_mandatory: 'Yes',
        question_order: '3',
        question_text: 'Are you available?',
      }),
    ).toEqual({
      fieldName: 'question_03',
      format: 'select',
      label: 'Are you available?',
      mandatory: true,
      maxLength: null,
      options: ['Yes', 'No'],
      order: 3,
    })
  })
})
