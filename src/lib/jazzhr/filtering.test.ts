import { describe, expect, it } from 'vitest'

import {
  careerFiltersFromSearchParams,
  careerFiltersToSearchParams,
  filterCareerJobs,
  workArrangementLabel,
} from '@/lib/jazzhr/filtering'
import type { CareerJob } from '@/lib/jazzhr/types'

const sampleJobs: CareerJob[] = [
  {
    applyPath: '/careers/ABC-full-stack/apply',
    boardCode: 'ABC',
    city: 'Manila',
    compensation: {
      currency: 'PHP',
      maximum: 60000,
      minimum: 40000,
      payPeriod: 'month',
      variesByExperience: false,
    },
    country: 'Philippines',
    department: 'Engineering',
    descriptionText: 'Build high-performance web applications.',
    employmentType: 'full_time',
    employmentTypeLabel: 'Full Time',
    id: 'job-1',
    location: 'Remote, Philippines',
    minimumExperience: '3 years',
    publishedAt: '2026-10-01',
    questionnaireId: null,
    slug: 'ABC-full-stack',
    state: null,
    summary: 'Build high-performance web applications.',
    title: 'Senior Full Stack Engineer',
    workArrangement: 'remote',
  },
  {
    applyPath: '/careers/DEF-accountant/apply',
    boardCode: 'DEF',
    city: 'Sydney',
    compensation: {
      currency: 'USD',
      maximum: 2500,
      minimum: 2000,
      payPeriod: 'month',
      variesByExperience: true,
    },
    country: 'Australia',
    department: 'Finance',
    descriptionText: 'Manage financial reports and reconciliations.',
    employmentType: 'contract',
    employmentTypeLabel: 'Contract',
    id: 'job-2',
    location: 'Sydney, Australia',
    minimumExperience: '2 years',
    publishedAt: '2026-10-10',
    questionnaireId: null,
    slug: 'DEF-accountant',
    state: null,
    summary: 'Manage financial reporting.',
    title: 'Financial Accountant',
    workArrangement: 'hybrid',
  },
]

describe('career filtering & search params', () => {
  it('filters by query string matching title or department', () => {
    const results = filterCareerJobs(sampleJobs, {
      department: '',
      employmentType: '',
      location: '',
      query: 'engineer',
      workArrangement: '',
    })
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Senior Full Stack Engineer')
  })

  it('filters by department', () => {
    const results = filterCareerJobs(sampleJobs, {
      department: 'Finance',
      employmentType: '',
      location: '',
      query: '',
      workArrangement: '',
    })
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Financial Accountant')
  })

  it('filters by work arrangement', () => {
    const remoteResults = filterCareerJobs(sampleJobs, {
      department: '',
      employmentType: '',
      location: '',
      query: '',
      workArrangement: 'Remote',
    })
    expect(remoteResults).toHaveLength(1)
    expect(remoteResults[0].workArrangement).toBe('remote')
  })

  it('serializes and deserializes URL search params correctly', () => {
    const params = careerFiltersToSearchParams({
      department: 'Engineering',
      employmentType: 'Full Time',
      location: '',
      query: 'developer',
      workArrangement: 'Remote',
    })

    expect(params.get('q')).toBe('developer')
    expect(params.get('department')).toBe('Engineering')
    expect(params.get('type')).toBe('Full Time')
    expect(params.get('arrangement')).toBe('Remote')
    expect(params.has('location')).toBe(false)

    const parsed = careerFiltersFromSearchParams(params)
    expect(parsed.query).toBe('developer')
    expect(parsed.department).toBe('Engineering')
    expect(parsed.employmentType).toBe('Full Time')
    expect(parsed.workArrangement).toBe('Remote')
    expect(parsed.location).toBe('')
  })

  it('formats work arrangement labels correctly', () => {
    expect(workArrangementLabel('remote')).toBe('Remote')
    expect(workArrangementLabel('hybrid')).toBe('Hybrid')
    expect(workArrangementLabel('onsite')).toBe('On-site')
  })
})
