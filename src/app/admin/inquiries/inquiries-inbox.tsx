'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { updateInquiryStatusAction } from '@/app/admin/inquiries/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import './inquiries.css'

export type InquiryStatus = 'all' | 'new' | 'read' | 'replied' | 'archived'

export type InquiryItem = {
  id: string
  full_name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived' | 'spam_suspected'
  submitted_at: string
  retention_expires_at?: string
  ip_hash?: string
}

export function parseInquiryDetails(subject: string) {
  let type: 'Client' | 'Talent' | 'General' = 'General'
  let cleanSubject = subject.trim()

  if (/^\[Client\]/i.test(cleanSubject)) {
    type = 'Client'
    cleanSubject = cleanSubject.replace(/^\[Client\]\s*/i, '')
  } else if (/^\[Talent\]/i.test(cleanSubject)) {
    type = 'Talent'
    cleanSubject = cleanSubject.replace(/^\[Talent\]\s*/i, '')
  }

  return { type, cleanSubject }
}

function formatInboxDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr

  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase()
}

const REPLY_TEMPLATES = [
  {
    id: 'ack',
    label: 'General Ack',
    title: 'General Acknowledgement',
    getSubject: (cleanSubject: string) => `Re: ${cleanSubject}`,
    getBody: (firstName: string, cleanSubject: string) =>
      `Hi ${firstName},\n\nThank you for reaching out to Outsourced Pro Global regarding ${cleanSubject}.\n\nWe have received your message and our team is currently reviewing your inquiry. We will follow up with next steps within one business day.\n\nBest regards,\nOutsourced Pro Global Team`,
  },
  {
    id: 'client_call',
    label: 'Client Consultation',
    title: 'Client Staffing Consultation',
    getSubject: (cleanSubject: string) =>
      `Re: Dedicated Pod Consultation — ${cleanSubject}`,
    getBody: (firstName: string) =>
      `Hi ${firstName},\n\nThank you for reaching out to Outsourced Pro Global regarding our staffing solutions.\n\nWe would be glad to schedule a 20-minute discovery call to learn more about your talent needs and discuss how our dedicated cross-border pods can support your team.\n\nPlease let us know what days and times this week work best for you.\n\nBest regards,\nOutsourced Pro Global Client Solutions`,
  },
  {
    id: 'talent_portal',
    label: 'Talent & Careers',
    title: 'Talent & Careers Portal',
    getSubject: (cleanSubject: string) =>
      `Re: OPG Career Opportunities — ${cleanSubject}`,
    getBody: (firstName: string) =>
      `Hi ${firstName},\n\nThank you for your interest in career opportunities with Outsourced Pro Global!\n\nOur talent acquisition team regularly reviews candidate submissions. You can also browse active openings and apply directly through our official careers portal at /careers.\n\nWe appreciate you connecting with us.\n\nBest regards,\nOPG Talent Acquisition Team`,
  },
  {
    id: 'need_info',
    label: 'Request Details',
    title: 'Request More Details & Scope',
    getSubject: (cleanSubject: string) =>
      `Re: Additional Details Needed — ${cleanSubject}`,
    getBody: (firstName: string) =>
      `Hi ${firstName},\n\nThank you for contacting Outsourced Pro Global.\n\nTo ensure we route your inquiry to the right specialists and prepare the best proposal, could you please provide a few additional details regarding your project scope, target timeline, and team size requirements?\n\nLooking forward to hearing from you.\n\nBest regards,\nOutsourced Pro Global Support`,
  },
]

function getAvatarHue(name: string) {
  return (
    (Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 50) + 24
  )
}

