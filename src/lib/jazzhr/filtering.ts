import type { CareerJob } from '@/lib/jazzhr/types'

export type CareerFilters = {
  department: string
  employmentType: string
  location: string
  query: string
  workArrangement: string
}

export const EMPTY_CAREER_FILTERS: CareerFilters = {
  department: '',
  employmentType: '',
  location: '',
  query: '',
  workArrangement: '',
}

export function workArrangementLabel(
  value: CareerJob['workArrangement'],
): string {
  if (value === 'onsite') return 'On-site'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function searchableText(job: CareerJob): string {
  return [
    job.title,
    job.department,
    job.location,
    job.employmentTypeLabel,
    job.summary,
    job.compensation?.currency,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
}

export function filterCareerJobs(
  jobs: readonly CareerJob[],
  filters: CareerFilters,
): CareerJob[] {
  const query = filters.query.trim().toLocaleLowerCase()

  return jobs.filter(
    (job) =>
      (!query || searchableText(job).includes(query)) &&
      (!filters.department || job.department === filters.department) &&
      (!filters.location || job.location === filters.location) &&
      (!filters.employmentType ||
        job.employmentTypeLabel === filters.employmentType) &&
      (!filters.workArrangement ||
        workArrangementLabel(job.workArrangement) === filters.workArrangement),
  )
}

export function careerFiltersFromSearchParams(
  params: Pick<URLSearchParams, 'get'>,
): CareerFilters {
  return {
    department: params.get('department') || '',
    employmentType: params.get('type') || '',
    location: params.get('location') || '',
    query: params.get('q') || '',
    workArrangement: params.get('arrangement') || '',
  }
}

export function careerFiltersToSearchParams(
  filters: CareerFilters,
  current?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(current)
  const values: Array<[keyof CareerFilters, string]> = [
    ['query', 'q'],
    ['department', 'department'],
    ['location', 'location'],
    ['employmentType', 'type'],
    ['workArrangement', 'arrangement'],
  ]

  for (const [filterKey, parameterKey] of values) {
    const value = filters[filterKey].trim()
    if (value) params.set(parameterKey, value)
    else params.delete(parameterKey)
  }

  return params
}
