'use client'

import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'

import {
  addSubscriberAction,
  deleteSubscriberAction,
  resendSubscriberConfirmationAction,
  updateSubscriberStatusAction,
} from '@/app/admin/subscribers/actions'
import {
  buildSubscribersCsv,
  computeDateCutoff,
  deriveSubscriberDisplayName,
  filterSubscribers,
  formatConsentSource,
  formatFullDateTime,
  formatShortDate,
  getSubscriberStatusLabel,
  SUBSCRIBER_EMAIL_REGEX,
  SUBSCRIBER_SOURCE_OPTIONS,
  type SubscriberDateFilter,
  type SubscriberItem,
  type SubscriberStatus,
  type SubscriberStatusFilter,
} from '@/app/admin/subscribers/subscriber-utils'
import styles from '@/app/admin/subscribers/subscribers.module.css'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCalendar,
  OpgIconCheck,
  OpgIconChevron,
  OpgIconClose,
  OpgIconCopy,
  OpgIconPlus,
  OpgIconSearch,
  OpgIconSend,
  OpgIconTrash,
} from '@/components/icons/opg-icons'
import { AccountAvatar } from '@/components/ui/account-avatar'

type SubscribersManagerProps = {
  initialSubscribers: SubscriberItem[]
  canManage: boolean
  initialStatus?: string
}

const DATE_FILTER_OPTIONS: { label: string; value: SubscriberDateFilter }[] = [
  { label: 'All Dates', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
]

const STATUS_DOT_CLASS: Record<SubscriberStatusFilter, string> = {
  all: styles.dotAll,
  confirmed: styles.dotConfirmed,
  pending_confirmation: styles.dotPending,
  unsubscribed: styles.dotUnsubscribed,
}

const STATUS_PILL_CLASS: Record<SubscriberStatus, string> = {
  confirmed: styles.statusConfirmed,
  pending_confirmation: styles.statusPending,
  unsubscribed: styles.statusUnsubscribed,
}

function ExportCsvIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="15"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 20 20"
      width="15"
    >
      <path d="M3 13.5v2a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-2" />
      <path d="m6.5 9.5 3.5 3.5 3.5-3.5" />
      <path d="M10 3v10" />
    </svg>
  )
}

