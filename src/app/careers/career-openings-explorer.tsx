'use client'

import {
  ArrowRight01Icon,
  Briefcase01Icon,
  Cancel01Icon,
  Location01Icon,
  Money01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { EmptyState } from '@/components/ui/empty-state'
import {
  EMPTY_CAREER_FILTERS,
  careerFiltersFromSearchParams,
  careerFiltersToSearchParams,
  filterCareerJobs,
  workArrangementLabel,
  type CareerFilters,
} from '@/lib/jazzhr/filtering'
import { formatCareerCompensation } from '@/lib/jazzhr/normalize'
import type { CareerJob } from '@/lib/jazzhr/types'

import styles from './careers.module.css'

type CareerOpeningsExplorerProps = {
  applyLabel: string
  detailsLabel: string
  emptyMessage: string
  emptyTitle: string
  jobs: CareerJob[]
}

type FilterOptions = {
  departments: string[]
  employmentTypes: string[]
  locations: string[]
  workArrangements: string[]
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

function filterOptions(jobs: CareerJob[]): FilterOptions {
  return {
    departments: optionValues(jobs, (job) => job.department),
    employmentTypes: optionValues(jobs, (job) => job.employmentTypeLabel),
    locations: optionValues(jobs, (job) => job.location),
    workArrangements: optionValues(jobs, (job) =>
      job.workArrangement === 'unspecified'
        ? null
        : workArrangementLabel(job.workArrangement),
    ),
  }
}

function GlassmorphicFilterSelect({
  allLabel,
  ariaLabel,
  name,
  onChange,
  options,
  value,
}: {
  allLabel: string
  ariaLabel: string
  name: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  const currentDisplay = value || allLabel

  return (
    <div className={styles.glassSelectWrapper} ref={containerRef}>
      <input name={name} type="hidden" value={value} />
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`${styles.glassSelectTrigger} ${
          open ? styles.glassSelectTriggerOpen : ''
        } ${value ? styles.glassSelectTriggerActive : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
          if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        type="button"
      >
        <span className={styles.glassSelectValue}>{currentDisplay}</span>
        <svg
          aria-hidden="true"
          className={`${styles.glassSelectChevron} ${
            open ? styles.glassSelectChevronOpen : ''
          }`}
          fill="none"
          height="14"
          viewBox="0 0 20 20"
          width="14"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label={ariaLabel}
            className={styles.glassSelectMenu}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            role="listbox"
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              aria-selected={value === ''}
              className={`${styles.glassSelectOption} ${
                value === '' ? styles.glassSelectOptionSelected : ''
              }`}
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              role="option"
              type="button"
            >
              <span>{allLabel}</span>
              {value === '' && (
                <span aria-hidden="true" className={styles.glassSelectCheck}>
                  ✓
                </span>
              )}
            </button>
            {options.map((opt) => {
              const isSelected = opt === value
              return (
                <button
                  aria-selected={isSelected}
                  className={`${styles.glassSelectOption} ${
                    isSelected ? styles.glassSelectOptionSelected : ''
                  }`}
                  key={opt}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                  }}
                  role="option"
                  type="button"
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className={styles.glassSelectCheck}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function JobFilters({
  filters,
  hasFilters,
  isSearching = false,
  matchCount,
  onChange,
  onClear,
  options,
  searchInputValue,
}: {
  filters: CareerFilters
  hasFilters: boolean
  isSearching?: boolean
  matchCount?: number
  onChange: (key: keyof CareerFilters, value: string) => void
  onClear: () => void
  options: FilterOptions
  searchInputValue?: string
}) {
  const currentSearchText =
    searchInputValue !== undefined ? searchInputValue : filters.query

  return (
    <form
      aria-label="Filter open roles"
      className={styles.filterPanel}
      onSubmit={(event) => event.preventDefault()}
      role="search"
    >
      <div className={styles.filterToolbar}>
        <div className={styles.searchFieldWrapper}>
          <label className={styles.searchField} htmlFor="career-search-input">
            <span className="sr-only">Search open roles</span>
            <HugeiconsIcon
              aria-hidden="true"
              className={`${styles.searchIcon} ${
                isSearching ? styles.searchIconActive : ''
              }`}
              icon={Search01Icon}
              size={18}
            />
            <input
              autoComplete="off"
              id="career-search-input"
              name="career-search"
              onChange={(event) => onChange('query', event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  onChange('query', '')
                }
              }}
              placeholder="Search roles, skills, or teams…"
              type="search"
              value={currentSearchText}
            />
            {isSearching ? (
              <span
                aria-label="Searching roles"
                className={styles.searchSpinner}
                role="status"
              />
            ) : currentSearchText ? (
              <button
                aria-label="Clear search text"
                className={styles.clearSearchInput}
                onClick={() => onChange('query', '')}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  size={14}
                />
              </button>
            ) : null}
          </label>
        </div>

        <div className={styles.filterDropdowns}>
          {options.departments.length > 1 ? (
            <GlassmorphicFilterSelect
              allLabel="All departments"
              ariaLabel="Filter by department"
              name="department"
              onChange={(val) => onChange('department', val)}
              options={options.departments}
              value={filters.department}
            />
          ) : null}

          {options.locations.length > 1 ? (
            <GlassmorphicFilterSelect
              allLabel="All locations"
              ariaLabel="Filter by location"
              name="location"
              onChange={(val) => onChange('location', val)}
              options={options.locations}
              value={filters.location}
            />
          ) : null}

          {options.workArrangements.length > 1 ? (
            <GlassmorphicFilterSelect
              allLabel="All work setups"
              ariaLabel="Filter by work setup"
              name="arrangement"
              onChange={(val) => onChange('workArrangement', val)}
              options={options.workArrangements}
              value={filters.workArrangement}
            />
          ) : null}

          {options.employmentTypes.length > 1 ? (
            <GlassmorphicFilterSelect
              allLabel="All employment types"
              ariaLabel="Filter by employment type"
              name="type"
              onChange={(val) => onChange('employmentType', val)}
              options={options.employmentTypes}
              value={filters.employmentType}
            />
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {hasFilters ? (
          <motion.div
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            className={styles.filterSummary}
            exit={{ opacity: 0, height: 0, y: -4 }}
            initial={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {matchCount !== undefined ? (
              <span className={styles.filterMatchCount}>
                <span className={styles.filterMatchDot} aria-hidden="true" />
                <span>
                  {matchCount}{' '}
                  {matchCount === 1 ? 'role matches' : 'roles match'} your
                  search
                </span>
              </span>
            ) : null}
            <div className={styles.activeFilterActions}>
              <button
                className={styles.clearFiltersButton}
                onClick={onClear}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  size={14}
                />
                <span>Clear filters</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  )
}

export function JobCard({
  applyLabel,
  detailsLabel,
  job,
}: {
  applyLabel?: string
  detailsLabel?: string
  job: CareerJob
}) {
  const detailsPath = `/careers/${job.slug}`
  const actionLabel = applyLabel ?? detailsLabel ?? 'View Details & Apply'

  const arrangementClass =
    job.workArrangement === 'remote'
      ? styles.arrangementRemote
      : job.workArrangement === 'hybrid'
        ? styles.arrangementHybrid
        : styles.arrangementOnsite

  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={styles.jobCard}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      layout="position"
      transition={{
        duration: 0.16,
        ease: [0.16, 1, 0.3, 1],
        layout: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
      whileHover={{ y: -3, transition: { duration: 0.16, ease: 'easeOut' } }}
    >
      <div className={styles.jobMain}>
        <div className={styles.jobBadges}>
          {job.department ? (
            <span className={`${styles.jobBadge} ${styles.departmentBadge}`}>
              {job.department}
            </span>
          ) : null}
          {job.workArrangement !== 'unspecified' ? (
            <span className={`${styles.jobBadge} ${arrangementClass}`}>
              {workArrangementLabel(job.workArrangement)}
            </span>
          ) : null}
        </div>

        <h3 className={styles.jobTitle}>
          <Link href={detailsPath}>{job.title}</Link>
        </h3>

        <div className={styles.jobMeta}>
          <span className={styles.jobMetaItem}>
            <HugeiconsIcon aria-hidden="true" icon={Location01Icon} size={15} />
            <span>{job.location}</span>
          </span>
          <span className={styles.jobMetaItem}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={Briefcase01Icon}
              size={15}
            />
            <span>{job.employmentTypeLabel}</span>
          </span>
          {job.compensation ? (
            <span
              className={`${styles.jobMetaItem} ${styles.compensationItem}`}
            >
              <HugeiconsIcon aria-hidden="true" icon={Money01Icon} size={15} />
              <span>{formatCareerCompensation(job.compensation)}</span>
            </span>
          ) : null}
        </div>

        {job.summary && !/^job\s*type\s*:/i.test(job.summary) ? (
          <p className={styles.jobSummary}>{job.summary}</p>
        ) : null}
      </div>

      <div className={styles.jobActions}>
        <Link
          aria-label={`View details and apply for ${job.title}`}
          className={`button-link button-link--primary ${styles.applyAction}`}
          href={detailsPath}
        >
          <span>{actionLabel}</span>
          <HugeiconsIcon aria-hidden="true" icon={ArrowRight01Icon} size={16} />
        </Link>
      </div>
    </motion.article>
  )
}

export function JobList({
  applyLabel,
  detailsLabel,
  jobs,
}: {
  applyLabel: string
  detailsLabel: string
  jobs: CareerJob[]
}) {
  return (
    <div className={styles.jobsList}>
      <AnimatePresence initial={false}>
        {jobs.map((job) => (
          <JobCard
            applyLabel={applyLabel}
            detailsLabel={detailsLabel}
            job={job}
            key={job.id}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export function CareersOpeningsSkeleton() {
  return (
    <div className={styles.skeletonWrapper} aria-label="Loading open positions">
      <div className={`${styles.skeleton} ${styles.skeletonToolbar}`} />
      <div className={styles.jobsList}>
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <div
            className={`${styles.skeleton} ${styles.skeletonCard}`}
            key={id}
          />
        ))}
      </div>
    </div>
  )
}

export function CareerOpeningsExplorer({
  applyLabel,
  detailsLabel,
  emptyMessage,
  emptyTitle,
  jobs: initialJobs,
}: CareerOpeningsExplorerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<CareerJob[]>(initialJobs)
  const [filters, setFilters] = useState<CareerFilters>(() =>
    careerFiltersFromSearchParams(searchParams),
  )
  const [searchInputValue, setSearchInputValue] = useState(filters.query)
  const [isSearching, startSearchTransition] = useTransition()

  // Real-time automatic background syncing with JazzHR backend
  useEffect(() => {
    let isMounted = true

    async function syncJobs() {
      if (document.hidden) return
      try {
        const response = await fetch('/api/careers/jobs', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) return
        const data = await response.json()
        if (isMounted && Array.isArray(data?.jobs)) {
          setJobs(data.jobs)
        }
      } catch {
        // Fallback silently on temporary connection issue
      }
    }

    const interval = window.setInterval(syncJobs, 30_000)

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        syncJobs()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const options = useMemo(() => filterOptions(jobs), [jobs])

  // Synchronize browser address bar for shareable links without triggering Next.js server navigation
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (typeof window === 'undefined') return
      const currentSearchParams = new URLSearchParams(window.location.search)
      const nextParams = careerFiltersToSearchParams(
        filters,
        currentSearchParams,
      )
      const nextString = nextParams.toString()
      const newUrl = nextString ? `${pathname}?${nextString}` : pathname
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.replaceState(null, '', newUrl)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [filters, pathname])

  // Support browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const nextFilters = careerFiltersFromSearchParams(params)
      setFilters(nextFilters)
      setSearchInputValue(nextFilters.query)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const filteredJobs = useMemo(
    () => filterCareerJobs(jobs, filters),
    [filters, jobs],
  )
  const hasFilters = Object.values(filters).some(Boolean)

  function updateFilter(key: keyof CareerFilters, value: string) {
    if (key === 'query') {
      setSearchInputValue(value)
      startSearchTransition(() => {
        setFilters((current) => ({ ...current, query: value }))
      })
    } else {
      setFilters((current) => ({ ...current, [key]: value }))
    }
  }

  function clearFilters() {
    setSearchInputValue('')
    setFilters(EMPTY_CAREER_FILTERS)
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        className={styles.emptyState}
        message={emptyMessage}
        title={emptyTitle}
      />
    )
  }

  return (
    <div className={styles.explorer}>
      <JobFilters
        filters={filters}
        hasFilters={hasFilters}
        isSearching={isSearching}
        matchCount={filteredJobs.length}
        onChange={updateFilter}
        onClear={clearFilters}
        options={options}
        searchInputValue={searchInputValue}
      />

      {filteredJobs.length === 0 ? (
        <AnimatePresence>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: 6 }}
            key="empty-state"
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <EmptyState
              action={
                <button
                  className={`button ${styles.clearAllButton}`}
                  onClick={clearFilters}
                  type="button"
                >
                  Clear all filters
                </button>
              }
              className={styles.emptyState}
              description="Try removing keywords or broadening your department or location filters."
              title="No matching roles found"
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <JobList
          applyLabel={applyLabel}
          detailsLabel={detailsLabel}
          jobs={filteredJobs}
        />
      )}
    </div>
  )
}
