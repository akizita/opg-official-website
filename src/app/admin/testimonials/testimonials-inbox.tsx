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
import { PillDropdown } from '@/app/admin/testimonials/pill-dropdown'

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
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const [search, setSearch] = useState('')
  const [connection, setConnection] = useState<'all' | 'past' | 'prospective'>(
    'all',
  )
  const [sortKey, setSortKey] = useState<'submitted_at' | 'author_name'>(
    'submitted_at',
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(10)
  const [localPage, setLocalPage] = useState(1)
  const [deleting, startDelete] = useTransition()
  const [reviewing, startReview] = useTransition()
  const detailDialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
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
  const selectedPending = selectedVisible.filter(
    (item) => item.status === 'pending',
  )
  const selectedApprovable = selectedPending.filter(
    (item) => item.publication_consent,
  )

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

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
    requestAnimationFrame(() => {
      const target = deleteTriggerRef.current?.isConnected
        ? deleteTriggerRef.current
        : listRef.current?.querySelector<HTMLInputElement>(
            'input[type="search"]',
          )
      target?.focus()
    })
  }

  function openDetails(item: CandidateSubmission, trigger: HTMLElement) {
    lastTriggerRef.current = trigger
    setMenuId(null)
    setSelectedId(item.id)
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
        if (status !== 'all' && items.length === 1) {
          requestAnimationFrame(() =>
            listRef.current
              ?.querySelector<HTMLInputElement>('input[type="search"]')
              ?.focus(),
          )
        }
        setToast({
          message: `${succeeded.length} testimonial${succeeded.length === 1 ? '' : 's'} ${decision}.`,
          tone: 'success',
        })
      }
      if (failed > 0) {
        const message = `${failed} of ${items.length} testimonials could not be ${decision}. Refresh and try again.`
        setReviewError(message)
        setToast({ message, tone: 'error' })
      }
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
          setToast({
            message: `${deletedIds.length} testimonial${deletedIds.length === 1 ? '' : 's'} deleted.`,
            tone: 'success',
          })
        }
        if (result.error) {
          setDeleteTargets((current) =>
            current.filter((item) => !deletedIds.includes(item.id)),
          )
          setDeleteError(result.error)
          setToast({ message: result.error, tone: 'error' })
        } else {
          setDeleteTargets([])
          requestAnimationFrame(() => {
            const target = deleteTriggerRef.current?.isConnected
              ? deleteTriggerRef.current
              : listRef.current?.querySelector<HTMLInputElement>(
                  'input[type="search"]',
                )
            target?.focus()
          })
        }
      } catch {
        const message = 'Could not delete the selected testimonials. Try again.'
        setDeleteError(message)
        setToast({ message, tone: 'error' })
      }
    })
  }

  return (
    <>
      <div className="candidate-review-inbox__toolbar">
        <label className="candidate-review-inbox__search">
          <span className="sr-only">Search candidate or story</span>
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="6.3" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            onChange={(event) => {
              setSearch(event.target.value)
              setLocalPage(1)
              setSelectedIds([])
            }}
            placeholder="Search name or story…"
            type="search"
            value={search}
          />
        </label>
        <TestimonialStatusFilter filters={filters} status={status} />
        <PillDropdown
          label="Connection"
          onChange={(value) => {
            setConnection(value as typeof connection)
            setLocalPage(1)
            setSelectedIds([])
          }}
          options={[
            { value: 'all', label: 'All connections' },
            { value: 'prospective', label: 'Prospective' },
            { value: 'past', label: 'Past' },
          ]}
          value={connection}
        />
        <PillDropdown
          label="Sort by"
          onChange={(value) => {
            setSortKey(value === 'name' ? 'author_name' : 'submitted_at')
            setSortDirection(
              value === 'oldest' || value === 'name' ? 'asc' : 'desc',
            )
            setLocalPage(1)
          }}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
            { value: 'name', label: 'Name A–Z' },
          ]}
          value={
            sortKey === 'author_name'
              ? 'name'
              : sortDirection === 'asc'
                ? 'oldest'
                : 'newest'
          }
        />
      </div>

      {selectedVisible.length > 1 && (canReview || canDelete) && (
        <div className="candidate-review-inbox__bulk-toolbar">
          <span aria-live="polite">
            <strong>{selectedVisible.length}</strong> selected
          </span>
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
              onClick={(event) => {
                deleteTriggerRef.current = event.currentTarget
                setDeleteError('')
                setDeleteTargets(selectedVisible)
              }}
              type="button"
            >
              Delete
            </button>
          )}
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
      <div
        className={`candidate-review-inbox${canReview || canDelete ? '' : ' candidate-review-inbox--readonly'}`}
        ref={listRef}
      >
        <div className="candidate-review-inbox__scroll">
          <table>
            <caption className="sr-only">
              Candidate testimonial submissions on the loaded page
            </caption>
            <thead className="sr-only">
              <tr>
                <th
                  aria-sort={sortKey === 'author_name' ? 'ascending' : 'none'}
                  scope="col"
                >
                  Candidate and role
                </th>
                <th scope="col">Story preview</th>
                <th scope="col">Connection</th>
                <th
                  aria-sort={
                    sortKey === 'submitted_at'
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  scope="col"
                >
                  Submitted
                </th>
                <th scope="col">Status</th>
                {(canReview || canDelete) && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((item, index) => (
                <tr
                  aria-label={`Open testimonial from ${item.author_name}`}
                  className={
                    selectedIds.includes(item.id) ? 'is-selected' : undefined
                  }
                  id={`testimonial-${item.id}`}
                  key={item.id}
                  onClick={(event) => {
                    if (
                      event.target instanceof Element &&
                      event.target.closest('button, a, input')
                    )
                      return
                    openDetails(item, event.currentTarget)
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openDetails(item, event.currentTarget)
                    }
                  }}
                  tabIndex={0}
                >
                  <th
                    className="candidate-review-inbox__candidate"
                    data-label="Candidate"
                    scope="row"
                  >
                    <span className="candidate-review-inbox__person">
                      {canReview || canDelete ? (
                        <button
                          aria-label={`${selectedIds.includes(item.id) ? 'Deselect' : 'Select'} testimonial from ${item.author_name}`}
                          aria-pressed={selectedIds.includes(item.id)}
                          className="candidate-review-inbox__avatar-select"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedIds((current) =>
                              current.includes(item.id)
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id],
                            )
                          }}
                          type="button"
                        >
                          <CandidateAvatar item={item} />
                          <span
                            aria-hidden="true"
                            className="candidate-review-inbox__avatar-check"
                          >
                            ✓
                          </span>
                        </button>
                      ) : (
                        <CandidateAvatar item={item} />
                      )}
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
                  {(canReview || canDelete) && (
                    <td
                      className="candidate-review-inbox__actions"
                      data-label="Action"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div
                        className={`candidate-review-inbox__more${index >= pageRows.length - 2 ? ' is-upward' : ''}`}
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
                                  deleteTriggerRef.current =
                                    menuTriggerRef.current
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
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleSubmissions.length === 0 && (
          <div className="candidate-review-empty">
            <span aria-hidden="true">✦</span>
            <h3>
              {submissions.length === 0
                ? status === 'pending'
                  ? 'Review queue is clear'
                  : 'No stories here yet'
                : 'No matching testimonials'}
            </h3>
            <p>
              {submissions.length === 0
                ? 'New candidate stories will appear here when submitted.'
                : 'Try a different search or connection filter.'}
            </p>
            <button
              className="candidate-review-button candidate-review-button--neutral"
              onClick={() => {
                setSearch('')
                setConnection('all')
                setSelectedIds([])
                if (status !== 'all')
                  router.push('/admin/testimonials?status=all')
                else router.refresh()
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
          <PillDropdown
            label="Rows per page"
            onChange={(value) => {
              setPageSize(Number(value))
              setLocalPage(1)
            }}
            options={[
              { value: '10', label: '10' },
              { value: '25', label: '25' },
              { value: '50', label: '50' },
            ]}
            value={String(pageSize)}
          />
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
                    onComplete={() => {
                      setSelectedId(null)
                      requestAnimationFrame(() =>
                        listRef.current
                          ?.querySelector<HTMLInputElement>(
                            'input[type="search"]',
                          )
                          ?.focus(),
                      )
                    }}
                    onResult={(message, tone) => setToast({ message, tone })}
                  />
                </div>
              )}
            {selected.status === 'pending' &&
              canReview &&
              !selected.publication_consent && (
                <div className="candidate-review-dialog__actions">
                  <p>
                    Publication consent is missing, so this story cannot be
                    approved.
                  </p>
                  <button
                    className="candidate-review-button candidate-review-button--neutral"
                    disabled={reviewing}
                    onClick={() => reviewItems([selected], 'rejected')}
                    type="button"
                  >
                    Reject testimonial
                  </button>
                </div>
              )}
            {canDelete && (
              <div className="candidate-review-dialog__actions">
                <button
                  className="candidate-review-button candidate-review-button--reject"
                  onClick={(event) => {
                    deleteTriggerRef.current = event.currentTarget
                    setSelectedId(null)
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
      {toast && (
        <div
          className={`candidate-review-toast candidate-review-toast--${toast.tone}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <span aria-hidden="true">{toast.tone === 'success' ? '✓' : '!'}</span>
          <p>{toast.message}</p>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
            type="button"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
