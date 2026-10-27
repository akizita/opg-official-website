'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from 'react'

import {
  deleteCandidateTestimonialAction,
  deleteCandidateTestimonialsAction,
  reviewCandidateTestimonialAction,
  type TestimonialReviewDecision,
} from '@/app/admin/testimonials/actions'
import { TestimonialReviewControls } from '@/app/admin/testimonials/review-controls'

export type ReviewStatus = 'all' | 'pending' | 'approved' | 'rejected'

export type CandidateSubmission = {
  id: string
  author_name: string
  email: string
  relationship: 'prospective' | 'past'
  role_title: string | null
  rating: number | null
  quote: string
  publication_consent: boolean
  status: Exclude<ReviewStatus, 'all'>
  submitted_at: string
  submitted_at_list_label: string
  submitted_at_label: string
  reviewed_at: string | null
  reviewed_at_label: string
  profile_photo_url: string | null
}

export type ReviewFilter = {
  value: ReviewStatus
  label: string
  count: number
  href: string
}

function profileLabel(item: CandidateSubmission) {
  const relationship =
    item.relationship === 'past' ? 'Past candidate' : 'Prospective candidate'
  return item.role_title ? `${relationship} · ${item.role_title}` : relationship
}

function CandidateAvatar({ item }: { item: CandidateSubmission }) {
  const nameParts = item.author_name.trim().split(/\s+/).filter(Boolean)
  const initials = (
    nameParts.length > 1
      ? nameParts.map((part) => part[0])
      : (nameParts[0] ?? '?').slice(0, 2).split('')
  )
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const hue =
    (Array.from(item.author_name).reduce(
      (sum, letter) => sum + letter.charCodeAt(0),
      0,
    ) %
      50) +
    18
  return (
    <span
      className="candidate-review-avatar"
      aria-hidden="true"
      style={{ '--avatar-hue': hue } as CSSProperties}
    >
      {item.profile_photo_url ? (
        <Image
          alt=""
          height={48}
          src={item.profile_photo_url}
          unoptimized
          width={48}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  )
}

export function TestimonialStatusFilter({
  filters,
  status,
}: {
  filters: ReviewFilter[]
  status: ReviewStatus
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<ReviewStatus | null>(null)
  const [filtering, startFiltering] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const active =
    filters.find(
      (filter) => filter.value === (filtering ? nextStatus : status),
    ) ?? filters[0]

  useEffect(() => {
    if (!open) return
    filters.forEach((filter) => router.prefetch(filter.href))
  }, [filters, open, router])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function selectFilter(filter: ReviewFilter) {
    setOpen(false)
    if (filter.value === status) return
    setNextStatus(filter.value)
    startFiltering(() => router.push(filter.href, { scroll: false }))
  }

  return (
    <div
      aria-busy={filtering}
      className="candidate-review-filter-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      ref={rootRef}
    >
      <button
        aria-controls="candidate-review-filter-menu"
        aria-expanded={open}
        className="candidate-review-filter-picker__trigger"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            requestAnimationFrame(() =>
              menuRef.current?.querySelector('button')?.focus(),
            )
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="candidate-review-filter-picker__icon"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path d="M3 5h14l-5.5 6v4l-3 1v-5L3 5Z" />
        </svg>
        <span className="candidate-review-filter-picker__label">
          <small>Status</small>
          <strong>{active.label}</strong>
        </span>
        <span className="candidate-review-filter-picker__count">
          {active.count}
        </span>
        <svg
          aria-hidden="true"
          className="candidate-review-filter-picker__chevron"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {filtering && (
        <span className="candidate-review-filter-picker__progress" />
      )}
      {open && (
        <div
          aria-label="Filter submissions by status"
          className="candidate-review-filter-picker__menu"
          id="candidate-review-filter-menu"
          onKeyDown={(event) => {
            const options = Array.from(
              event.currentTarget.querySelectorAll('button'),
            )
            const index = options.indexOf(
              document.activeElement as HTMLButtonElement,
            )
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              const direction = event.key === 'ArrowDown' ? 1 : -1
              options[
                (index + direction + options.length) % options.length
              ]?.focus()
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              options[event.key === 'Home' ? 0 : options.length - 1]?.focus()
            }
          }}
          ref={menuRef}
          role="group"
        >
          {filters.map((filter) => (
            <button
              aria-pressed={status === filter.value}
              className="candidate-review-filter-picker__option"
              key={filter.value}
              onClick={() => selectFilter(filter)}
              type="button"
            >
              <span className="candidate-review-filter-picker__option-copy">
                <i
                  aria-hidden="true"
                  className={`candidate-review-filter-picker__status-dot candidate-review-filter-picker__status-dot--${filter.value}`}
                />
                {filter.label}
              </span>
              <span className="candidate-review-filter-picker__option-count">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TestimonialsInbox({
  submissions,
  canReview,
  canDelete,
  filters,
  status,
}: {
  submissions: CandidateSubmission[]
  canReview: boolean
  canDelete: boolean
  filters: ReviewFilter[]
  status: ReviewStatus
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [deleteTargets, setDeleteTargets] = useState<CandidateSubmission[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [deleteError, setDeleteError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [search, setSearch] = useState('')
  const [connection, setConnection] = useState<'all' | 'past' | 'prospective'>(
    'all',
  )
  const [sortKey, setSortKey] = useState<
    'submitted_at' | 'author_name' | 'relationship' | 'status' | 'quote'
  >('submitted_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(10)
  const [localPage, setLocalPage] = useState(1)
  const [deleting, startDelete] = useTransition()
  const [reviewing, startReview] = useTransition()
  const detailDialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const selected = submissions.find((item) => item.id === selectedId)
  const deleteDialogOpen = deleteTargets.length > 0
  const visibleSubmissions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return submissions
      .filter((item) => !hiddenIds.includes(item.id))
      .filter(
        (item) => connection === 'all' || item.relationship === connection,
      )
      .filter(
        (item) =>
          !query ||
          `${item.author_name} ${item.quote}`
            .toLocaleLowerCase()
            .includes(query),
      )
      .sort((a, b) => {
        const result =
          sortKey === 'submitted_at'
            ? a.submitted_at.localeCompare(b.submitted_at)
            : a[sortKey].localeCompare(b[sortKey])
        return sortDirection === 'asc' ? result : -result
      })
  }, [connection, hiddenIds, search, sortDirection, sortKey, submissions])
  const localPageCount = Math.max(
    1,
    Math.ceil(visibleSubmissions.length / pageSize),
  )
  const currentPage = Math.min(localPage, localPageCount)
  const pageRows = visibleSubmissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )
  const selectedVisible = visibleSubmissions.filter((item) =>
    selectedIds.includes(item.id),
  )
  const allVisibleSelected =
    pageRows.length > 0 &&
    pageRows.every((item) => selectedIds.includes(item.id))
  const someVisibleSelected = pageRows.some((item) =>
    selectedIds.includes(item.id),
  )
  const selectedPending = selectedVisible.filter(
    (item) => item.status === 'pending',
  )
  const selectedApprovable = selectedPending.filter(
    (item) => item.publication_consent,
  )

  useEffect(() => {
    const dialog = detailDialogRef.current
    if (!selectedId || !dialog) return
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [selectedId])

  useEffect(() => {
    const dialog = deleteDialogRef.current
    if (!deleteDialogOpen || !dialog) return
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [deleteDialogOpen])

  useEffect(() => {
    if (!menuId) return
    function onPointerDown(event: PointerEvent) {
      if (
        !listRef.current
          ?.querySelector(`[data-menu-id="${menuId}"]`)
          ?.contains(event.target as Node)
      ) {
        setMenuId(null)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuId(null)
        menuTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuId])

  function closeDetails() {
    setSelectedId(null)
    requestAnimationFrame(() => lastTriggerRef.current?.focus())
  }

  function closeDelete() {
    if (deleting) return
    setDeleteTargets([])
    setDeleteError('')
  }

  function openDetails(item: CandidateSubmission, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger
    setMenuId(null)
    setSelectedId(item.id)
  }

  function setSort(key: typeof sortKey) {
    setSortDirection((current) =>
      sortKey === key && current === 'asc' ? 'desc' : 'asc',
    )
    setSortKey(key)
    setLocalPage(1)
  }

  function reviewItems(
    items: CandidateSubmission[],
    decision: TestimonialReviewDecision,
  ) {
    if (items.length === 0) return
    setReviewError('')
    startReview(async () => {
      const results = await Promise.allSettled(
        items.map((item) =>
          reviewCandidateTestimonialAction(item.id, decision),
        ),
      )
      const succeeded = items
        .filter(
          (_, index) =>
            results[index].status === 'fulfilled' &&
            results[index].value.success,
        )
        .map((item) => item.id)
      const failed = items.length - succeeded.length
      if (succeeded.length > 0) {
        if (status !== 'all') {
          setHiddenIds((current) => [...new Set([...current, ...succeeded])])
        }
        setSelectedIds((current) =>
          current.filter((id) => !succeeded.includes(id)),
        )
        if (selectedId && succeeded.includes(selectedId)) setSelectedId(null)
        router.refresh()
      }
      if (failed > 0)
        setReviewError(
          `${failed} of ${items.length} testimonials could not be ${decision}. Refresh and try again.`,
        )
    })
  }

  function deleteSubmission() {
    if (deleteTargets.length === 0) return
    const ids = deleteTargets.map((item) => item.id)
    setDeleteError('')
    startDelete(async () => {
      try {
        const result =
          ids.length === 1
            ? await deleteCandidateTestimonialAction(ids[0])
            : await deleteCandidateTestimonialsAction(ids)
        const deletedIds =
          'deletedIds' in result ? result.deletedIds : result.success ? ids : []
        if (deletedIds.length > 0) {
          setHiddenIds((current) => [...new Set([...current, ...deletedIds])])
          setSelectedIds((current) =>
            current.filter((id) => !deletedIds.includes(id)),
          )
          router.refresh()
        }
        if (result.error) {
          setDeleteTargets((current) =>
            current.filter((item) => !deletedIds.includes(item.id)),
          )
          setDeleteError(result.error)
        } else {
          setDeleteTargets([])
        }
      } catch {
        setDeleteError('Could not delete the selected testimonials. Try again.')
      }
    })
  }

  return (
    <>
      <div className="candidate-review-inbox__toolbar">
        <label className="candidate-review-inbox__search">
          <span className="sr-only">Search candidate or story</span>
          <input
            onChange={(event) => {
              setSearch(event.target.value)
              setLocalPage(1)
              setSelectedIds([])
            }}
            placeholder="Search candidate or story"
            type="search"
            value={search}
          />
        </label>
        <TestimonialStatusFilter filters={filters} status={status} />
        <label>
          <span>Connection</span>
          <select
            onChange={(event) => {
              setConnection(event.target.value as typeof connection)
              setLocalPage(1)
              setSelectedIds([])
            }}
            value={connection}
          >
            <option value="all">All connections</option>
            <option value="prospective">Prospective</option>
            <option value="past">Past</option>
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select
            onChange={(event) => {
              const value = event.target.value
              setSortKey(value === 'name' ? 'author_name' : 'submitted_at')
              setSortDirection(
                value === 'oldest' || value === 'name' ? 'asc' : 'desc',
              )
              setLocalPage(1)
            }}
            value={
              sortKey === 'author_name' && sortDirection === 'asc'
                ? 'name'
                : sortKey === 'submitted_at'
                  ? sortDirection === 'asc'
                    ? 'oldest'
                    : 'newest'
                  : 'custom'
            }
          >
            <option disabled value="custom">
              Column sort
            </option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {(canReview || canDelete) && (
        <div className="candidate-review-inbox__bulk-toolbar">
          <label className="candidate-review-inbox__select-all">
            <input
              aria-label="Select all testimonials shown on this page"
              checked={allVisibleSelected}
              onChange={(event) =>
                setSelectedIds((current) =>
                  event.target.checked
                    ? [
                        ...new Set([
                          ...current,
                          ...pageRows.map((item) => item.id),
                        ]),
                      ]
                    : current.filter(
                        (id) => !pageRows.some((item) => item.id === id),
                      ),
                )
              }
              ref={(input) => {
                if (input)
                  input.indeterminate =
                    someVisibleSelected && !allVisibleSelected
              }}
              type="checkbox"
            />
            Select page
          </label>
          <span aria-live="polite">{selectedVisible.length} selected</span>
          {canReview && (
            <button
              className="candidate-review-button candidate-review-button--approve"
              disabled={
                selectedApprovable.length === 0 || reviewing || deleting
              }
              onClick={() => reviewItems(selectedApprovable, 'approved')}
              type="button"
            >
              Approve
            </button>
          )}
          {canReview && (
            <button
              className="candidate-review-button candidate-review-button--neutral"
              disabled={selectedPending.length === 0 || reviewing || deleting}
              onClick={() => reviewItems(selectedPending, 'rejected')}
              type="button"
            >
              Reject
            </button>
          )}
          {canDelete && (
            <button
              className="candidate-review-button candidate-review-button--reject"
              disabled={selectedVisible.length === 0 || deleting || reviewing}
              onClick={() => {
                setDeleteError('')
                setDeleteTargets(selectedVisible)
              }}
              type="button"
            >
              Delete
            </button>
          )}
          <button
            className="candidate-review-button candidate-review-button--neutral"
            disabled={selectedVisible.length === 0 || deleting || reviewing}
            onClick={() => setSelectedIds([])}
            type="button"
          >
            Clear
          </button>
        </div>
      )}
      {reviewError && (
        <p
          className="candidate-review-controls__error candidate-review-inbox__feedback"
          role="alert"
        >
          {reviewError}
        </p>
      )}
      <div className="candidate-review-inbox" ref={listRef}>
        <div className="candidate-review-inbox__scroll">
          <table>
            <caption className="sr-only">
              Candidate testimonial submissions on the loaded page
            </caption>
            <thead>
              <tr>
                {(canReview || canDelete) && (
                  <th scope="col">
                    <span className="sr-only">Select</span>
                  </th>
                )}
                {(
                  [
                    ['author_name', 'Candidate'],
                    ['quote', 'Story preview'],
                    ['relationship', 'Connection'],
                    ['submitted_at', 'Submitted'],
                    ['status', 'Status'],
                  ] as const
                ).map(([key, label]) => (
                  <th
                    aria-sort={
                      sortKey === key
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                    key={key}
                    scope="col"
                  >
                    <button
                      onClick={() => setSort(key)}
                      title={
                        key === 'author_name'
                          ? 'Candidate name and Role / Company'
                          : undefined
                      }
                      type="button"
                    >
                      {label}{' '}
                      <span aria-hidden="true">
                        {sortKey === key
                          ? sortDirection === 'asc'
                            ? '↑'
                            : '↓'
                          : '↕'}
                      </span>
                    </button>
                  </th>
                ))}
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((item) => (
                <tr
                  className={
                    selectedIds.includes(item.id) ? 'is-selected' : undefined
                  }
                  id={`testimonial-${item.id}`}
                  key={item.id}
                >
                  {(canReview || canDelete) && (
                    <td
                      className="candidate-review-inbox__selection"
                      data-label="Select"
                    >
                      <label>
                        <span className="sr-only">
                          Select testimonial from {item.author_name}
                        </span>
                        <input
                          aria-label={`Select testimonial from ${item.author_name}`}
                          checked={selectedIds.includes(item.id)}
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...new Set([...current, item.id])]
                                : current.filter((id) => id !== item.id),
                            )
                          }
                          type="checkbox"
                        />
                      </label>
                    </td>
                  )}
                  <th
                    className="candidate-review-inbox__candidate"
                    data-label="Candidate"
                    scope="row"
                  >
                    <span className="candidate-review-inbox__person">
                      <CandidateAvatar item={item} />
                      <span className="candidate-review-inbox__copy">
                        <strong>{item.author_name}</strong>
                        <span
                          className="candidate-review-inbox__profile"
                          title="Role / Company"
                        >
                          {item.role_title?.trim() || 'Candidate'}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td
                    className="candidate-review-inbox__story"
                    data-label="Story preview"
                  >
                    <span
                      className="candidate-review-inbox__preview"
                      title={item.quote}
                    >
                      {item.quote}
                    </span>
                    <button
                      className="candidate-review-inbox__read-more"
                      onClick={(event) =>
                        openDetails(item, event.currentTarget)
                      }
                      type="button"
                    >
                      Read more
                    </button>
                  </td>
                  <td data-label="Connection">
                    <span className="candidate-review-inbox__connection-badge">
                      {item.relationship === 'past'
                        ? 'Past candidate'
                        : 'Prospective'}
                    </span>
                  </td>
                  <td
                    className="candidate-review-inbox__date"
                    data-label="Submitted"
                  >
                    <time
                      dateTime={item.submitted_at}
                      title={`${item.submitted_at_label} SGT`}
                    >
                      {item.submitted_at_list_label}
                    </time>
                    <small>SGT</small>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`candidate-review-status candidate-review-status--${item.status}`}
                    >
                      <span aria-hidden="true">
                        {item.status === 'approved'
                          ? '✓'
                          : item.status === 'pending'
                            ? '◷'
                            : '×'}
                      </span>
                      {item.status}
                    </span>
                  </td>
                  <td
                    className="candidate-review-inbox__actions"
                    data-label="Action"
                  >
                    {item.status === 'pending' &&
                    canReview &&
                    item.publication_consent ? (
                      <button
                        className="candidate-review-inbox__primary"
                        disabled={reviewing || deleting}
                        onClick={() => reviewItems([item], 'approved')}
                        type="button"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        className="candidate-review-inbox__primary"
                        onClick={(event) =>
                          openDetails(item, event.currentTarget)
                        }
                        type="button"
                      >
                        View
                      </button>
                    )}
                    {(canReview || canDelete) && (
                      <div
                        className="candidate-review-inbox__more"
                        data-menu-id={item.id}
                      >
                        <button
                          aria-controls={`testimonial-actions-${item.id}`}
                          aria-expanded={menuId === item.id}
                          aria-haspopup="menu"
                          aria-label={`Row actions for ${item.author_name}`}
                          className="candidate-review-inbox__more-button"
                          onClick={(event) => {
                            menuTriggerRef.current = event.currentTarget
                            setMenuId((current) =>
                              current === item.id ? null : item.id,
                            )
                            requestAnimationFrame(() =>
                              document
                                .getElementById(
                                  `testimonial-actions-${item.id}`,
                                )
                                ?.querySelector('button')
                                ?.focus(),
                            )
                          }}
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="5" cy="12" r="1.7" />
                            <circle cx="12" cy="12" r="1.7" />
                            <circle cx="19" cy="12" r="1.7" />
                          </svg>
                        </button>
                        {menuId === item.id && (
                          <div
                            className="candidate-review-inbox__menu"
                            id={`testimonial-actions-${item.id}`}
                            onKeyDown={(event) => {
                              const options = Array.from(
                                event.currentTarget.querySelectorAll('button'),
                              )
                              const index = options.indexOf(
                                document.activeElement as HTMLButtonElement,
                              )
                              if (
                                event.key === 'ArrowDown' ||
                                event.key === 'ArrowUp'
                              ) {
                                event.preventDefault()
                                options[
                                  (index +
                                    (event.key === 'ArrowDown' ? 1 : -1) +
                                    options.length) %
                                    options.length
                                ]?.focus()
                              }
                            }}
                            role="menu"
                          >
                            {canReview && item.status === 'pending' && (
                              <button
                                disabled={reviewing || deleting}
                                onClick={() => {
                                  setMenuId(null)
                                  reviewItems([item], 'rejected')
                                }}
                                role="menuitem"
                                type="button"
                              >
                                Reject testimonial
                              </button>
                            )}
                            {canDelete && (
                              <button
                                disabled={reviewing || deleting}
                                onClick={() => {
                                  setMenuId(null)
                                  setDeleteTargets([item])
                                }}
                                role="menuitem"
                                type="button"
                              >
                                Delete testimonial
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleSubmissions.length === 0 && (
          <div className="candidate-review-empty">
            <span aria-hidden="true">✦</span>
            <h3>No matching testimonials</h3>
            <p>Try a different search or connection filter.</p>
            <button
              className="candidate-review-button candidate-review-button--neutral"
              onClick={() => {
                setSearch('')
                setConnection('all')
                setSelectedIds([])
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="candidate-review-inbox__pagination">
          <span>
            Showing{' '}
            {visibleSubmissions.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
            –{Math.min(currentPage * pageSize, visibleSubmissions.length)} of{' '}
            {visibleSubmissions.length} loaded
          </span>
          <label>
            Rows per page{' '}
            <select
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setLocalPage(1)
              }}
              value={pageSize}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </label>
          <button
            disabled={currentPage === 1}
            onClick={() => setLocalPage((page) => page - 1)}
            type="button"
          >
            Previous
          </button>
          <button
            disabled={currentPage >= localPageCount}
            onClick={() => setLocalPage((page) => page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      {selected && (
        <dialog
          aria-labelledby="candidate-review-dialog-title"
          className="candidate-review-dialog"
          onCancel={(event) => {
            event.preventDefault()
            closeDetails()
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDetails()
          }}
          ref={detailDialogRef}
        >
          <div className="candidate-review-dialog__content">
            <header className="candidate-review-dialog__header">
              <CandidateAvatar item={selected} />
              <div>
                <h2 id="candidate-review-dialog-title">
                  {selected.author_name}
                </h2>
                <p>{profileLabel(selected)}</p>
              </div>
              <button
                aria-label="Close testimonial"
                className="candidate-review-dialog__close"
                onClick={closeDetails}
                type="button"
              >
                ×
              </button>
            </header>
            <span
              className={`candidate-review-status candidate-review-status--${selected.status}`}
            >
              {selected.status}
            </span>
            <blockquote>{selected.quote}</blockquote>
            <dl className="candidate-review-dialog__details">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                </dd>
              </div>
              <div>
                <dt>Connection</dt>
                <dd>
                  {selected.relationship === 'past'
                    ? 'Past candidate'
                    : 'Prospective candidate'}
                </dd>
              </div>
              <div>
                <dt>Role or field</dt>
                <dd>{selected.role_title || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd>
                  {selected.rating
                    ? `${selected.rating} of 5 stars`
                    : 'Not provided'}
                </dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{selected.submitted_at_label}</dd>
              </div>
              <div>
                <dt>Reviewed</dt>
                <dd>{selected.reviewed_at_label}</dd>
              </div>
              <div>
                <dt>Publication consent</dt>
                <dd>{selected.publication_consent ? 'Given' : 'Missing'}</dd>
              </div>
            </dl>
            {selected.status === 'pending' &&
              canReview &&
              selected.publication_consent && (
                <div className="candidate-review-dialog__actions">
                  <TestimonialReviewControls
                    id={selected.id}
                    onComplete={closeDetails}
                  />
                </div>
              )}
            {canDelete && (
              <div className="candidate-review-dialog__actions">
                <button
                  className="candidate-review-button candidate-review-button--reject"
                  onClick={() => {
                    closeDetails()
                    setDeleteTargets([selected])
                  }}
                  type="button"
                >
                  Delete testimonial
                </button>
              </div>
            )}
          </div>
        </dialog>
      )}

      {deleteDialogOpen && (
        <dialog
          aria-labelledby="candidate-review-delete-title"
          aria-describedby="candidate-review-delete-description"
          className="candidate-review-dialog candidate-review-dialog--confirm"
          onCancel={(event) => {
            event.preventDefault()
            closeDelete()
          }}
          ref={deleteDialogRef}
        >
          <div className="candidate-review-dialog__content">
            <h2 id="candidate-review-delete-title">
              Delete{' '}
              {deleteTargets.length === 1
                ? 'testimonial'
                : `${deleteTargets.length} testimonials`}
              ?
            </h2>
            <p id="candidate-review-delete-description">
              {deleteTargets.length === 1
                ? `The submission from ${deleteTargets[0].author_name} will be removed permanently.`
                : `These ${deleteTargets.length} selected submissions will be removed permanently.`}
            </p>
            {deleteError && (
              <p className="candidate-review-controls__error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="candidate-review-dialog__confirm-actions">
              <button
                className="candidate-review-button candidate-review-button--neutral"
                disabled={deleting}
                onClick={closeDelete}
                type="button"
              >
                Cancel
              </button>
              <button
                className="candidate-review-button candidate-review-button--reject"
                disabled={deleting}
                onClick={deleteSubmission}
                type="button"
              >
                {deleting
                  ? 'Deleting…'
                  : `Delete ${deleteTargets.length} permanently`}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
