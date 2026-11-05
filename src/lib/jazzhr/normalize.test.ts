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
    expect(normalizeJazzHrJob({ ...base, status: 'Filled' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, status: 'Cancelled' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, status: 'Drafting' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, status: '' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, closed: 'Yes' })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, closed: true })).toBeNull()
    expect(normalizeJazzHrJob({ ...base, close_date: '2020-01-01' })).toBeNull()
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

  it('normalizes various compensation patterns and formats them consistently', async () => {
    const { formatCareerCompensation, parseCareerCompensation } =
      await import('@/lib/jazzhr/normalize')

    // Pattern 1: Php with range and per month
    const comp1 = parseCareerCompensation(
      'Service Fee: Php 35,000 - Php 45,000 per month',
    )
    expect(comp1).toEqual({
      currency: 'PHP',
      minimum: 35000,
      maximum: 45000,
      payPeriod: 'month',
      variesByExperience: false,
    })
    expect(formatCareerCompensation(comp1!)).toBe('₱35,000–₱45,000 / month')

    // Pattern 2: USD range with /mo and depending on experience
    const comp2 = parseCareerCompensation(
      'Salary: $1,200 - $1,800 USD / mo (Depending on experience)',
    )
    expect(comp2).toEqual({
      currency: 'USD',
      minimum: 1200,
      maximum: 1800,
      payPeriod: 'month',
      variesByExperience: true,
    })
    expect(formatCareerCompensation(comp2!)).toBe(
      '$1,200–$1,800 / month · Depending on experience',
    )

    // Pattern 3: Awkward "Benefits: • Service Fee: Php 35,000"
    const comp3 = parseCareerCompensation('Benefits: • Service Fee: Php 35,000')
    expect(comp3?.currency).toBe('PHP')
    expect(comp3?.minimum).toBe(35000)
    expect(comp3?.payPeriod).toBe('month')
  })

  it('cleans awkward "Benefits: • Service Fee:" and removes empty Benefits labels', () => {
    const job = normalizeJazzHrJob({
      board_code: 'Clean123',
      id: 'job_clean',
      status: 'Open',
      title: 'QA Specialist',
      department: 'General', // Should be normalized away as generic
      description:
        '<p>Benefits: • Service Fee: Php 40,000</p><p>About the role: Test features.</p>',
    })

    expect(job).not.toBeNull()
    expect(job?.department).toBeNull() // "General" stripped
    expect(job?.descriptionText).not.toContain('Benefits: • Service Fee:')
    expect(job?.descriptionText).toContain('Compensation:')
    expect(job?.compensation?.minimum).toBe(40000)
  })
})
