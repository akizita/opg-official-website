'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import {
  deleteCandidateTestimonialAction,
  deleteCandidateTestimonialsAction,
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
  return (
    <span className="candidate-review-avatar" aria-hidden="true">
      {item.profile_photo_url ? (
        <Image
          alt=""
          height={48}
          src={item.profile_photo_url}
          unoptimized
          width={48}
        />
      ) : (
        <svg fill="none" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="15" r="6" fill="currentColor" />
          <path d="M8 34c0-6.6 5.4-11 12-11s12 4.4 12 11" fill="currentColor" />
        </svg>
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
}: {
  submissions: CandidateSubmission[]
  canReview: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [deleteTargets, setDeleteTargets] = useState<CandidateSubmission[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [deleteError, setDeleteError] = useState('')
  const [deleting, startDelete] = useTransition()
  const detailDialogRef = useRef<HTMLDialogElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLButtonElement>(null)
  const selected = submissions.find((item) => item.id === selectedId)
  const deleteDialogOpen = deleteTargets.length > 0
  const visibleSubmissions = submissions.filter(
    (item) => !hiddenIds.includes(item.id),
  )
  const selectedVisible = visibleSubmissions.filter((item) =>
    selectedIds.includes(item.id),
  )
  const allVisibleSelected =
    visibleSubmissions.length > 0 &&
    selectedVisible.length === visibleSubmissions.length

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
      if (event.key === 'Escape') setMenuId(null)
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
      {canDelete && (
        <div className="candidate-review-inbox__bulk-toolbar">
          <label className="candidate-review-inbox__select-all">
            <input
              aria-label="Select all testimonials on this page"
              checked={allVisibleSelected}
              onChange={(event) =>
                setSelectedIds(
                  event.target.checked
                    ? visibleSubmissions.map((item) => item.id)
                    : [],
                )
              }
              ref={(input) => {
                if (input)
                  input.indeterminate =
                    selectedVisible.length > 0 && !allVisibleSelected
              }}
              type="checkbox"
            />
            Select all on this page
          </label>
          <span aria-live="polite">{selectedVisible.length} selected</span>
          <button
            className="candidate-review-button candidate-review-button--reject"
            disabled={selectedVisible.length === 0 || deleting}
            onClick={() => {
              setDeleteError('')
              setDeleteTargets(selectedVisible)
            }}
            type="button"
          >
            Delete selected
          </button>
        </div>
      )}
      <div
        className={`candidate-review-inbox${canDelete ? '' : ' candidate-review-inbox--no-actions'}`}
        ref={listRef}
        role="list"
      >
        <div className="candidate-review-inbox__head" aria-hidden="true">
          <span>Candidate</span>
          <span>Story preview</span>
          <span className="candidate-review-inbox__connection">Connection</span>
          <span className="candidate-review-inbox__date">Submitted</span>
          <span>Status</span>
          {canDelete && (
            <span className="candidate-review-inbox__action">Action</span>
          )}
        </div>
        {visibleSubmissions.map((item) => (
          <div
            className={`candidate-review-inbox__row${selectedIds.includes(item.id) ? ' is-selected' : ''}`}
            id={`testimonial-${item.id}`}
            key={item.id}
            role="listitem"
          >
            {canDelete && (
              <label className="candidate-review-inbox__select-row">
                <input
                  aria-label={`Select testimonial from ${item.author_name}`}
                  checked={selectedIds.includes(item.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                  type="checkbox"
                />
              </label>
            )}
            <button
              aria-label={`Read ${item.status} testimonial from ${item.author_name}`}
              className="candidate-review-inbox__open"
              onClick={(event) => {
                lastTriggerRef.current = event.currentTarget
                setMenuId(null)
                setSelectedId(item.id)
              }}
              type="button"
            >
              <span className="candidate-review-inbox__person">
                <CandidateAvatar item={item} />
                <span className="candidate-review-inbox__copy">
                  <strong>{item.author_name}</strong>
                  <span className="candidate-review-inbox__profile">
                    {item.role_title?.trim() || 'Candidate'}
                  </span>
                </span>
              </span>
              <span className="candidate-review-inbox__preview">
                {item.quote}
              </span>
              <span className="candidate-review-inbox__connection">
                {item.relationship === 'past'
                  ? 'Past candidate'
                  : 'Prospective candidate'}
              </span>
              <span className="candidate-review-inbox__date">
                {item.submitted_at_list_label}
              </span>
              <span
                className={`candidate-review-status candidate-review-status--${item.status}`}
              >
                {item.status}
              </span>
            </button>
            {canDelete && (
              <div
                className="candidate-review-inbox__more"
                data-menu-id={item.id}
              >
                <button
                  aria-controls={`testimonial-actions-${item.id}`}
                  aria-expanded={menuId === item.id}
                  aria-haspopup="menu"
                  aria-label={`More options for ${item.author_name}`}
                  className="candidate-review-inbox__more-button"
                  onClick={() =>
                    setMenuId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
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
                    role="menu"
                  >
                    <button
                      onClick={() => {
                        setMenuId(null)
                        setDeleteTargets([item])
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <path d="M4.5 7h15M9 7V4.8h6V7m-8.7 0 .7 12h10l.7-12M10 10.5v5.5m4-5.5v5.5" />
                      </svg>
                      <span>
                        <strong>Delete testimonial</strong>
                        <small>Remove this submission</small>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
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