export function InquiriesInbox({
  initialInquiries,
  canManage,
  initialStatus = 'all',
}: {
  initialInquiries: InquiryItem[]
  canManage: boolean
  initialStatus?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, InquiryItem['status']>
  >({})

  const inquiries = useMemo(() => {
    return initialInquiries.map((inq) => ({
      ...inq,
      status: statusOverrides[inq.id] || inq.status,
    }))
  }, [initialInquiries, statusOverrides])

  const urlStatus = searchParams?.get('status') as InquiryStatus | null
  const selectedStatus: InquiryStatus =
    urlStatus && ['all', 'new', 'read', 'replied', 'archived'].includes(urlStatus)
      ? urlStatus
      : ((initialStatus as InquiryStatus) || 'all')

  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(
    null,
  )
  const [isReplying, setIsReplying] = useState(false)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ack')
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dropdownRootRef = useRef<HTMLDivElement>(null)
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const modalDialogRef = useRef<HTMLDialogElement>(null)
  const dropdownMenuId = useId()

  const handleOpenInquiry = useCallback((inq: InquiryItem) => {
    const { cleanSubject } = parseInquiryDetails(inq.subject)
    const firstName = inq.full_name.trim().split(' ')[0] || 'there'
    const defaultTemplate = REPLY_TEMPLATES[0]
    setReplySubject(defaultTemplate.getSubject(cleanSubject))
    setReplyBody(defaultTemplate.getBody(firstName, cleanSubject))
    setSelectedTemplateId('ack')
    setCopiedEmail(false)
    setIsReplying(false)
    setSelectedInquiry(inq)
  }, [])

  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      if (!selectedInquiry) return
      const tmpl = REPLY_TEMPLATES.find((t) => t.id === templateId)
      if (!tmpl) return
      const firstName =
        selectedInquiry.full_name.trim().split(' ')[0] || 'there'
      const { cleanSubject } = parseInquiryDetails(selectedInquiry.subject)
      setReplySubject(tmpl.getSubject(cleanSubject))
      setReplyBody(tmpl.getBody(firstName, cleanSubject))
      setSelectedTemplateId(templateId)
    },
    [selectedInquiry],
  )

  // Toast timer
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // Click outside to close dropdown
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(event: PointerEvent | FocusEvent) {
      if (!dropdownRootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
        dropdownTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('focusin', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('focusin', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  // Modal open / close sync with native dialog
  useEffect(() => {
    const dialog = modalDialogRef.current
    if (!dialog) return

    if (selectedInquiry) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [selectedInquiry])

  const counts = useMemo(() => {
    const total = inquiries.length
    const countNew = inquiries.filter((i) => i.status === 'new').length
    const countRead = inquiries.filter((i) => i.status === 'read').length
    const countReplied = inquiries.filter((i) => i.status === 'replied').length
    const countArchived = inquiries.filter((i) => i.status === 'archived').length
    return { all: total, new: countNew, read: countRead, replied: countReplied, archived: countArchived }
  }, [inquiries])

  const filterOptions: { label: string; value: InquiryStatus; count: number }[] = [
    { label: 'All Inquiries', value: 'all', count: counts.all },
    { label: 'New', value: 'new', count: counts.new },
    { label: 'Read', value: 'read', count: counts.read },
    { label: 'Replied', value: 'replied', count: counts.replied },
    { label: 'Archived', value: 'archived', count: counts.archived },
  ]

  const activeOption = filterOptions.find((o) => o.value === selectedStatus) || filterOptions[0]

  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return inquiries.filter((item) => {
      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'archived') {
          if (item.status !== 'archived' && item.status !== 'spam_suspected') return false
        } else if (item.status !== selectedStatus) {
          return false
        }
      }
      // Search filter
      if (!q) return true
      const { cleanSubject, type } = parseInquiryDetails(item.subject)
      return (
        item.full_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        cleanSubject.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      )
    })
  }, [inquiries, selectedStatus, searchQuery])

  const handleSelectStatus = (status: InquiryStatus) => {
    setDropdownOpen(false)
    const url = status === 'all' ? '/admin/inquiries' : `/admin/inquiries?status=${status}`
    router.replace(url, { scroll: false })
  }

  const handleUpdateStatus = useCallback(
    (newStatus: 'new' | 'read' | 'replied' | 'archived') => {
      if (!selectedInquiry) return
      const targetId = selectedInquiry.id
      if (selectedInquiry.status === newStatus) return

      // Optimistic update via status overrides
      setStatusOverrides((prev) => ({ ...prev, [targetId]: newStatus }))
      setSelectedInquiry((prev) =>
        prev && prev.id === targetId ? { ...prev, status: newStatus } : prev,
      )

      startTransition(async () => {
        try {
          await updateInquiryStatusAction(targetId, newStatus)
          setToast({
            message: `Inquiry status changed to ${newStatus.toUpperCase()}`,
            type: 'success',
          })
          router.refresh()
        } catch {
          setToast({
            message: 'Failed to update inquiry status. Please try again.',
            type: 'error',
          })
        }
      })
    },
    [router, selectedInquiry],
  )

  const handleOpenMailto = (markAsReplied = false) => {
    if (!selectedInquiry) return
    const subjectParam = encodeURIComponent(replySubject.trim())
    const bodyParam = encodeURIComponent(replyBody.trim())
    const mailtoUrl = `mailto:${selectedInquiry.email}?subject=${subjectParam}&body=${bodyParam}`
    window.open(mailtoUrl, '_blank')

    if (markAsReplied && selectedInquiry.status !== 'replied') {
      handleUpdateStatus('replied')
      setIsReplying(false)
    }
  }

  const handleCopyEmail = () => {
    if (!selectedInquiry) return
    navigator.clipboard.writeText(selectedInquiry.email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleCloseModal = () => {
    setSelectedInquiry(null)
    setIsReplying(false)
  }

  return (
    <div className="inquiries-inbox-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`inquiries-toast inquiries-toast--${toast.type}`}
          role="status"
        >
          <span className="inquiries-toast__icon">
            {toast.type === 'success' ? '✓' : '!'}
          </span>
          <p>{toast.message}</p>
          <button
            aria-label="Dismiss notification"
            className="inquiries-toast__close"
            onClick={() => setToast(null)}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Header & Controls Row */}
      <div className="inquiries-header-row">
        <div className="inquiries-header-content">
          <h1 className="inquiries-header-title">Inquiries Inbox</h1>
          <p className="inquiries-header-subtitle">
            Review and triage incoming submissions from institutional clients and talent
            candidates. Track response times, update triage statuses, and coordinate direct follow-ups.
          </p>
        </div>

        <div className="inquiries-header-controls inquiries-controls-bar">
          {/* Search Input */}
          <div className="inquiries-search-box">
            <svg
              aria-hidden="true"
              className="inquiries-search-icon"
              fill="none"
              height="18"
              style={{
                width: 18,
                height: 18,
                minWidth: 18,
                minHeight: 18,
                maxWidth: 18,
                maxHeight: 18,
                flexShrink: 0,
              }}
              viewBox="0 0 20 20"
              width="18"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="m13.5 13.5 4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
            <input
              aria-label="Search inquiries by sender, email, subject, or message"
              className="inquiries-search-input"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inquiries or sender…"
              type="search"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                className="inquiries-search-clear"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                ×
              </button>
            )}
          </div>

          {/* 1 Pill-shaped Glassmorphic Dropdown Filter */}
          <div className="inquiries-pill-filter" ref={dropdownRootRef}>
            <button
              aria-controls={dropdownMenuId}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              aria-label={`Filter by status: currently ${activeOption.label}`}
              className="inquiries-pill-filter__trigger"
              onClick={() => setDropdownOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setDropdownOpen(true)
                  requestAnimationFrame(() => {
                    dropdownMenuRef.current?.querySelector('button')?.focus()
                  })
                }
              }}
              ref={dropdownTriggerRef}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`inquiries-pill-filter__dot inquiries-pill-filter__dot--${activeOption.value}`}
              />
              <strong className="inquiries-pill-filter__title">
                {activeOption.label}
              </strong>
              <span className="inquiries-pill-filter__badge">
                {activeOption.count}
              </span>
              <svg
                aria-hidden="true"
                className={`inquiries-pill-filter__chevron ${
                  dropdownOpen ? 'inquiries-pill-filter__chevron--open' : ''
                }`}
                fill="none"
                height="16"
                style={{
                  width: 16,
                  height: 16,
                  minWidth: 16,
                  minHeight: 16,
                  maxWidth: 16,
                  maxHeight: 16,
                  flexShrink: 0,
                }}
                viewBox="0 0 20 20"
                width="16"
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

          {dropdownOpen && (
            <div
              aria-label="Filter inquiries by status"
              className="inquiries-pill-filter__menu"
              id={dropdownMenuId}
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
              ref={dropdownMenuRef}
              role="menu"
            >
              {filterOptions.map((option) => {
                const isSelected = selectedStatus === option.value
                return (
                  <button
                    aria-checked={isSelected}
                    className={`inquiries-pill-filter__option ${
                      isSelected ? 'inquiries-pill-filter__option--active' : ''
                    }`}
                    key={option.value}
                    onClick={() => handleSelectStatus(option.value)}
                    role="menuitemradio"
                    type="button"
                  >
                    <span className="inquiries-pill-filter__option-lead">
                      <span
                        aria-hidden="true"
                        className={`inquiries-pill-filter__dot inquiries-pill-filter__dot--${option.value}`}
                      />
                      <span className="inquiries-pill-filter__option-name">
                        {option.label}
                      </span>
                    </span>
                    <span className="inquiries-pill-filter__option-count">
                      {option.count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Glassmorphic Card Table (Email Inbox Style) */}
      <div className="inquiries-card-table">
        <div className="inquiries-table-scroll">
          <table className="inquiries-inbox-table">
            <caption className="sr-only">
              Incoming contact inquiries and communications
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '95px' }}>
                  Type
                </th>
                <th scope="col" style={{ width: '185px' }}>
                  Sender
                </th>
                <th scope="col">Subject &amp; Preview</th>
                <th scope="col" style={{ width: '85px', textAlign: 'right' }}>
                  Date
                </th>
                <th scope="col" style={{ width: '105px', textAlign: 'center' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inq) => {
                  const { type, cleanSubject } = parseInquiryDetails(inq.subject)
                  const isNew = inq.status === 'new'
                  const shortDate = formatInboxDate(inq.submitted_at)
                  const fullDate = formatFullDate(inq.submitted_at)

                  return (
                    <tr
                      aria-label={`Open inquiry from ${inq.full_name}: ${cleanSubject}`}
                      className={`inquiries-inbox-row ${
                        isNew ? 'inquiries-inbox-row--new' : ''
                      }`}
                      key={inq.id}
                      onClick={() => handleOpenInquiry(inq)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOpenInquiry(inq)
                        }
                      }}
                      tabIndex={0}
                    >
                      {/* Type of inquiry */}
                      <td className="inquiries-col-type">
                        <span
                          className={`inquiry-type-pill inquiry-type-pill--${type.toLowerCase()}`}
                        >
                          {type}
                        </span>
                      </td>

                      {/* Sender */}
                      <td className="inquiries-col-sender">
                        <div className="inquiries-sender-cell">
                          {isNew && (
                            <span
                              aria-label="New unread inquiry"
                              className="inquiries-unread-indicator"
                              title="New"
                            />
                          )}
                          <div className="inquiries-sender-info">
                            <span className="inquiries-sender-name">
                              {inq.full_name}
                            </span>
                            <span className="inquiries-sender-email">
                              {inq.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Subject and Message Preview */}
                      <td className="inquiries-col-subject">
                        <div className="inquiries-message-preview-container">
                          <strong className="inquiries-preview-subject">
                            {cleanSubject}
                          </strong>
                          <span
                            aria-hidden="true"
                            className="inquiries-preview-separator"
                          >
                            —
                          </span>
                          <span className="inquiries-preview-text">
                            {inq.message.replace(/\s+/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="inquiries-col-date">
                        <time dateTime={inq.submitted_at} title={fullDate}>
                          {shortDate}
                        </time>
                      </td>

                      {/* Status */}
                      <td className="inquiries-col-status">
                        <StatusBadge
                          status={
                            inq.status === 'new'
                              ? 'draft'
                              : inq.status === 'read'
                                ? 'in_review'
                                : inq.status === 'replied'
                                  ? 'published'
                                  : 'archived'
                          }
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td className="inquiries-empty-cell" colSpan={5}>
                    <div className="inquiries-empty-state">
                      <div aria-hidden="true" className="inquiries-empty-icon">
                        ✦
                      </div>
                      <h3>No inquiries found</h3>
                      <p>
                        {searchQuery
                          ? `No inquiries match "${searchQuery}". Try a different keyword.`
                          : `There are no inquiries matching the "${activeOption.label}" filter.`}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="inquiries-card-table__footer">
          <span>
            Showing <strong>{filteredInquiries.length}</strong> of{' '}
            <strong>{inquiries.length}</strong> inquiries
          </span>
          {counts.new > 0 && (
            <span className="inquiries-new-badge">
              {counts.new} unread inquiry{counts.new > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Pop-up Modal to View Message, Details, and Reply */}
      <dialog
        aria-labelledby="inquiry-modal-title"
        className="inquiries-modal"
        onCancel={(e) => {
          e.preventDefault()
          handleCloseModal()
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCloseModal()
          }
        }}
        ref={modalDialogRef}
      >
        {selectedInquiry && (
          <div className="inquiries-modal__card">
            {/* Modal Card Header */}
            <header className="inquiries-modal__header">
              <div className="inquiries-modal__header-top">
                <div className="inquiries-modal__sender-wrapper">
                  <div
                    aria-hidden="true"
                    className="inquiries-modal__avatar"
                    style={
                      {
                        '--avatar-hue': getAvatarHue(selectedInquiry.full_name),
                      } as CSSProperties
                    }
                  >
                    {getAvatarInitials(selectedInquiry.full_name)}
                  </div>
                  <div className="inquiries-modal__sender-info">
                    <div className="inquiries-modal__sender-line">
                      <strong className="inquiries-modal__sender-name">
                        {selectedInquiry.full_name}
                      </strong>
                      <span
                        className={`inquiry-type-pill inquiry-type-pill--${parseInquiryDetails(selectedInquiry.subject).type.toLowerCase()}`}
                      >
                        {parseInquiryDetails(selectedInquiry.subject).type}
                      </span>
                      <StatusBadge
                        status={
                          selectedInquiry.status === 'new'
                            ? 'draft'
                            : selectedInquiry.status === 'read'
                              ? 'in_review'
                              : selectedInquiry.status === 'replied'
                                ? 'published'
                                : 'archived'
                        }
                      />
                    </div>
                    <div className="inquiries-modal__sender-meta">
                      <span className="inquiries-modal__sender-email">
                        &lt;{selectedInquiry.email}&gt;
                      </span>
                      <button
                        aria-label="Copy email address"
                        className="inquiries-modal__copy-pill"
                        onClick={handleCopyEmail}
                        type="button"
                      >
                        {copiedEmail ? 'Copied' : 'Copy'}
                      </button>
                      <span aria-hidden="true" className="inquiries-modal__meta-sep">
                        ·
                      </span>
                      <time
                        className="inquiries-modal__sender-date"
                        dateTime={selectedInquiry.submitted_at}
                      >
                        {formatFullDate(selectedInquiry.submitted_at)}
                      </time>
                    </div>
                  </div>
                </div>

                <div className="inquiries-modal__header-actions">
                  <span className="inquiries-modal__ref-tag">
                    OPG-{selectedInquiry.id.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    aria-label="Close dialog"
                    className="inquiries-modal__close-btn"
                    onClick={handleCloseModal}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </header>

            {/* Scrollable Content Container — Internal scrollbar preserves card's rounded corners */}
            <div className="inquiries-modal__scroll-content">
              {/* Subject Section with Clear Label */}
              <div className="inquiries-modal__subject-block">
                <span className="inquiries-modal__field-label">Subject</span>
                <h2
                  className="inquiries-modal__subject-text"
                  id="inquiry-modal-title"
                >
                  {parseInquiryDetails(selectedInquiry.subject).cleanSubject}
                </h2>
              </div>

              {/* Message Section with Clear Label */}
              <div className="inquiries-modal__message-block">
                <span className="inquiries-modal__field-label">Message</span>
                <div className="inquiries-modal__message-body">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Gmail-style Reply Area */}
              <div className="inquiries-modal__reply-container">
                {!isReplying ? (
                  /* Gmail Reply Trigger Row */
                  <div className="inquiries-modal__reply-trigger-row">
                    {canManage && (
                      <button
                        className="inquiries-gmail-reply-btn"
                        onClick={() => setIsReplying(true)}
                        type="button"
                      >
                        <svg
                          aria-hidden="true"
                          fill="none"
                          height="16"
                          style={{
                            width: 16,
                            height: 16,
                            minWidth: 16,
                            minHeight: 16,
                            flexShrink: 0,
                          }}
                          viewBox="0 0 20 20"
                          width="16"
                        >
                          <path
                            d="M8.5 4.5 3 10l5.5 5.5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                          <path
                            d="M3 10h9a5 5 0 0 1 5 5v1"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                        <span>Reply</span>
                      </button>
                    )}

                    <button
                      className="inquiries-gmail-client-btn"
                      onClick={() => handleOpenMailto(false)}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="15"
                        style={{
                          width: 15,
                          height: 15,
                          minWidth: 15,
                          minHeight: 15,
                          flexShrink: 0,
                        }}
                        viewBox="0 0 20 20"
                        width="15"
                      >
                        <path
                          d="M15 10.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5H9.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.6"
                        />
                        <path
                          d="m12.5 3.5 4 4m0-4-7.5 7.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                        />
                      </svg>
                      <span>Open in Mail App</span>
                    </button>
                  </div>
                ) : (
                  /* Gmail-Style Inline Reply Composer */
                  <div className="inquiries-gmail-composer">
                    {/* Quick Response Template Selector */}
                    <div className="inquiries-gmail-composer__template-bar">
                      <div className="inquiries-gmail-composer__template-left">
                        <svg
                          aria-hidden="true"
                          fill="none"
                          height="14"
                          style={{
                            width: 14,
                            height: 14,
                            minWidth: 14,
                            minHeight: 14,
                            flexShrink: 0,
                          }}
                          viewBox="0 0 20 20"
                          width="14"
                        >
                          <path
                            d="M3 5h14M3 10h14M3 15h9"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                          />
                        </svg>
                        <span>Template:</span>
                      </div>
                      <div className="inquiries-gmail-composer__template-chips">
                        {REPLY_TEMPLATES.map((tmpl) => (
                          <button
                            className={`inquiries-template-chip ${
                              selectedTemplateId === tmpl.id
                                ? 'inquiries-template-chip--active'
                                : ''
                            }`}
                            key={tmpl.id}
                            onClick={() => handleApplyTemplate(tmpl.id)}
                            title={tmpl.title}
                            type="button"
                          >
                            {tmpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="inquiries-gmail-composer__header">
                      <div className="inquiries-gmail-composer__to-field">
                        <span className="inquiries-gmail-composer__to-label">To:</span>
                        <span className="inquiries-gmail-composer__to-pill">
                          {selectedInquiry.full_name} &lt;{selectedInquiry.email}&gt;
                        </span>
                      </div>
                    </div>

                    <div className="inquiries-gmail-composer__subject-field">
                      <input
                        aria-label="Reply subject"
                        className="inquiries-gmail-composer__subject-input"
                        onChange={(e) => setReplySubject(e.target.value)}
                        placeholder="Subject"
                        type="text"
                        value={replySubject}
                      />
                    </div>

                    <div className="inquiries-gmail-composer__body-field">
                      <textarea
                        aria-label="Reply message body"
                        autoFocus
                        className="inquiries-gmail-composer__textarea"
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write your reply here…"
                        rows={6}
                        value={replyBody}
                      />
                    </div>

                    <div className="inquiries-gmail-composer__footer">
                      <div className="inquiries-gmail-composer__actions-right">
                        <button
                          className="inquiries-gmail-cancel-btn"
                          onClick={() => setIsReplying(false)}
                          type="button"
                        >
                          Cancel
                        </button>

                        <button
                          className="inquiries-gmail-send-btn"
                          disabled={isPending}
                          onClick={() => handleOpenMailto(true)}
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            fill="none"
                            height="14"
                            style={{
                              width: 14,
                              height: 14,
                              minWidth: 14,
                              minHeight: 14,
                              flexShrink: 0,
                            }}
                            viewBox="0 0 20 20"
                            width="14"
                          >
                            <path
                              d="m3 10 14-7-5 14-3-5-6-2Z"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.6"
                            />
                          </svg>
                          <span>Send Email &amp; Mark Replied</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Audit Reference */}
              {selectedInquiry.ip_hash && (
                <div className="inquiries-modal__audit-footer">
                  <span>
                    Audit Reference: <code>{selectedInquiry.ip_hash.slice(0, 16)}…</code>
                  </span>
                  {selectedInquiry.retention_expires_at && (
                    <span>
                      Retention Expiry:{' '}
                      <code>
                        {new Date(
                          selectedInquiry.retention_expires_at,
                        ).toLocaleDateString()}
                      </code>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  )
}