export function SubscribersManager({
  initialSubscribers,
  canManage,
  initialStatus = 'all',
}: SubscribersManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const normalizedInitialStatus: SubscriberStatusFilter =
    initialStatus === 'confirmed' ||
    initialStatus === 'pending_confirmation' ||
    initialStatus === 'unsubscribed'
      ? initialStatus
      : 'all'

  const [statusFilter, setStatusFilter] = useState<SubscriberStatusFilter>(
    normalizedInitialStatus,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<SubscriberDateFilter>('all')
  const [customDate, setCustomDate] = useState('')
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [dateMenuOpen, setDateMenuOpen] = useState(false)

  const [selectedSubscriber, setSelectedSubscriber] =
    useState<SubscriberItem | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addSource, setAddSource] = useState<string>('admin_manual')
  const [addStatus, setAddStatus] = useState<
    'confirmed' | 'pending_confirmation'
  >('confirmed')
  const [addError, setAddError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<SubscriberItem | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const statusTriggerRef = useRef<HTMLButtonElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const dateDropdownRef = useRef<HTMLDivElement>(null)
  const dateTriggerRef = useRef<HTMLButtonElement>(null)
  const statusMenuId = useId()

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type })
    },
    [],
  )

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!statusMenuOpen) return
    function handleOutside(event: PointerEvent | FocusEvent) {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setStatusMenuOpen(false)
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setStatusMenuOpen(false)
        statusTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('focusin', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('focusin', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [statusMenuOpen])

  useEffect(() => {
    if (!dateMenuOpen) return
    function handleOutside(event: PointerEvent | FocusEvent) {
      if (!dateDropdownRef.current?.contains(event.target as Node)) {
        setDateMenuOpen(false)
      }
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDateMenuOpen(false)
        dateTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('focusin', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('focusin', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [dateMenuOpen])

  useEffect(() => {
    if (!selectedSubscriber && !addModalOpen) return
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) {
        setSelectedSubscriber(null)
        setAddModalOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [selectedSubscriber, addModalOpen, isPending])

  const counts = useMemo(() => {
    let confirmed = 0
    let pending = 0
    let unsubscribed = 0
    for (const sub of initialSubscribers) {
      if (sub.status === 'confirmed') confirmed += 1
      else if (sub.status === 'pending_confirmation') pending += 1
      else if (sub.status === 'unsubscribed') unsubscribed += 1
    }
    return {
      all: initialSubscribers.length,
      confirmed,
      pending_confirmation: pending,
      unsubscribed,
    }
  }, [initialSubscribers])

  const statusOptions = useMemo(
    () => [
      {
        value: 'all' as const,
        label: 'All Subscribers',
        count: counts.all,
      },
      {
        value: 'confirmed' as const,
        label: 'Confirmed',
        count: counts.confirmed,
      },
      {
        value: 'pending_confirmation' as const,
        label: 'Pending',
        count: counts.pending_confirmation,
      },
      {
        value: 'unsubscribed' as const,
        label: 'Unsubscribed',
        count: counts.unsubscribed,
      },
    ],
    [counts],
  )

  const activeStatusOption =
    statusOptions.find((opt) => opt.value === statusFilter) ?? statusOptions[0]

  const dateRange = useMemo(
    () => computeDateCutoff(dateFilter, customDate),
    [dateFilter, customDate],
  )

  const dateFilterLabel = useMemo(() => {
    if (dateFilter === 'custom' && customDate) {
      return formatShortDate(`${customDate}T00:00:00`)
    }
    return (
      DATE_FILTER_OPTIONS.find((opt) => opt.value === dateFilter)?.label ||
      'All Dates'
    )
  }, [dateFilter, customDate])

  const filteredSubscribers = useMemo(
    () =>
      filterSubscribers(initialSubscribers, {
        statusFilter,
        searchQuery,
        dateRange,
      }),
    [initialSubscribers, statusFilter, searchQuery, dateRange],
  )

  const activeSelectedSubscriber = useMemo(() => {
    if (!selectedSubscriber) return null
    return (
      initialSubscribers.find((sub) => sub.id === selectedSubscriber.id) ??
      selectedSubscriber
    )
  }, [initialSubscribers, selectedSubscriber])

  const hasActiveFilters =
    statusFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== ''

  function handleResetFilters() {
    setStatusFilter('all')
    setDateFilter('all')
    setCustomDate('')
    setSearchQuery('')
  }

  function handleExportCsv() {
    if (filteredSubscribers.length === 0) return
    const csv = buildSubscribersCsv(filteredSubscribers)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `opg-subscribers-${stamp}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    showToast(
      `Exported ${filteredSubscribers.length} subscriber${filteredSubscribers.length === 1 ? '' : 's'} to CSV.`,
    )
  }

  function handleStatusChange(
    subscriber: SubscriberItem,
    nextStatus: SubscriberStatus,
  ) {
    startTransition(async () => {
      try {
        const res = await updateSubscriberStatusAction(subscriber.id, nextStatus)
        if (!res.success) {
          showToast(res.error || 'Could not update subscriber.', 'error')
          return
        }
        showToast(
          `${subscriber.email_normalized} marked ${getSubscriberStatusLabel(nextStatus).toLowerCase()}.`,
        )
        router.refresh()
      } catch {
        showToast('Failed to update subscriber status.', 'error')
      }
    })
  }

  function handleResendConfirmation(subscriber: SubscriberItem) {
    startTransition(async () => {
      try {
        const res = await resendSubscriberConfirmationAction(subscriber.id)
        if (!res.success) {
          showToast(res.error || 'Could not resend confirmation.', 'error')
          return
        }
        showToast(`Confirmation email queued for ${subscriber.email_normalized}.`)
        router.refresh()
      } catch {
        showToast('Failed to queue confirmation email.', 'error')
      }
    })
  }

  function handleAddSubscriber(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanEmail = addEmail.trim().toLowerCase()
    if (!cleanEmail || !SUBSCRIBER_EMAIL_REGEX.test(cleanEmail)) {
      setAddError('Please enter a valid work or personal email address.')
      return
    }
    setAddError('')

    startTransition(async () => {
      try {
        const res = await addSubscriberAction({
          email: cleanEmail,
          source: addSource,
          status: addStatus,
        })
        if (!res.success) {
          setAddError(res.error || 'Could not add subscriber.')
          return
        }
        setAddModalOpen(false)
        setAddEmail('')
        setAddSource('admin_manual')
        setAddStatus('confirmed')
        showToast(
          addStatus === 'confirmed'
            ? `${cleanEmail} added as a confirmed subscriber.`
            : `Pending confirmation queued for ${cleanEmail}.`,
        )
        router.refresh()
      } catch {
        setAddError('An unexpected error occurred while adding the subscriber.')
      }
    })
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      try {
        const res = await deleteSubscriberAction(target.id)
        if (!res.success) {
          showToast(res.error || 'Could not delete subscriber.', 'error')
          return
        }
        setDeleteTarget(null)
        if (selectedSubscriber?.id === target.id) {
          setSelectedSubscriber(null)
        }
        showToast(`${target.email_normalized} removed from subscribers.`)
        router.refresh()
      } catch {
        showToast('Failed to delete subscriber.', 'error')
      }
    })
  }

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch {
      showToast('Clipboard unavailable in this browser.', 'error')
    }
  }

  return (
    <div className={styles.pageWrap}>
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === 'error' ? styles.toastError : ''
          }`}
          role="status"
        >
          {toast.type === 'success' && <OpgIconCheck size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Unboxed Header matching Contacts Inbox & Client Partners */}
      <header className={styles.headerSection}>
        <h1 className={styles.headerTitle}>Newsletter Subscribers</h1>
        <p className={styles.headerSubtitle}>
          Manage OPG Insights audience subscriptions, double opt-in
          verification statuses, consent provenance, and mailing list exports.
        </p>
      </header>

      {/* Aligned Glassmorphic Toolbar */}
      <div className={styles.toolbarRow}>
        <div className={styles.searchBox}>
          <OpgIconSearch className={styles.searchIcon} size={16} />
          <input
            aria-label="Search subscribers by email, name, or source"
            className={styles.searchInput}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriber email or source…"
            type="search"
            value={searchQuery}
          />
          {searchQuery && (
            <button
              aria-label="Clear search query"
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              type="button"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.toolbarControls}>
          <button
            className={styles.glassPillBtn}
            disabled={filteredSubscribers.length === 0}
            onClick={handleExportCsv}
            title="Download filtered subscribers as CSV"
            type="button"
          >
            <ExportCsvIcon />
            <span>Export CSV</span>
          </button>

          {/* Date Filter Dropdown */}
          <div className={styles.filterDropdown} ref={dateDropdownRef}>
            <button
              aria-expanded={dateMenuOpen}
              aria-haspopup="dialog"
              aria-label={`Filter by subscription date: ${dateFilterLabel}`}
              className={`${styles.glassPillBtn} ${
                dateFilter !== 'all' ? styles.glassPillBtnActive : ''
              }`}
              onClick={() => setDateMenuOpen((prev) => !prev)}
              ref={dateTriggerRef}
              type="button"
            >
              <OpgIconCalendar className={styles.filterIconAmber} size={16} />
              <span>{dateFilterLabel}</span>
              <OpgIconChevron
                className={`${styles.filterChevron} ${
                  dateMenuOpen ? styles.filterChevronOpen : ''
                }`}
                size={14}
              />
            </button>

            {dateMenuOpen && (
              <div
                aria-label="Filter subscribers by date"
                className={styles.filterMenu}
              >
                {DATE_FILTER_OPTIONS.map((opt) => (
                  <button
                    className={`${styles.filterOption} ${
                      dateFilter === opt.value ? styles.filterOptionActive : ''
                    }`}
                    key={opt.value}
                    onClick={() => {
                      setDateFilter(opt.value)
                      if (opt.value !== 'custom') setCustomDate('')
                      setDateMenuOpen(false)
                    }}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
                <div className={styles.menuDivider} />
                <div className={styles.customDateBox}>
                  <span className={styles.customDateTitle}>Specific date</span>
                  <input
                    aria-label="Filter subscribers by exact date"
                    className={styles.customDateInput}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        setCustomDate(val)
                        setDateFilter('custom')
                        setDateMenuOpen(false)
                      } else {
                        setCustomDate('')
                        setDateFilter('all')
                      }
                    }}
                    type="date"
                    value={customDate}
                  />
                </div>
                {dateFilter !== 'all' && (
                  <button
                    className={styles.dateResetBtn}
                    onClick={() => {
                      setDateFilter('all')
                      setCustomDate('')
                      setDateMenuOpen(false)
                    }}
                    type="button"
                  >
                    Reset Date
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Dropdown Pill */}
          <div className={styles.filterDropdown} ref={statusDropdownRef}>
            <button
              aria-controls={statusMenuId}
              aria-expanded={statusMenuOpen}
              aria-haspopup="menu"
              aria-label={`Filter by status: ${activeStatusOption.label}`}
              className={styles.glassPillBtn}
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setStatusMenuOpen(true)
                  requestAnimationFrame(() => {
                    statusMenuRef.current?.querySelector('button')?.focus()
                  })
                }
              }}
              ref={statusTriggerRef}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`${styles.statusDot} ${STATUS_DOT_CLASS[activeStatusOption.value]}`}
              />
              <strong>{activeStatusOption.label}</strong>
              <span className={styles.filterBadgeCount}>
                {activeStatusOption.count}
              </span>
              <OpgIconChevron
                className={`${styles.filterChevron} ${
                  statusMenuOpen ? styles.filterChevronOpen : ''
                }`}
                size={15}
              />
            </button>

            {statusMenuOpen && (
              <div
                aria-label="Filter subscribers by status"
                className={styles.filterMenu}
                id={statusMenuId}
                onKeyDown={(e) => {
                  const buttons = Array.from(
                    e.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
                  )
                  const index = buttons.indexOf(
                    document.activeElement as HTMLButtonElement,
                  )
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    buttons[(index + 1) % buttons.length]?.focus()
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    buttons[
                      (index - 1 + buttons.length) % buttons.length
                    ]?.focus()
                  } else if (e.key === 'Home') {
                    e.preventDefault()
                    buttons[0]?.focus()
                  } else if (e.key === 'End') {
                    e.preventDefault()
                    buttons[buttons.length - 1]?.focus()
                  }
                }}
                ref={statusMenuRef}
                role="menu"
              >
                {statusOptions.map((opt) => {
                  const isSelected = statusFilter === opt.value
                  return (
                    <button
                      aria-checked={isSelected}
                      className={`${styles.filterOption} ${
                        isSelected ? styles.filterOptionActive : ''
                      }`}
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value)
                        setStatusMenuOpen(false)
                      }}
                      role="menuitemradio"
                      type="button"
                    >
                      <span className={styles.filterOptionLead}>
                        <span
                          aria-hidden="true"
                          className={`${styles.statusDot} ${STATUS_DOT_CLASS[opt.value]}`}
                        />
                        <span>{opt.label}</span>
                      </span>
                      <span className={styles.filterOptionCount}>
                        {opt.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {canManage && (
            <button
              className={styles.addPrimaryBtn}
              onClick={() => {
                setAddError('')
                setAddModalOpen(true)
              }}
              type="button"
            >
              <OpgIconPlus size={15} />
              <span>Add Subscriber</span>
            </button>
          )}
        </div>
      </div>

      {/* Glassmorphic Table Card */}
      <div className={styles.tableCard}>
        {filteredSubscribers.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No subscribers found</h2>
            <p className={styles.emptyDesc}>
              {initialSubscribers.length === 0
                ? 'No readers have subscribed to OPG Insights yet.'
                : 'No subscribers matched your current search or filter criteria.'}
            </p>
            {hasActiveFilters && (
              <button
                className={styles.btnSecondary}
                onClick={handleResetFilters}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <caption className="sr-only">
                OPG Insights newsletter subscribers and consent provenance
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '36%' }}>
                    Subscriber
                  </th>
                  <th scope="col" style={{ width: '24%' }}>
                    Source &amp; Consent
                  </th>
                  <th scope="col" style={{ width: '20%' }}>
                    Timeline
                  </th>
                  <th scope="col" style={{ width: '12%' }}>
                    Status
                  </th>
                  {canManage && (
                    <th
                      scope="col"
                      style={{ width: '8%', textAlign: 'right' }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((sub) => {
                  const displayName = deriveSubscriberDisplayName(sub)
                  const secondaryTimeline =
                    sub.status === 'confirmed' && sub.confirmed_at
                      ? `Verified ${formatShortDate(sub.confirmed_at)}`
                      : sub.status === 'unsubscribed' && sub.unsubscribed_at
                        ? `Opted out ${formatShortDate(sub.unsubscribed_at)}`
                        : 'Awaiting opt-in confirmation'

                  return (
                    <tr
                      aria-label={`Inspect subscriber ${sub.email_normalized}`}
                      className={styles.tableRow}
                      key={sub.id}
                      onClick={(event) => {
                        if (
                          event.target instanceof Element &&
                          event.target.closest('button, a')
                        ) {
                          return
                        }
                        setCopiedEmail(false)
                        setSelectedSubscriber(sub)
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setCopiedEmail(false)
                          setSelectedSubscriber(sub)
                        }
                      }}
                      tabIndex={0}
                    >
                      <td>
                        <div className={styles.subscriberCell}>
                          <AccountAvatar
                            avatarUrl={sub.avatar_url}
                            className={styles.avatarCircle}
                            displayName={displayName}
                            email={sub.email_normalized}
                            size={36}
                          />
                          <div className={styles.subscriberMeta}>
                            <span className={styles.subscriberName}>
                              {displayName}
                            </span>
                            <span className={styles.subscriberEmail}>
                              {sub.email_normalized}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.sourceCell}>
                          <span className={styles.sourceBadge}>
                            {formatConsentSource(sub.consent_source)}
                          </span>
                          <span className={styles.versionTag}>
                            Consent v{sub.consent_version}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.timelineCell}>
                          <span className={styles.timelinePrimary}>
                            {formatShortDate(sub.created_at)}
                          </span>
                          <span className={styles.timelineSecondary}>
                            {secondaryTimeline}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.statusPill} ${STATUS_PILL_CLASS[sub.status]}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`${styles.statusDot} ${STATUS_DOT_CLASS[sub.status]}`}
                          />
                          <span>{getSubscriberStatusLabel(sub.status)}</span>
                        </span>
                      </td>

                      {canManage && (
                        <td>
                          <div className={styles.actionsCell}>
                            {sub.status !== 'confirmed' && (
                              <button
                                aria-label={`Confirm ${sub.email_normalized}`}
                                className={`${styles.iconActionBtn} ${styles.iconActionBtnConfirm}`}
                                disabled={isPending}
                                onClick={() =>
                                  handleStatusChange(sub, 'confirmed')
                                }
                                title="Mark confirmed"
                                type="button"
                              >
                                <OpgIconCheck size={14} />
                              </button>
                            )}
                            {sub.status === 'pending_confirmation' && (
                              <button
                                aria-label={`Resend confirmation to ${sub.email_normalized}`}
                                className={styles.iconActionBtn}
                                disabled={isPending}
                                onClick={() => handleResendConfirmation(sub)}
                                title="Resend confirmation email"
                                type="button"
                              >
                                <OpgIconSend size={14} />
                              </button>
                            )}
                            <button
                              aria-label={`Delete ${sub.email_normalized}`}
                              className={`${styles.iconActionBtn} ${styles.iconActionBtnDelete}`}
                              disabled={isPending}
                              onClick={() => setDeleteTarget(sub)}
                              title="Remove subscriber"
                              type="button"
                            >
                              <OpgIconTrash size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.tableFooter}>
          <span>
            Showing <strong>{filteredSubscribers.length}</strong> of{' '}
            <strong>{initialSubscribers.length}</strong> subscriber
            {initialSubscribers.length === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <button
              className={styles.clearFilterLink}
              onClick={handleResetFilters}
              type="button"
            >
              Reset active filters
            </button>
          )}
        </div>
      </div>

      {/* Subscriber Provenance Detail Modal */}
      {activeSelectedSubscriber && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!isPending) setSelectedSubscriber(null)
          }}
        >
          <div
            aria-labelledby="subscriber-detail-title"
            aria-modal="true"
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <span className={styles.modalEyebrow}>
                  Consent &amp; Provenance Record
                </span>
                <h2 className={styles.modalTitle} id="subscriber-detail-title">
                  {deriveSubscriberDisplayName(activeSelectedSubscriber)}
                </h2>
                <p className={styles.modalSubtitle}>
                  {activeSelectedSubscriber.email_normalized}
                </p>
              </div>
              <button
                aria-label="Close subscriber details"
                className={styles.modalCloseBtn}
                disabled={isPending}
                onClick={() => setSelectedSubscriber(null)}
                type="button"
              >
                <OpgIconClose size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailProfileRow}>
                <div className={styles.detailProfileLead}>
                  <AccountAvatar
                    avatarUrl={activeSelectedSubscriber.avatar_url}
                    className={`${styles.avatarCircle} ${styles.detailAvatarLarge}`}
                    displayName={deriveSubscriberDisplayName(
                      activeSelectedSubscriber,
                    )}
                    email={activeSelectedSubscriber.email_normalized}
                    size={46}
                  />
                  <div className={styles.subscriberMeta}>
                    <span className={styles.subscriberName}>
                      {activeSelectedSubscriber.email_normalized}
                    </span>
                    <span className={styles.subscriberEmail}>
                      {formatConsentSource(
                        activeSelectedSubscriber.consent_source,
                      )}{' '}
                      · Policy v{activeSelectedSubscriber.consent_version}
                    </span>
                  </div>
                </div>
                <span
                  className={`${styles.statusPill} ${STATUS_PILL_CLASS[activeSelectedSubscriber.status]}`}
                >
                  <span
                    aria-hidden="true"
                    className={`${styles.statusDot} ${STATUS_DOT_CLASS[activeSelectedSubscriber.status]}`}
                  />
                  <span>
                    {getSubscriberStatusLabel(activeSelectedSubscriber.status)}
                  </span>
                </span>
              </div>

              <div className={styles.detailMetaGrid}>
                <div className={styles.detailMetaCard}>
                  <span className={styles.detailMetaLabel}>Subscribed At</span>
                  <span className={styles.detailMetaValue}>
                    {formatFullDateTime(activeSelectedSubscriber.created_at)}
                  </span>
                </div>
                <div className={styles.detailMetaCard}>
                  <span className={styles.detailMetaLabel}>
                    Confirmation Sent
                  </span>
                  <span className={styles.detailMetaValue}>
                    {formatFullDateTime(
                      activeSelectedSubscriber.confirmation_sent_at ||
                        activeSelectedSubscriber.created_at,
                    )}
                  </span>
                </div>
                <div className={styles.detailMetaCard}>
                  <span className={styles.detailMetaLabel}>Confirmed At</span>
                  <span className={styles.detailMetaValue}>
                    {formatFullDateTime(activeSelectedSubscriber.confirmed_at)}
                  </span>
                </div>
                <div className={styles.detailMetaCard}>
                  <span className={styles.detailMetaLabel}>
                    Unsubscribed At
                  </span>
                  <span className={styles.detailMetaValue}>
                    {formatFullDateTime(
                      activeSelectedSubscriber.unsubscribed_at,
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.modalActionGroup}>
                <button
                  className={styles.btnSecondary}
                  onClick={() =>
                    handleCopyEmail(activeSelectedSubscriber.email_normalized)
                  }
                  type="button"
                >
                  <OpgIconCopy size={14} />
                  <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                </button>
                {canManage && (
                  <button
                    className={styles.btnDangerOutline}
                    disabled={isPending}
                    onClick={() => setDeleteTarget(activeSelectedSubscriber)}
                    type="button"
                  >
                    <OpgIconTrash size={14} />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {canManage && (
                <div className={styles.modalActionGroup}>
                  {activeSelectedSubscriber.status ===
                    'pending_confirmation' && (
                    <button
                      className={styles.btnSecondary}
                      disabled={isPending}
                      onClick={() =>
                        handleResendConfirmation(activeSelectedSubscriber)
                      }
                      type="button"
                    >
                      <OpgIconSend size={14} />
                      <span>Resend Link</span>
                    </button>
                  )}
                  {activeSelectedSubscriber.status === 'confirmed' ? (
                    <button
                      className={styles.btnSecondary}
                      disabled={isPending}
                      onClick={() =>
                        handleStatusChange(
                          activeSelectedSubscriber,
                          'unsubscribed',
                        )
                      }
                      type="button"
                    >
                      Unsubscribe
                    </button>
                  ) : (
                    <button
                      className={styles.btnPrimary}
                      disabled={isPending}
                      onClick={() =>
                        handleStatusChange(
                          activeSelectedSubscriber,
                          'confirmed',
                        )
                      }
                      type="button"
                    >
                      <OpgIconCheck size={14} />
                      <span>
                        {activeSelectedSubscriber.status === 'unsubscribed'
                          ? 'Reactivate Subscriber'
                          : 'Mark Confirmed'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {addModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            if (!isPending) setAddModalOpen(false)
          }}
        >
          <div
            aria-labelledby="add-subscriber-title"
            aria-modal="true"
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <span className={styles.modalEyebrow}>Audience Registry</span>
                <h2 className={styles.modalTitle} id="add-subscriber-title">
                  Add Subscriber
                </h2>
                <p className={styles.modalSubtitle}>
                  Register an organization or reader email into OPG Insights
                  with recorded consent provenance.
                </p>
              </div>
              <button
                aria-label="Close add subscriber modal"
                className={styles.modalCloseBtn}
                disabled={isPending}
                onClick={() => setAddModalOpen(false)}
                type="button"
              >
                <OpgIconClose size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber}>
              <div className={styles.modalBody}>
                {addError && (
                  <div className={styles.modalError} role="alert">
                    {addError}
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="sub-add-email">
                    Email Address
                  </label>
                  <input
                    autoFocus
                    className={styles.fieldInput}
                    disabled={isPending}
                    id="sub-add-email"
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    type="email"
                    value={addEmail}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="sub-add-source">
                    Consent Source
                  </label>
                  <select
                    className={styles.fieldSelect}
                    disabled={isPending}
                    id="sub-add-source"
                    onChange={(e) => setAddSource(e.target.value)}
                    value={addSource}
                  >
                    {SUBSCRIBER_SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="sub-add-status">
                    Initial Opt-In Status
                  </label>
                  <select
                    className={styles.fieldSelect}
                    disabled={isPending}
                    id="sub-add-status"
                    onChange={(e) =>
                      setAddStatus(
                        e.target.value === 'pending_confirmation'
                          ? 'pending_confirmation'
                          : 'confirmed',
                      )
                    }
                    value={addStatus}
                  >
                    <option value="confirmed">
                      Confirmed (verified prior consent)
                    </option>
                    <option value="pending_confirmation">
                      Pending Confirmation (queue double opt-in email)
                    </option>
                  </select>
                  <p className={styles.fieldHint}>
                    Double opt-in automatically queues a verification link in
                    the notification outbox.
                  </p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.btnSecondary}
                  disabled={isPending}
                  onClick={() => setAddModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.btnPrimary}
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? 'Saving...' : 'Save Subscriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        confirmText="Delete Subscriber"
        description={`Are you sure you want to permanently remove ${deleteTarget?.email_normalized} from the OPG Insights subscriber list?`}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Subscriber"
        tone="danger"
      />
    </div>
  )
}
