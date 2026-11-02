'use client'

import {
  ArrowRight01Icon,
  Briefcase01Icon,
  Building03Icon,
  Cancel01Icon,
  Location01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/ui/empty-state'
import type { CareerJob } from '@/lib/jazzhr/types'

type CareerOpeningsExplorerProps = {
  applyLabel: string
  detailsLabel: string
  emptyMessage: string
  emptyTitle: string
  jobs: CareerJob[]
}

function optionValues(
  jobs: CareerJob[],
  read: (job: CareerJob) => string | null,
): string[] {
  return [
    ...new Set(
      jobs.map(read).filter((value): value is string => Boolean(value)),
    ),
  ].sort((left, right) => left.localeCompare(right))
}

function workArrangementLabel(value: CareerJob['workArrangement']): string {
  if (value === 'onsite') return 'On-site'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function CareerOpeningsExplorer({
  applyLabel,
  detailsLabel,
  emptyMessage,
  emptyTitle,
  jobs,
}: CareerOpeningsExplorerProps) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [workArrangement, setWorkArrangement] = useState('')

  const departments = useMemo(
    () => optionValues(jobs, (job) => job.department),
    [jobs],
  )
  const locations = useMemo(
    () => optionValues(jobs, (job) => job.location),
    [jobs],
  )
  const employmentTypes = useMemo(
    () => optionValues(jobs, (job) => job.employmentTypeLabel),
    [jobs],
  )
  const workArrangements = useMemo(
    () =>
      optionValues(jobs, (job) =>
        job.workArrangement === 'unspecified'
          ? null
          : workArrangementLabel(job.workArrangement),
      ),
    [jobs],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const searchable = [
          job.title,
          job.department,
          job.location,
          job.employmentTypeLabel,
          job.summary,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (!department || job.department === department) &&
          (!location || job.location === location) &&
          (!employmentType || job.employmentTypeLabel === employmentType) &&
          (!workArrangement ||
            workArrangementLabel(job.workArrangement) === workArrangement)
        )
      }),
    [
      department,
      employmentType,
      jobs,
      location,
      normalizedQuery,
      workArrangement,
    ],
  )

  const hasFilters = Boolean(
    query || department || location || employmentType || workArrangement,
  )

  function clearFilters() {
    setQuery('')
    setDepartment('')
    setLocation('')
    setEmploymentType('')
    setWorkArrangement('')
  }

  if (jobs.length === 0) {
    return <EmptyState message={emptyMessage} title={emptyTitle} />
  }

  return (
    <div className="careers-explorer">
      <div className="careers-filter-panel" aria-label="Filter open roles">
        <div className="careers-filter-panel__top">
          <div className="careers-search-field">
            <HugeiconsIcon aria-hidden="true" icon={Search01Icon} size={19} />
            <label className="sr-only" htmlFor="career-search">
              Search open roles
            </label>
            <input
              autoComplete="off"
              id="career-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roles, teams, or locations"
              type="search"
              value={query}
            />
          </div>

          <div className="careers-filter-summary">
            <p aria-live="polite">
              <strong>{filteredJobs.length}</strong>{' '}
              {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} type="button">
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  size={16}
                />
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="careers-filter-grid">
          {departments.length > 1 ? (
            <label>
              <span>Department</span>
              <select
                onChange={(event) => setDepartment(event.target.value)}
                value={department}
              >
                <option value="">All departments</option>
                {departments.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {locations.length > 1 ? (
            <label>
              <span>Location</span>
              <select
                onChange={(event) => setLocation(event.target.value)}
                value={location}
              >
                <option value="">All locations</option>
                {locations.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {employmentTypes.length > 1 ? (
            <label>
              <span>Employment type</span>
              <select
                onChange={(event) => setEmploymentType(event.target.value)}
                value={employmentType}
              >
                <option value="">All employment types</option>
                {employmentTypes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {workArrangements.length > 1 ? (
            <label>
              <span>Work arrangement</span>
              <select
                onChange={(event) => setWorkArrangement(event.target.value)}
                value={workArrangement}
              >
                <option value="">All arrangements</option>
                {workArrangements.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

      </div>

      {filteredJobs.length === 0 ? (
        <EmptyState
          action={
            <button
              className="button button--secondary"
              onClick={clearFilters}
              type="button"
            >
              Clear all filters
            </button>
          }
          description="Try a different keyword or clear one of the filters above."
          title="No matching roles"
        />
      ) : (
        <div className="job-openings-list">
          {filteredJobs.map((job) => (
            <article className="job-opening-card" key={job.id}>
              <div className="job-opening-card__main">
                <div className="job-opening-card__badges">
                  {job.department ? (
                    <span className="job-badge job-badge--dept">
                      {job.department}
                    </span>
                  ) : null}
                  {job.workArrangement !== 'unspecified' ? (
                    <span className="job-badge job-badge--arrangement">
                      {workArrangementLabel(job.workArrangement)}
                    </span>
                  ) : null}
                  <span className="job-badge job-badge--type">
                    {job.employmentTypeLabel}
                  </span>
                </div>

                <h3 className="job-opening-card__title">
                  <Link href={`/careers/${job.slug}`}>{job.title}</Link>
                </h3>

                <div className="job-opening-card__meta">
                  <span>
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={Location01Icon}
                      size={17}
                    />
                    {job.location}
                  </span>
                  {job.department ? (
                    <span>
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={Building03Icon}
                        size={17}
                      />
                      {job.department}
                    </span>
                  ) : null}
                  <span>
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={Briefcase01Icon}
                      size={17}
                    />
                    {job.employmentTypeLabel}
                  </span>
                </div>

                {job.summary ? (
                  <p className="job-opening-card__summary">{job.summary}</p>
                ) : null}
              </div>

              <div className="job-opening-card__actions">
                <Link
                  className="button-link button-link--primary"
                  href={`/careers/${job.slug}`}
                >
                  {detailsLabel}
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowRight01Icon}
                    size={18}
                  />
                </Link>
                <Link className="job-opening-card__apply" href={job.applyPath}>
                  {applyLabel.replace(/↗/g, '').trim()}
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ArrowRight01Icon}
                    size={17}
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
