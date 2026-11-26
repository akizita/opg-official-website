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
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  bulkDeleteInquiriesAction,
  bulkUpdateInquiryStatusAction,
  sendInquiryReplyAction,
  updateInquiryStatusAction,
  type BulkInquiryStatus,
} from '@/app/admin/inquiries/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCalendar,
  OpgIconChevron,
  OpgIconSearch,
  OpgIconSend,
} from '@/components/icons/opg-icons'
import { UserAvatar } from '@/components/ui/user-avatar'
import { createClient } from '@/lib/supabase/client'
import './inquiries.css'

import {
  playAdminNotificationSound,
  registerAdminAudioUnlock,
  unlockAdminAudio,
} from '@/lib/audio/admin-notification-sound'

export type InquiryStatus = 'all' | 'new' | 'read' | 'replied' | 'archived'

export type InquiryItem = {
  id: string
  full_name: string
  email: string
  avatar_url?: string | null
  gravatar_url?: string | null
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

export function InquiryStatusBadge({
  status,
}: {
  status: InquiryItem['status']
}) {
  switch (status) {
    case 'new':
      return (
        <span className="inquiry-status-pill inquiry-status-pill--new">
          <span aria-hidden="true" className="inquiry-status-pill__dot" />
          <span>New</span>
        </span>
      )
    case 'replied':
      return (
        <span className="inquiry-status-pill inquiry-status-pill--replied">
          <span aria-hidden="true" className="inquiry-status-pill__dot" />
          <span>Replied</span>
        </span>
      )
    case 'read':
      return (
        <span className="inquiry-status-pill inquiry-status-pill--read">
          <span aria-hidden="true" className="inquiry-status-pill__dot" />
          <span>Read</span>
        </span>
      )
    case 'spam_suspected':
      return (
        <span className="inquiry-status-pill inquiry-status-pill--spam">
          <span aria-hidden="true" className="inquiry-status-pill__dot" />
          <span>Spam</span>
        </span>
      )
    case 'archived':
    default:
      return (
        <span className="inquiry-status-pill inquiry-status-pill--archived">
          <span aria-hidden="true" className="inquiry-status-pill__dot" />
          <span>Archived</span>
        </span>
      )
  }
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

export function formatSheetDateTime(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const datePart = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart} at ${timePart}`
}

function formatSheetShortDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMiddleTruncate(value: string, startChars = 8, endChars = 6) {
  const trimmed = value.trim()
  if (trimmed.length <= startChars + endChars + 1) return trimmed
  return `${trimmed.slice(0, startChars)}…${trimmed.slice(-endChars)}`
}

export function getSheetStatusMeta(status: InquiryItem['status']) {
  switch (status) {
    case 'replied':
      return { tone: 'replied', label: 'Replied' }
    case 'new':
      return { tone: 'pending', label: 'New' }
    case 'read':
      return { tone: 'pending', label: 'Read' }
    case 'spam_suspected':
      return { tone: 'neutral', label: 'Spam' }
    case 'archived':
    default:
      return { tone: 'neutral', label: 'Archived' }
  }
}

function SheetCopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function SheetCheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function SheetCloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function SheetCornerUpLeftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  )
}

function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase()
}

function formatTemplateSubject(templateTitle: string, cleanSubject: string) {
  const trimmed = cleanSubject.trim()
  return trimmed ? `Re: ${templateTitle} — ${trimmed}` : `Re: ${templateTitle}`
}

export const REPLY_TEMPLATES = [
  {
    id: 'ack',
    label: 'General Ack',
    title: 'General Acknowledgement',
    getSubject: (cleanSubject: string) =>
      formatTemplateSubject('OPG Inquiry Acknowledgement', cleanSubject),
    getBody: (firstName: string, cleanSubject: string) =>
      `Hi ${firstName},\n\nThank you for reaching out to Outsourced Pro Global regarding ${cleanSubject}.\n\nWe have received your message and our team is currently reviewing your inquiry. We will follow up with next steps within one business day.\n\nBest regards,\nOutsourced Pro Global Team`,
  },
  {
    id: 'client_call',
    label: 'Client Consultation',
    title: 'Client Staffing Consultation',
    getSubject: (cleanSubject: string) =>
      formatTemplateSubject('OPG Client Staffing Consultation', cleanSubject),
    getBody: (firstName: string) =>
      `Hi ${firstName},\n\nThank you for reaching out to Outsourced Pro Global regarding our staffing solutions.\n\nWe would be glad to schedule a 20-minute discovery call to learn more about your talent needs and discuss how our dedicated cross-border pods can support your team.\n\nPlease let us know what days and times this week work best for you.\n\nBest regards,\nOutsourced Pro Global Client Solutions`,
  },
  {
    id: 'talent_portal',
    label: 'Talent & Careers',
    title: 'Talent & Careers Portal',
    getSubject: (cleanSubject: string) =>
      formatTemplateSubject('OPG Career Opportunities', cleanSubject),
    getBody: (firstName: string) =>
      `Hi ${firstName},\n\nThank you for your interest in career opportunities with Outsourced Pro Global!\n\nOur talent acquisition team regularly reviews candidate submissions. You can also browse active openings and apply directly through our official careers portal at /careers.\n\nWe appreciate you connecting with us.\n\nBest regards,\nOPG Talent Acquisition Team`,
  },
  {
    id: 'need_info',
    label: 'Request Details',
    title: 'Request More Details & Scope',
    getSubject: (cleanSubject: string) =>
      formatTemplateSubject('OPG Project Scope & Details Request', cleanSubject),
    getBody: (firstName: string) =>
      `Hi ${firstName},\n\nThank you for contacting Outsourced Pro Global.\n\nTo ensure we route your inquiry to the right specialists and prepare the best proposal, could you please provide a few additional details regarding your project scope, target timeline, and team size requirements?\n\nLooking forward to hearing from you.\n\nBest regards,\nOutsourced Pro Global Support`,
  },
]

function getAvatarHue(name: string) {
  return (
    (Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 50) + 24
  )
}

export function InquirySenderAvatar({
  avatarUrl,
  gravatarUrl,
  name,
  email,
  size = 34,
  className = '',
}: {
  avatarUrl?: string | null
  gravatarUrl?: string | null
  name: string
  email: string
  size?: number
  className?: string
}) {
  const initials = getAvatarInitials(name)
  const hue = getAvatarHue(name)

  return (
    <span
      className={`inquiry-sender-avatar ${className}`}
      aria-hidden="true"
      style={
        {
          '--avatar-hue': hue,
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        } as CSSProperties
      }
    >
      <UserAvatar
        className="inquiry-sender-avatar-inner"
        email={email}
        fallbackSrc={gravatarUrl}
        imgClassName="inquiry-sender-avatar-img"
        initials={initials}
        initialsClassName="inquiry-sender-avatar-initials"
        name={name}
        size={size}
        src={avatarUrl}
      />
    </span>
  )
}

export interface InquiryDetailSheetProps {
  inquiry: InquiryItem
  canManage: boolean
  copiedEmail: boolean
  copiedAudit: boolean
  dragOffsetY?: number
  isReplying: boolean
  isSendingReply: boolean
  isUpdatingStatus: boolean
  replySubject: string
  replyBody: string
  replyError: string | null
  selectedTemplateId: string
  replyBodyId: string
  replySubjectId: string
  scrollContentRef?: RefObject<HTMLDivElement | null>
  onClose: () => void
  onCopyEmail: () => void
  onCopyAudit: () => void
  onStartReply: () => void
  onCancelReply: () => void
  onSendReply: () => void
  onUpdateStatus: (status: 'new' | 'read' | 'archived') => void
  onApplyTemplate: (templateId: string) => void
  onChangeReplySubject: (val: string) => void
  onChangeReplyBody: (val: string) => void
  onTouchStartHeader?: (e: ReactTouchEvent<HTMLElement>) => void
  onTouchStartScroll?: (e: ReactTouchEvent<HTMLElement>) => void
  onTouchMoveSheet?: (e: ReactTouchEvent<HTMLElement>) => void
  onTouchEndSheet?: () => void
}

export function InquiryDetailSheet({
  inquiry,
  canManage,
  copiedEmail,
  copiedAudit,
  dragOffsetY = 0,
  isReplying,
  isSendingReply,
  isUpdatingStatus,
  replySubject,
  replyBody,
  replyError,
  selectedTemplateId,
  replyBodyId,
  replySubjectId,
  scrollContentRef,
  onClose,
  onCopyEmail,
  onCopyAudit,
  onStartReply,
  onCancelReply,
  onSendReply,
  onUpdateStatus,
  onApplyTemplate,
  onChangeReplySubject,
  onChangeReplyBody,
  onTouchStartHeader,
  onTouchStartScroll,
  onTouchMoveSheet,
  onTouchEndSheet,
}: InquiryDetailSheetProps) {
  const { type, cleanSubject } = parseInquiryDetails(inquiry.subject)
  const statusMeta = getSheetStatusMeta(inquiry.status)
  const referenceCode = `OPG-${inquiry.id.slice(0, 8).toUpperCase()}`
  const isArchived = inquiry.status === 'archived'
  const isUnread = inquiry.status === 'new'

  return (
    <div
      className="inquiries-modal__card"
      onTouchCancel={onTouchEndSheet}
      onTouchEnd={onTouchEndSheet}
      onTouchMove={onTouchMoveSheet}
      style={
        dragOffsetY > 0
          ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' }
          : undefined
      }
    >
      <div aria-hidden="true" className="inquiries-sheet__grabber" />

      <header
        className="inquiries-modal__header"
        onTouchStart={onTouchStartHeader}
      >
        <div className="inquiries-modal__header-top">
          <div className="inquiries-modal__sender-wrapper">
            <InquirySenderAvatar
              avatarUrl={inquiry.avatar_url}
              className="inquiries-sheet__avatar"
              email={inquiry.email}
              gravatarUrl={inquiry.gravatar_url}
              name={inquiry.full_name}
              size={48}
            />
            <div className="inquiries-modal__sender-info">
              <h2 className="inquiries-sheet__title" id="inquiry-modal-title">
                {inquiry.full_name}
              </h2>
              <div className="inquiries-sheet__email-row">
                <span className="inquiries-sheet__email">{inquiry.email}</span>
                <button
                  aria-label={
                    copiedEmail ? 'Email address copied' : 'Copy email address'
                  }
                  className={`inquiries-sheet__icon-copy ${
                    copiedEmail ? 'inquiries-sheet__icon-copy--copied' : ''
                  }`}
                  onClick={onCopyEmail}
                  title={copiedEmail ? 'Copied' : 'Copy email'}
                  type="button"
                >
                  {copiedEmail ? (
                    <SheetCheckIcon size={16} />
                  ) : (
                    <SheetCopyIcon size={16} />
                  )}
                </button>
              </div>
              <div className="inquiries-sheet__meta-line">
                <span className="inquiries-sheet__meta-type">{type}</span>
                <span aria-hidden="true" className="inquiries-sheet__meta-dot-sep">
                  ·
                </span>
                <span
                  className={`inquiries-sheet__status inquiries-sheet__status--${statusMeta.tone}`}
                >
                  <span
                    aria-hidden="true"
                    className="inquiries-sheet__status-dot"
                  />
                  <span>{statusMeta.label}</span>
                </span>
                <span aria-hidden="true" className="inquiries-sheet__meta-dot-sep">
                  ·
                </span>
                <time dateTime={inquiry.submitted_at}>
                  {formatSheetDateTime(inquiry.submitted_at)}
                </time>
              </div>
            </div>
          </div>

          <button
            aria-label="Close dialog"
            className="inquiries-sheet__close-btn"
            onClick={onClose}
            type="button"
          >
            <SheetCloseIcon size={14} />
          </button>
        </div>
      </header>

      <div
        className="inquiries-modal__scroll-content"
        onTouchStart={onTouchStartScroll}
        ref={scrollContentRef}
      >
        <section className="inquiries-sheet__group">
          <span className="inquiries-sheet__group-label inquiries-sheet__group-label--muted">
            Subject
          </span>
          <div className="inquiries-sheet__context-card">
            <div className="inquiries-sheet__row inquiries-sheet__row--subject">
              {cleanSubject}
            </div>
          </div>
        </section>

        <section className="inquiries-sheet__group">
          <span className="inquiries-sheet__group-label inquiries-sheet__group-label--muted">
            Message
          </span>
          <div className="inquiries-sheet__context-card">
            <div className="inquiries-sheet__row inquiries-sheet__row--message">
              {inquiry.message}
            </div>
          </div>
        </section>

        {isReplying && canManage && (
          <section className="inquiries-sheet__group">
            <span className="inquiries-sheet__group-label">Reply</span>
            <div className="inquiries-sheet__composer">
              <div className="inquiries-sheet__composer-row">
                <span className="inquiries-sheet__composer-row-label">To</span>
                <span className="inquiries-sheet__composer-to">
                  {inquiry.full_name} &lt;{inquiry.email}&gt;
                </span>
              </div>

              <div className="inquiries-sheet__composer-row">
                <label
                  className="inquiries-sheet__composer-row-label"
                  htmlFor={replySubjectId}
                >
                  Subject
                </label>
                <input
                  aria-label="Reply subject"
                  className="inquiries-sheet__composer-input"
                  id={replySubjectId}
                  onChange={(e) => onChangeReplySubject(e.target.value)}
                  placeholder="Subject"
                  type="text"
                  value={replySubject}
                />
              </div>

              <div className="inquiries-sheet__composer-body-row">
                <div className="inquiries-sheet__composer-body-header">
                  <label
                    className="inquiries-sheet__composer-row-label"
                    htmlFor={replyBodyId}
                  >
                    Message
                  </label>
                  <div className="inquiries-template-select-wrap">
                    <select
                      aria-label="Select response template"
                      className="inquiries-template-select"
                      onChange={(e) => onApplyTemplate(e.target.value)}
                      value={selectedTemplateId}
                    >
                      {REPLY_TEMPLATES.map((tmpl) => (
                        <option
                          className="inquiries-template-select-option"
                          key={tmpl.id}
                          value={tmpl.id}
                        >
                          {tmpl.title}
                        </option>
                      ))}
                    </select>
                    <span
                      aria-hidden="true"
                      className="inquiries-template-select-chevron"
                    >
                      <OpgIconChevron size={12} />
                    </span>
                  </div>
                </div>
                <textarea
                  aria-label="Reply message body"
                  autoFocus
                  className="inquiries-sheet__composer-textarea"
                  id={replyBodyId}
                  onChange={(e) => onChangeReplyBody(e.target.value)}
                  placeholder="Write your reply here…"
                  rows={5}
                  value={replyBody}
                />
              </div>

              {replyError && (
                <div className="inquiries-gmail-composer__error" role="alert">
                  {replyError}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="inquiries-sheet__meta-footer">
          <span>Ref: {referenceCode}</span>
          {inquiry.retention_expires_at && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Retention until{' '}
                <time dateTime={inquiry.retention_expires_at}>
                  {formatSheetShortDate(inquiry.retention_expires_at)}
                </time>
              </span>
            </>
          )}
          {inquiry.ip_hash && (
            <>
              <span aria-hidden="true">·</span>
              <button
                aria-label={
                  copiedAudit
                    ? 'Audit reference copied'
                    : 'Copy audit reference'
                }
                className={`inquiries-sheet__audit-copy-btn ${
                  copiedAudit ? 'inquiries-sheet__audit-copy-btn--copied' : ''
                }`}
                onClick={onCopyAudit}
                title={inquiry.ip_hash}
                type="button"
              >
                <span>Audit: {formatMiddleTruncate(inquiry.ip_hash)}</span>
                {copiedAudit ? (
                  <SheetCheckIcon size={12} />
                ) : (
                  <SheetCopyIcon size={12} />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <footer className="inquiries-sheet__actions">
        {!isReplying ? (
          canManage ? (
            <>
              <button
                className="inquiries-sheet__primary-btn"
                disabled={isUpdatingStatus}
                onClick={onStartReply}
                type="button"
              >
                <SheetCornerUpLeftIcon size={18} />
                <span>Reply</span>
              </button>
              <div className="inquiries-sheet__secondary-row">
                <button
                  className="inquiries-sheet__secondary-btn"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    onUpdateStatus(isUnread || isArchived ? 'read' : 'new')
                  }
                  type="button"
                >
                  {isArchived
                    ? 'Restore to read'
                    : isUnread
                      ? 'Mark as read'
                      : 'Mark as unread'}
                </button>
                {!isArchived && (
                  <button
                    className="inquiries-sheet__secondary-btn"
                    disabled={isUpdatingStatus}
                    onClick={() => onUpdateStatus('archived')}
                    type="button"
                  >
                    Archive
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              className="inquiries-sheet__secondary-btn"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          )
        ) : (
          <>
            <button
              className="inquiries-sheet__primary-btn"
              disabled={isSendingReply}
              onClick={onSendReply}
              type="button"
            >
              <OpgIconSend
                size={18}
                style={{
                  width: 18,
                  height: 18,
                  minWidth: 18,
                  minHeight: 18,
                  flexShrink: 0,
                }}
              />
              <span>
                {isSendingReply ? 'Sending…' : 'Send Email & Mark Replied'}
              </span>
            </button>
            <div className="inquiries-sheet__secondary-row">
              <button
                className="inquiries-sheet__secondary-btn"
                disabled={isSendingReply}
                onClick={onCancelReply}
                type="button"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </footer>
    </div>
  )
}

export type ReplyOutcomeState =
  | {
      kind: 'success'
      recipientName: string
      recipientEmail: string
      subject: string
      referenceCode: string
      messageId: string | null
    }
  | {
      kind: 'error'
      recipientName: string
      recipientEmail: string
      subject: string
      errorMessage: string
    }

export function InquiryReplyOutcomeModal({
  outcome,
  isSendingReply,
  primaryButtonRef,
  onClose,
  onCloseInquiry,
  onRetry,
}: {
  outcome: ReplyOutcomeState
  isSendingReply: boolean
  primaryButtonRef?: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onCloseInquiry: () => void
  onRetry: () => void
}) {
  const isSuccess = outcome.kind === 'success'

  return (
    <div
      className={`inquiries-outcome-card ${
        isSuccess
          ? 'inquiries-outcome-card--success'
          : 'inquiries-outcome-card--error'
      }`}
    >
      <button
        aria-label="Dismiss reply status"
        className="inquiries-outcome-close"
        disabled={isSendingReply}
        onClick={onClose}
        type="button"
      >
        <SheetCloseIcon size={14} />
      </button>

      <div
        aria-hidden="true"
        className={`inquiries-outcome-badge ${
          isSuccess
            ? 'inquiries-outcome-badge--success'
            : 'inquiries-outcome-badge--error'
        }`}
      >
        <span className="inquiries-outcome-badge__ring" />
        {isSuccess ? (
          <svg
            fill="none"
            height="26"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
            viewBox="0 0 24 24"
            width="26"
          >
            <path
              className="inquiries-outcome-check-path"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            fill="none"
            height="26"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
            width="26"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" x2="12" y1="8" y2="12.5" />
            <circle cx="12" cy="16" fill="currentColor" r="0.75" stroke="none" />
          </svg>
        )}
      </div>

      <h2 className="inquiries-outcome-title" id="reply-outcome-title">
        {isSuccess ? 'Reply Sent' : 'Delivery Failed'}
      </h2>

      <p className="inquiries-outcome-subtitle">
        {isSuccess
          ? `Your email reply to ${outcome.recipientName} (${outcome.recipientEmail}) has been sent.`
          : `Could not send your reply to ${outcome.recipientName} (${outcome.recipientEmail}).`}
      </p>

      {isSuccess ? (
        <div className="inquiries-outcome-summary">
          <div className="inquiries-outcome-summary__row">
            <span className="inquiries-outcome-summary__label">Subject</span>
            <span className="inquiries-outcome-summary__value">
              {outcome.subject}
            </span>
          </div>
          <div className="inquiries-outcome-summary__row">
            <span className="inquiries-outcome-summary__label">Reference</span>
            <span className="inquiries-outcome-summary__value">
              {outcome.referenceCode}
            </span>
          </div>
          <div className="inquiries-outcome-summary__row">
            <span className="inquiries-outcome-summary__label">Status</span>
            <span className="inquiries-outcome-summary__status">
              <span
                aria-hidden="true"
                className="inquiries-outcome-summary__dot"
              />
              <span>Replied</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="inquiries-outcome-error-box" role="alert">
          {outcome.errorMessage}
        </div>
      )}

      <div className="inquiries-outcome-actions">
        {isSuccess ? (
          <>
            <button
              className="inquiries-outcome-btn-primary"
              onClick={onClose}
              ref={primaryButtonRef}
              type="button"
            >
              Done
            </button>
            <button
              className="inquiries-outcome-btn-secondary"
              onClick={onCloseInquiry}
              type="button"
            >
              Close Inquiry
            </button>
          </>
        ) : (
          <>
            <button
              className="inquiries-outcome-btn-primary"
              disabled={isSendingReply}
              onClick={onRetry}
              ref={primaryButtonRef}
              type="button"
            >
              {isSendingReply ? 'Retrying…' : 'Retry Send'}
            </button>
            <button
              className="inquiries-outcome-btn-secondary"
              disabled={isSendingReply}
              onClick={onClose}
              type="button"
            >
              Edit Reply
            </button>
          </>
        )}
      </div>
    </div>
  )
}

type DateFilterType = 'all' | 'today' | '7days' | '30days' | 'custom'

const DATE_FILTER_OPTIONS: { label: string; value: DateFilterType }[] = [
  { label: 'All Dates', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
]

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

  const [liveSnapshot, setLiveSnapshot] = useState<{
    base: InquiryItem[]
    items: InquiryItem[]
  } | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, InquiryItem['status']>
  >({})
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isBulkPending, startBulkTransition] = useTransition()
  const initialInquiriesRef = useRef<InquiryItem[]>(initialInquiries)

  useEffect(() => {
    initialInquiriesRef.current = initialInquiries
  }, [initialInquiries])

  const inquiries = useMemo(() => {
    const sourceInquiries =
      liveSnapshot && liveSnapshot.base === initialInquiries
        ? liveSnapshot.items
        : initialInquiries
    const removedSet = new Set(deletedIds)
    return sourceInquiries
      .filter((inq) => !removedSet.has(inq.id))
      .map((inq) => ({
        ...inq,
        status: statusOverrides[inq.id] || inq.status,
      }))
  }, [deletedIds, initialInquiries, liveSnapshot, statusOverrides])

  const urlStatus = searchParams?.get('status') as InquiryStatus | null
  const selectedStatus: InquiryStatus =
    urlStatus && ['all', 'new', 'read', 'replied', 'archived'].includes(urlStatus)
      ? urlStatus
      : ((initialStatus as InquiryStatus) || 'all')

  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all')
  const [customDate, setCustomDate] = useState<string>('')
  const [dateRangeCutoff, setDateRangeCutoff] = useState<{
    startMs: number
    endMs: number
  } | null>(null)
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(
    null,
  )
  const [isReplying, setIsReplying] = useState(false)
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ack')
  const [toast, setToast] = useState<{
    actionHref?: string
    actionLabel?: string
    message: string
    type: 'success' | 'error' | 'alert'
  } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedAudit, setCopiedAudit] = useState(false)
  const [dragOffsetY, setDragOffsetY] = useState(0)
  const [replyOutcome, setReplyOutcome] = useState<ReplyOutcomeState | null>(
    null,
  )
  const [isSendingReply, startReplyTransition] = useTransition()
  const [isUpdatingStatus, startStatusTransition] = useTransition()

  const dropdownRootRef = useRef<HTMLDivElement>(null)
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const dateFilterRootRef = useRef<HTMLDivElement>(null)
  const dateFilterTriggerRef = useRef<HTMLButtonElement>(null)
  const dateFilterMenuRef = useRef<HTMLDivElement>(null)
  const modalDialogRef = useRef<HTMLDialogElement>(null)
  const outcomeDialogRef = useRef<HTMLDialogElement>(null)
  const outcomePrimaryBtnRef = useRef<HTMLButtonElement>(null)
  const outcomeTriggerRef = useRef<HTMLElement | null>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const lastTriggerRef = useRef<HTMLElement | null>(null)
  const copyEmailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyAuditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchSwipingRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)
  const markingReadIdsRef = useRef<Set<string>>(new Set())
  const seenInquiryIdsRef = useRef<Set<string> | null>(null)
  const seenTestimonialIdsRef = useRef<Set<string> | null>(null)
  const dropdownMenuId = useId()
  const replyBodyId = useId()
  const replySubjectId = useId()

  const handleOpenInquiry = useCallback(
    (inq: InquiryItem, triggerEl?: HTMLElement | null) => {
      if (triggerEl) {
        lastTriggerRef.current = triggerEl
      } else if (
        typeof document !== 'undefined' &&
        document.activeElement instanceof HTMLElement
      ) {
        lastTriggerRef.current = document.activeElement
      }

      const { cleanSubject } = parseInquiryDetails(inq.subject)
      const firstName = inq.full_name.trim().split(' ')[0] || 'there'
      const defaultTemplate = REPLY_TEMPLATES[0]
      setReplySubject(defaultTemplate.getSubject(cleanSubject))
      setReplyBody(defaultTemplate.getBody(firstName, cleanSubject))
      setSelectedTemplateId('ack')
      setReplyError(null)
      setCopiedEmail(false)
      setCopiedAudit(false)
      setDragOffsetY(0)
      setIsReplying(false)

      const shouldMarkRead =
        canManage &&
        inq.status === 'new' &&
        !markingReadIdsRef.current.has(inq.id)

      setSelectedInquiry(shouldMarkRead ? { ...inq, status: 'read' } : inq)

      if (shouldMarkRead) {
        markingReadIdsRef.current.add(inq.id)
        setStatusOverrides((prev) => ({ ...prev, [inq.id]: 'read' }))

        void updateInquiryStatusAction(inq.id, 'read')
          .then(() => {
            router.refresh()
          })
          .catch(() => {
            markingReadIdsRef.current.delete(inq.id)
            setStatusOverrides((prev) => {
              const next = { ...prev }
              delete next[inq.id]
              return next
            })
            setSelectedInquiry((prev) =>
              prev && prev.id === inq.id ? { ...prev, status: 'new' } : prev,
            )
            setToast({
              message: 'Could not mark contact as read automatically.',
              type: 'error',
            })
          })
      }
    },
    [canManage, router],
  )

  // Real-time inbox & testimonial updates with audible arrival chimes
  useEffect(() => {
    const supabase = createClient()
    let active = true
    let inFlight = false
    let testimonialsInFlight = false
    let canPollTestimonials = true
    let syncTimer: ReturnType<typeof setTimeout> | undefined
    let testimonialSyncTimer: ReturnType<typeof setTimeout> | undefined
    let testimonialChannel: ReturnType<typeof supabase.channel> | undefined
    const unregisterAudioUnlock = registerAdminAudioUnlock()

    if (!seenInquiryIdsRef.current) {
      seenInquiryIdsRef.current = new Set(
        initialInquiriesRef.current.map((item) => item.id),
      )
    }

    const syncInquiries = async () => {
      if (!active || inFlight) return
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return
      inFlight = true
      try {
        const response = await fetch('/api/admin/inquiries', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        })
        if (!response.ok || !active) return
        const payload = (await response.json()) as {
          inquiries?: InquiryItem[]
        }
        if (!active || !Array.isArray(payload.inquiries)) return
        const fresh = payload.inquiries

        const seenIds = seenInquiryIdsRef.current ?? new Set<string>()
        const arrivedContacts = fresh.filter(
          (item) => !seenIds.has(item.id) && item.status === 'new',
        )
        for (const item of fresh) {
          seenIds.add(item.id)
        }
        seenInquiryIdsRef.current = seenIds

        setLiveSnapshot({
          base: initialInquiriesRef.current,
          items: fresh,
        })
        setStatusOverrides((prev) => {
          const freshById = new Map(fresh.map((item) => [item.id, item]))
          let changed = false
          const next: Record<string, InquiryItem['status']> = {}
          for (const [id, overrideStatus] of Object.entries(prev)) {
            const serverItem = freshById.get(id)
            if (serverItem && serverItem.status !== 'new') {
              markingReadIdsRef.current.delete(id)
            }
            if (serverItem && serverItem.status !== overrideStatus) {
              next[id] = overrideStatus
            } else {
              changed = true
            }
          }
          return changed ? next : prev
        })
        setSelectedInquiry((prev) => {
          if (!prev) return prev
          const updated = fresh.find((item) => item.id === prev.id)
          if (!updated) return prev
          if (
            markingReadIdsRef.current.has(prev.id) &&
            updated.status === 'new'
          ) {
            return { ...updated, status: 'read' }
          }
          return updated
        })

        if (arrivedContacts.length > 0) {
          void playAdminNotificationSound('contact')
          const latest = arrivedContacts[0]
          const { cleanSubject } = parseInquiryDetails(latest.subject)
          setToast({
            message:
              arrivedContacts.length === 1
                ? `New contact from ${latest.full_name} — ${cleanSubject}`
                : `${arrivedContacts.length} new contacts arrived in your inbox.`,
            type: 'alert',
          })
        }
      } catch {
        // Silent retry on next realtime event, focus, or fallback poll
      } finally {
        inFlight = false
      }
    }

    const syncTestimonials = async () => {
      if (!active || testimonialsInFlight || !canPollTestimonials) return
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return
      testimonialsInFlight = true
      try {
        const response = await fetch('/api/admin/notifications', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        })
        if (!response.ok || !active) return
        const payload = (await response.json()) as {
          canViewTestimonials?: boolean
          pendingTestimonials?: Array<{
            id: string
            author_name: string
            role_title: string | null
          }>
        }
        if (!active) return
        if (payload.canViewTestimonials === false) {
          canPollTestimonials = false
          return
        }
        const pending = Array.isArray(payload.pendingTestimonials)
          ? payload.pendingTestimonials
          : []

        if (!seenTestimonialIdsRef.current) {
          seenTestimonialIdsRef.current = new Set(pending.map((item) => item.id))
          return
        }

        const seenIds = seenTestimonialIdsRef.current
        const arrivedTestimonials = pending.filter(
          (item) => !seenIds.has(item.id),
        )
        for (const item of pending) {
          seenIds.add(item.id)
        }

        if (arrivedTestimonials.length > 0) {
          void playAdminNotificationSound('testimonial')
          setToast({
            message:
              arrivedTestimonials.length === 1
                ? `New testimonial from ${arrivedTestimonials[0].author_name} is awaiting review.`
                : `${arrivedTestimonials.length} new candidate testimonials are awaiting review.`,
            type: 'alert',
            actionHref: '/admin/testimonials',
            actionLabel: 'Review',
          })
        }
      } catch {
        // Silent retry on next realtime event, focus, or fallback poll
      } finally {
        testimonialsInFlight = false
      }
    }

    const scheduleSync = () => {
      if (!active) return
      if (syncTimer) clearTimeout(syncTimer)
      syncTimer = setTimeout(() => {
        void syncInquiries()
      }, 150)
    }

    const scheduleTestimonialSync = () => {
      if (!active || !canPollTestimonials) return
      if (testimonialSyncTimer) clearTimeout(testimonialSyncTimer)
      testimonialSyncTimer = setTimeout(() => {
        void syncTestimonials()
      }, 200)
    }

    const handleVisibilityOrFocus = () => {
      if (!active) return
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return
      }
      scheduleSync()
      scheduleTestimonialSync()
    }

    const channel = supabase
      .channel('admin-inquiries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_inquiries' },
        scheduleSync,
      )
      .on('broadcast', { event: 'changed' }, scheduleSync)
      .subscribe()

    const subscribeTestimonialAlerts = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active || error || !data.session?.access_token) return
        await supabase.realtime.setAuth(data.session.access_token)
        if (!active) return
        testimonialChannel = supabase
          .channel('candidate-testimonials-admin', {
            config: { private: true },
          })
          .on('broadcast', { event: 'changed' }, scheduleTestimonialSync)
          .subscribe()
      } catch {
        // Polling & focus sync act as reliable fallback
      }
    }

    void syncTestimonials()
    void subscribeTestimonialAlerts()

    const fallbackPollId = setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return
      }
      void syncInquiries()
      void syncTestimonials()
    }, 4000)

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus)
      window.addEventListener('online', handleVisibilityOrFocus)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    }

    return () => {
      active = false
      if (syncTimer) clearTimeout(syncTimer)
      if (testimonialSyncTimer) clearTimeout(testimonialSyncTimer)
      clearInterval(fallbackPollId)
      unregisterAudioUnlock()
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus)
        window.removeEventListener('online', handleVisibilityOrFocus)
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      }
      void supabase.removeChannel(channel)
      if (testimonialChannel) void supabase.removeChannel(testimonialChannel)
    }
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
    const timer = setTimeout(
      () => setToast(null),
      toast.type === 'alert' ? 5500 : 4000,
    )
    return () => clearTimeout(timer)
  }, [toast])

  // Click outside to close status dropdown
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

  // Click outside to close date filter dropdown
  useEffect(() => {
    if (!dateFilterOpen) return
    function handleClickOutside(event: PointerEvent | FocusEvent) {
      if (!dateFilterRootRef.current?.contains(event.target as Node)) {
        setDateFilterOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDateFilterOpen(false)
        dateFilterTriggerRef.current?.focus()
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
  }, [dateFilterOpen])

  const trapDialogTabKey = useCallback(
    (dialog: HTMLDialogElement, event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )

      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (!active || active === first || !dialog.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (!active || active === last || !dialog.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    },
    [],
  )

  // Modal open / close sync with native dialog & accessible focus trap
  useEffect(() => {
    const dialog = modalDialogRef.current
    if (!dialog) return

    if (selectedInquiry) {
      if (!dialog.open && typeof dialog.showModal === 'function') {
        dialog.showModal()
      }

      const handleDialogKeyDown = (event: KeyboardEvent) => {
        trapDialogTabKey(dialog, event)
      }

      dialog.addEventListener('keydown', handleDialogKeyDown)
      return () => {
        dialog.removeEventListener('keydown', handleDialogKeyDown)
      }
    }

    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close()
    }
    const trigger = lastTriggerRef.current
    if (trigger && trigger.isConnected) {
      lastTriggerRef.current = null
      requestAnimationFrame(() => {
        trigger.focus()
      })
    }
  }, [selectedInquiry, trapDialogTabKey])

  // Reply outcome confirmation dialog open / close sync & focus management
  useEffect(() => {
    const dialog = outcomeDialogRef.current
    if (!dialog) return

    if (replyOutcome) {
      if (!dialog.open && typeof dialog.showModal === 'function') {
        dialog.showModal()
      }
      requestAnimationFrame(() => {
        outcomePrimaryBtnRef.current?.focus()
      })

      const handleOutcomeKeyDown = (event: KeyboardEvent) => {
        trapDialogTabKey(dialog, event)
      }

      dialog.addEventListener('keydown', handleOutcomeKeyDown)
      return () => {
        dialog.removeEventListener('keydown', handleOutcomeKeyDown)
      }
    }

    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close()
    }
    const trigger = outcomeTriggerRef.current
    if (trigger && trigger.isConnected) {
      outcomeTriggerRef.current = null
      requestAnimationFrame(() => {
        trigger.focus()
      })
    }
  }, [replyOutcome, trapDialogTabKey])

  useEffect(() => {
    return () => {
      if (copyEmailTimerRef.current) clearTimeout(copyEmailTimerRef.current)
      if (copyAuditTimerRef.current) clearTimeout(copyAuditTimerRef.current)
    }
  }, [])

  const counts = useMemo(() => {
    const total = inquiries.length
    const countNew = inquiries.filter((i) => i.status === 'new').length
    const countRead = inquiries.filter((i) => i.status === 'read').length
    const countReplied = inquiries.filter((i) => i.status === 'replied').length
    const countArchived = inquiries.filter((i) => i.status === 'archived').length
    return { all: total, new: countNew, read: countRead, replied: countReplied, archived: countArchived }
  }, [inquiries])

  const filterOptions: { label: string; value: InquiryStatus; count: number }[] = [
    { label: 'All Contacts', value: 'all', count: counts.all },
    { label: 'New', value: 'new', count: counts.new },
    { label: 'Read', value: 'read', count: counts.read },
    { label: 'Replied', value: 'replied', count: counts.replied },
    { label: 'Archived', value: 'archived', count: counts.archived },
  ]

  const activeOption = filterOptions.find((o) => o.value === selectedStatus) || filterOptions[0]

  const dateFilterLabel = useMemo(() => {
    if (dateFilter === 'today') return 'Today'
    if (dateFilter === '7days') return 'Last 7 Days'
    if (dateFilter === '30days') return 'Last 30 Days'
    if (dateFilter === 'custom' && customDate) {
      const [year, month, day] = customDate.split('-').map(Number)
      if (year && month && day) {
        const d = new Date(year, month - 1, day)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      return customDate
    }
    return 'All Dates'
  }, [dateFilter, customDate])

  const handleApplyDateFilter = useCallback(
    (type: DateFilterType, specificDate?: string) => {
      setDateFilter(type)
      if (type === 'all') {
        setCustomDate('')
        setDateRangeCutoff(null)
      } else if (type === 'today') {
        setCustomDate('')
        const now = new Date()
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime()
        const end = start + 86400000
        setDateRangeCutoff({ startMs: start, endMs: end })
      } else if (type === '7days') {
        setCustomDate('')
        const now = Date.now()
        setDateRangeCutoff({ startMs: now - 7 * 86400000, endMs: now })
      } else if (type === '30days') {
        setCustomDate('')
        const now = Date.now()
        setDateRangeCutoff({ startMs: now - 30 * 86400000, endMs: now })
      } else if (type === 'custom' && specificDate) {
        setCustomDate(specificDate)
        const [y, m, d] = specificDate.split('-').map(Number)
        if (y && m && d) {
          const start = new Date(y, m - 1, d).getTime()
          const end = start + 86400000
          setDateRangeCutoff({ startMs: start, endMs: end })
        } else {
          setDateRangeCutoff(null)
        }
      }
      setDateFilterOpen(false)
    },
    [],
  )

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

      // Date range filter
      if (dateRangeCutoff) {
        const itemTime = new Date(item.submitted_at).getTime()
        if (
          itemTime < dateRangeCutoff.startMs ||
          itemTime > dateRangeCutoff.endMs
        ) {
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
  }, [inquiries, selectedStatus, searchQuery, dateRangeCutoff])

  const handleSelectStatus = (status: InquiryStatus) => {
    setDropdownOpen(false)
    setSelectedIds([])
    const url = status === 'all' ? '/admin/inquiries' : `/admin/inquiries?status=${status}`
    router.replace(url, { scroll: false })
  }

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedVisibleInquiries = useMemo(
    () => filteredInquiries.filter((inq) => selectedIdSet.has(inq.id)),
    [filteredInquiries, selectedIdSet],
  )
  const selectedVisibleIds = useMemo(
    () => selectedVisibleInquiries.map((inq) => inq.id),
    [selectedVisibleInquiries],
  )
  const allVisibleSelected =
    filteredInquiries.length > 0 &&
    selectedVisibleIds.length === filteredInquiries.length
  const someVisibleSelected =
    selectedVisibleIds.length > 0 &&
    selectedVisibleIds.length < filteredInquiries.length

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

  const canBulkMarkRead = selectedVisibleInquiries.some(
    (inq) => inq.status !== 'read',
  )
  const canBulkMarkUnread = selectedVisibleInquiries.some(
    (inq) => inq.status !== 'new',
  )
  const canBulkArchive = selectedVisibleInquiries.some(
    (inq) => inq.status !== 'archived',
  )

  const toggleSelectInquiry = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredInquiries.map((inq) => inq.id))
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)))
    } else {
      setSelectedIds((prev) => {
        const merged = new Set(prev)
        filteredInquiries.forEach((inq) => merged.add(inq.id))
        return Array.from(merged)
      })
    }
  }, [allVisibleSelected, filteredInquiries])

  const handleBulkStatusChange = (targetStatus: BulkInquiryStatus) => {
    if (!canManage || selectedVisibleIds.length === 0 || isBulkPending) return
    const targetIds = [...selectedVisibleIds]

    startBulkTransition(async () => {
      const res = await bulkUpdateInquiryStatusAction(targetIds, targetStatus)
      if (!res.success || !res.updatedIds?.length) {
        setToast({
          message:
            res.error || 'Could not update the selected contacts. Try again.',
          type: 'error',
        })
        return
      }

      const updatedSet = new Set(res.updatedIds)
      setStatusOverrides((prev) => {
        const next = { ...prev }
        for (const id of res.updatedIds ?? []) {
          next[id] = targetStatus
          if (targetStatus === 'new') {
            markingReadIdsRef.current.delete(id)
          } else {
            markingReadIdsRef.current.add(id)
          }
        }
        return next
      })
      setSelectedInquiry((prev) =>
        prev && updatedSet.has(prev.id)
          ? { ...prev, status: targetStatus }
          : prev,
      )
      setSelectedIds((prev) => prev.filter((id) => !updatedSet.has(id)))

      const statusLabel =
        targetStatus === 'new'
          ? 'unread'
          : targetStatus === 'read'
            ? 'read'
            : 'archived'
      setToast({
        message: `${res.updatedIds.length} ${res.updatedIds.length === 1 ? 'contact' : 'contacts'} marked as ${statusLabel}.`,
        type: 'success',
      })
      router.refresh()
    })
  }

  const handleConfirmBulkDelete = () => {
    if (!canManage || selectedVisibleIds.length === 0 || isBulkPending) return
    const targetIds = [...selectedVisibleIds]

    startBulkTransition(async () => {
      const res = await bulkDeleteInquiriesAction(targetIds)
      setConfirmDeleteOpen(false)
      if (!res.success || !res.deletedIds?.length) {
        setToast({
          message:
            res.error || 'Could not delete the selected contacts. Try again.',
          type: 'error',
        })
        return
      }

      const deletedSet = new Set(res.deletedIds)
      setDeletedIds((prev) => Array.from(new Set([...prev, ...deletedSet])))
      setSelectedIds((prev) => prev.filter((id) => !deletedSet.has(id)))
      setSelectedInquiry((prev) =>
        prev && deletedSet.has(prev.id) ? null : prev,
      )
      setToast({
        message: `Deleted ${res.deletedIds.length} ${res.deletedIds.length === 1 ? 'contact' : 'contacts'}.`,
        type: 'success',
      })
      router.refresh()
    })
  }

  const handleSendReply = () => {
    if (!selectedInquiry || isSendingReply) return
    unlockAdminAudio()
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement
    ) {
      outcomeTriggerRef.current = document.activeElement
    }
    const targetId = selectedInquiry.id
    const targetName = selectedInquiry.full_name
    const targetEmail = selectedInquiry.email
    const sentSubject = replySubject.trim() || 'Re: Inquiry'
    const referenceCode = `OPG-${targetId.slice(0, 8).toUpperCase()}`
    setReplyError(null)

    startReplyTransition(async () => {
      try {
        const res = await sendInquiryReplyAction({
          inquiryId: targetId,
          subject: replySubject,
          body: replyBody,
        })

        if (!res.success) {
          setReplyError(res.error)
          void playAdminNotificationSound('reply_error')
          setReplyOutcome({
            kind: 'error',
            recipientName: targetName,
            recipientEmail: targetEmail,
            subject: sentSubject,
            errorMessage: res.error,
          })
          return
        }

        setStatusOverrides((prev) => ({ ...prev, [targetId]: 'replied' }))
        setSelectedInquiry((prev) =>
          prev && prev.id === targetId ? { ...prev, status: 'replied' } : prev,
        )
        setIsReplying(false)
        setReplyError(null)
        void playAdminNotificationSound('reply_success')
        setReplyOutcome({
          kind: 'success',
          recipientName: targetName,
          recipientEmail: targetEmail,
          subject: sentSubject,
          referenceCode,
          messageId: res.messageId,
        })
        router.refresh()
      } catch {
        const fallback = 'Could not send email reply. Please try again.'
        setReplyError(fallback)
        void playAdminNotificationSound('reply_error')
        setReplyOutcome({
          kind: 'error',
          recipientName: targetName,
          recipientEmail: targetEmail,
          subject: sentSubject,
          errorMessage: fallback,
        })
      }
    })
  }

  const handleCopyEmail = () => {
    if (!selectedInquiry) return
    navigator.clipboard.writeText(selectedInquiry.email)
    setCopiedEmail(true)
    if (copyEmailTimerRef.current) clearTimeout(copyEmailTimerRef.current)
    copyEmailTimerRef.current = setTimeout(() => setCopiedEmail(false), 1500)
  }

  const handleCopyAudit = () => {
    if (!selectedInquiry?.ip_hash) return
    navigator.clipboard.writeText(selectedInquiry.ip_hash)
    setCopiedAudit(true)
    if (copyAuditTimerRef.current) clearTimeout(copyAuditTimerRef.current)
    copyAuditTimerRef.current = setTimeout(() => setCopiedAudit(false), 1500)
  }

  const handleSingleStatusUpdate = (
    targetStatus: 'new' | 'read' | 'archived',
  ) => {
    if (!canManage || !selectedInquiry || isUpdatingStatus) return
    const targetId = selectedInquiry.id
    const previousStatus = selectedInquiry.status

    setStatusOverrides((prev) => ({ ...prev, [targetId]: targetStatus }))
    setSelectedInquiry((prev) =>
      prev && prev.id === targetId ? { ...prev, status: targetStatus } : prev,
    )
    if (targetStatus === 'new') {
      markingReadIdsRef.current.delete(targetId)
    } else {
      markingReadIdsRef.current.add(targetId)
    }

    startStatusTransition(async () => {
      try {
        await updateInquiryStatusAction(targetId, targetStatus)
        const label =
          targetStatus === 'new'
            ? 'unread'
            : targetStatus === 'read'
              ? 'read'
              : 'archived'
        setToast({
          message: `Contact marked as ${label}.`,
          type: 'success',
        })
        router.refresh()
      } catch {
        setStatusOverrides((prev) => ({ ...prev, [targetId]: previousStatus }))
        setSelectedInquiry((prev) =>
          prev && prev.id === targetId ? { ...prev, status: previousStatus } : prev,
        )
        setToast({
          message: 'Could not update contact status. Try again.',
          type: 'error',
        })
      }
    })
  }

  const handleCloseModal = useCallback(() => {
    if (copyEmailTimerRef.current) clearTimeout(copyEmailTimerRef.current)
    if (copyAuditTimerRef.current) clearTimeout(copyAuditTimerRef.current)
    setSelectedInquiry(null)
    setReplyOutcome(null)
    setIsReplying(false)
    setReplyError(null)
    setCopiedEmail(false)
    setCopiedAudit(false)
    setDragOffsetY(0)
    touchStartYRef.current = null
    touchSwipingRef.current = false
  }, [])

  const handleSheetTouchStart = (
    e: ReactTouchEvent<HTMLElement>,
    allowAnywhere = false,
  ) => {
    if (typeof window === 'undefined' || window.innerWidth >= 640) return
    const scrollTop = scrollContentRef.current?.scrollTop ?? 0
    if (!allowAnywhere && scrollTop > 0) return
    touchStartYRef.current = e.touches[0]?.clientY ?? null
    touchSwipingRef.current = touchStartYRef.current !== null
  }

  const handleSheetTouchMove = (e: ReactTouchEvent<HTMLElement>) => {
    if (!touchSwipingRef.current || touchStartYRef.current === null) return
    const currentY = e.touches[0]?.clientY ?? touchStartYRef.current
    const delta = currentY - touchStartYRef.current
    if (delta > 0) {
      setDragOffsetY(delta)
    } else {
      setDragOffsetY(0)
    }
  }

  const handleSheetTouchEnd = () => {
    if (!touchSwipingRef.current) return
    touchSwipingRef.current = false
    touchStartYRef.current = null
    if (dragOffsetY >= 96) {
      handleCloseModal()
      return
    }
    setDragOffsetY(0)
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
            {toast.type === 'success'
              ? '✓'
              : toast.type === 'alert'
                ? '♪'
                : '!'}
          </span>
          <p>{toast.message}</p>
          {toast.actionHref && toast.actionLabel && (
            <button
              className="inquiries-toast__action"
              onClick={() => router.push(toast.actionHref!)}
              type="button"
            >
              {toast.actionLabel}
            </button>
          )}
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

      {/* Top Header Section (Full Width Row) */}
      <header className="inquiries-header-section">
        <h1 className="inquiries-header-title">Contacts Inbox</h1>
        <p className="inquiries-header-subtitle">
          Review and triage incoming messages from institutional clients and talent
          candidates. Track response times, update triage statuses, and coordinate direct follow-ups.
        </p>
      </header>

      {/* Dedicated Toolbar Row directly under the header section */}
      <div className="inquiries-toolbar-row">
        {/* Search Input & Action Button */}
        <form
          className="inquiries-search-box"
          onSubmit={(e) => {
            e.preventDefault()
            searchInputRef.current?.focus()
          }}
          role="search"
        >
          <OpgIconSearch
            className="inquiries-search-icon"
            size={17}
            style={{
              width: 17,
              height: 17,
              minWidth: 17,
              minHeight: 17,
              maxWidth: 17,
              maxHeight: 17,
              flexShrink: 0,
            }}
          />
          <input
            aria-label="Search contacts by sender, email, subject, or message"
            className="inquiries-search-input"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts or sender…"
            ref={searchInputRef}
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
          <button
            aria-label="Search contacts"
            className="inquiries-search-btn"
            type="submit"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Controls: Calendar Date Filter + Status Pill Filter */}
        <div className="inquiries-controls-group inquiries-toolbar-controls">
          {/* Styled Calendar Date Filter */}
          <div className="inquiries-date-filter" ref={dateFilterRootRef}>
            <button
              aria-expanded={dateFilterOpen}
              aria-haspopup="dialog"
              aria-label={`Filter by date: ${dateFilterLabel}`}
              className={`inquiries-date-filter__trigger ${
                dateFilter !== 'all' ? 'inquiries-date-filter__trigger--active' : ''
              }`}
              onClick={() => setDateFilterOpen((prev) => !prev)}
              ref={dateFilterTriggerRef}
              type="button"
            >
              <OpgIconCalendar
                className="inquiries-date-filter__icon"
                size={16}
                style={{
                  width: 16,
                  height: 16,
                  minWidth: 16,
                  minHeight: 16,
                  flexShrink: 0,
                }}
              />
              <span className="inquiries-date-filter__title">{dateFilterLabel}</span>
              <OpgIconChevron
                className={`inquiries-pill-filter__chevron ${
                  dateFilterOpen ? 'inquiries-pill-filter__chevron--open' : ''
                }`}
                size={14}
                style={{
                  width: 14,
                  height: 14,
                  minWidth: 14,
                  minHeight: 14,
                  flexShrink: 0,
                }}
              />
            </button>

            {dateFilterOpen && (
              <div
                aria-label="Filter contacts by date"
                className="inquiries-date-filter__menu"
                ref={dateFilterMenuRef}
              >
                <div className="inquiries-date-filter__presets">
                  {DATE_FILTER_OPTIONS.map((opt) => {
                    const isSelected = dateFilter === opt.value
                    return (
                      <button
                        className={`inquiries-date-filter__option ${
                          isSelected ? 'inquiries-date-filter__option--active' : ''
                        }`}
                        key={opt.value}
                        onClick={() => handleApplyDateFilter(opt.value)}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                <div className="inquiries-date-filter__divider" />

                <div className="inquiries-date-filter__custom-box">
                  <span className="inquiries-date-filter__custom-title">
                    Specific date
                  </span>
                  <div className="inquiries-date-picker-wrap">
                    <OpgIconCalendar
                      className="inquiries-date-picker-icon"
                      size={15}
                      style={{
                        width: 15,
                        height: 15,
                        minWidth: 15,
                        minHeight: 15,
                        flexShrink: 0,
                      }}
                    />
                    <input
                      aria-label="Filter contacts by exact calendar date"
                      className="inquiries-custom-date-picker"
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          handleApplyDateFilter('custom', val)
                        } else {
                          handleApplyDateFilter('all')
                        }
                      }}
                      type="date"
                      value={customDate}
                    />
                  </div>
                </div>

                {dateFilter !== 'all' && (
                  <div className="inquiries-date-filter__footer">
                    <button
                      className="inquiries-date-filter__reset-btn"
                      onClick={() => handleApplyDateFilter('all')}
                      type="button"
                    >
                      Reset Date
                    </button>
                  </div>
                )}
              </div>
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
              <OpgIconChevron
                className={`inquiries-pill-filter__chevron ${
                  dropdownOpen ? 'inquiries-pill-filter__chevron--open' : ''
                }`}
                size={16}
                style={{
                  width: 16,
                  height: 16,
                  minWidth: 16,
                  minHeight: 16,
                  maxWidth: 16,
                  maxHeight: 16,
                  flexShrink: 0,
                }}
              />
            </button>

            {dropdownOpen && (
              <div
                aria-label="Filter contacts by status"
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

      {/* Contextual Bulk Actions Bar when 1+ Contacts are Selected */}
      {canManage && selectedVisibleIds.length > 0 && (
        <div
          aria-label="Bulk actions for selected contacts"
          className="inquiries-bulk-bar"
          role="region"
        >
          <div className="inquiries-bulk-bar__summary">
            <span className="inquiries-bulk-bar__count">
              <strong>{selectedVisibleIds.length}</strong> selected
            </span>
            <button
              className="inquiries-bulk-bar__clear"
              disabled={isBulkPending}
              onClick={() => setSelectedIds([])}
              type="button"
            >
              Clear selection
            </button>
          </div>

          <div className="inquiries-bulk-bar__actions">
            <button
              className="inquiries-bulk-btn"
              disabled={!canBulkMarkRead || isBulkPending}
              onClick={() => handleBulkStatusChange('read')}
              type="button"
            >
              Mark as read
            </button>
            <button
              className="inquiries-bulk-btn"
              disabled={!canBulkMarkUnread || isBulkPending}
              onClick={() => handleBulkStatusChange('new')}
              type="button"
            >
              Mark as unread
            </button>
            <button
              className="inquiries-bulk-btn"
              disabled={!canBulkArchive || isBulkPending}
              onClick={() => handleBulkStatusChange('archived')}
              type="button"
            >
              Archive
            </button>
            <button
              className="inquiries-bulk-btn inquiries-bulk-btn--danger"
              disabled={isBulkPending}
              onClick={() => setConfirmDeleteOpen(true)}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Glassmorphic Card Table (Email Inbox Style) */}
      <div className="inquiries-card-table">
        <div className="inquiries-table-scroll">
          <table className="inquiries-inbox-table">
            <caption className="sr-only">
              Incoming contact inquiries and communications
            </caption>
            <thead>
              <tr>
                {canManage && (
                  <th
                    className="inquiries-col-checkbox"
                    scope="col"
                    style={{ width: '44px' }}
                  >
                    <input
                      aria-label={
                        allVisibleSelected
                          ? 'Deselect all visible contacts'
                          : 'Select all visible contacts'
                      }
                      checked={allVisibleSelected}
                      className="inquiries-checkbox"
                      disabled={filteredInquiries.length === 0 || isBulkPending}
                      onChange={toggleSelectAllVisible}
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                    />
                  </th>
                )}
                <th scope="col" style={{ width: '95px' }}>
                  Type
                </th>
                <th scope="col" style={{ width: '185px' }}>
                  Sender
                </th>
                <th scope="col">Subject &amp; Preview</th>
                <th
                  className="inquiries-th-date"
                  scope="col"
                  style={{ width: '85px', textAlign: 'right' }}
                >
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
                  const isRowSelected = selectedIdSet.has(inq.id)
                  const shortDate = formatInboxDate(inq.submitted_at)
                  const fullDate = formatFullDate(inq.submitted_at)

                  return (
                    <tr
                      aria-label={`Open inquiry from ${inq.full_name}: ${cleanSubject}`}
                      className={`inquiries-inbox-row ${
                        isNew ? 'inquiries-inbox-row--new' : 'inquiries-inbox-row--read'
                      } ${isRowSelected ? 'inquiries-inbox-row--selected' : ''}`}
                      key={inq.id}
                      onClick={(e) => handleOpenInquiry(inq, e.currentTarget)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOpenInquiry(inq, e.currentTarget)
                        }
                      }}
                      tabIndex={0}
                    >
                      {canManage && (
                        <td
                          className="inquiries-col-checkbox"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            aria-label={`${isRowSelected ? 'Deselect' : 'Select'} inquiry from ${inq.full_name}`}
                            checked={isRowSelected}
                            className="inquiries-checkbox"
                            disabled={isBulkPending}
                            onChange={() => toggleSelectInquiry(inq.id)}
                            type="checkbox"
                          />
                        </td>
                      )}
                      {/* Type of inquiry */}
                      <td className="inquiries-col-type">
                        <span
                          className={`inquiry-type-pill inquiry-type-pill--${type.toLowerCase()}`}
                        >
                          {type}
                        </span>
                      </td>

                      {/* Sender with Actual Email Profile Avatar (No blue dot) */}
                      <td className="inquiries-col-sender">
                        <div className="inquiries-sender-cell">
                          <InquirySenderAvatar
                            avatarUrl={inq.avatar_url}
                            email={inq.email}
                            gravatarUrl={inq.gravatar_url}
                            name={inq.full_name}
                            size={34}
                          />
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
                        <InquiryStatusBadge status={inq.status} />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    className="inquiries-empty-cell"
                    colSpan={canManage ? 6 : 5}
                  >
                    <div className="inquiries-empty-state">
                      <div aria-hidden="true" className="inquiries-empty-icon">
                        ✦
                      </div>
                      <h3>No contacts found</h3>
                      <p>
                        {searchQuery
                          ? `No contacts match "${searchQuery}". Try a different keyword.`
                          : `There are no contacts matching the "${activeOption.label}" filter.`}
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
            <strong>{inquiries.length}</strong> contacts
          </span>
        </div>
      </div>

      {/* Pop-up iOS Sheet Modal to View Message, Details, and Reply */}
      <dialog
        aria-labelledby="inquiry-modal-title"
        aria-modal="true"
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
          <InquiryDetailSheet
            canManage={canManage}
            copiedAudit={copiedAudit}
            copiedEmail={copiedEmail}
            dragOffsetY={dragOffsetY}
            inquiry={selectedInquiry}
            isReplying={isReplying}
            isSendingReply={isSendingReply}
            isUpdatingStatus={isUpdatingStatus}
            onApplyTemplate={handleApplyTemplate}
            onCancelReply={() => {
              setIsReplying(false)
              setReplyError(null)
            }}
            onChangeReplyBody={setReplyBody}
            onChangeReplySubject={setReplySubject}
            onClose={handleCloseModal}
            onCopyAudit={handleCopyAudit}
            onCopyEmail={handleCopyEmail}
            onSendReply={handleSendReply}
            onStartReply={() => setIsReplying(true)}
            onTouchEndSheet={handleSheetTouchEnd}
            onTouchMoveSheet={handleSheetTouchMove}
            onTouchStartHeader={(e) => handleSheetTouchStart(e, true)}
            onTouchStartScroll={(e) => handleSheetTouchStart(e, false)}
            onUpdateStatus={handleSingleStatusUpdate}
            replyBody={replyBody}
            replyBodyId={replyBodyId}
            replyError={replyError}
            replySubject={replySubject}
            replySubjectId={replySubjectId}
            scrollContentRef={scrollContentRef}
            selectedTemplateId={selectedTemplateId}
          />
        )}
      </dialog>

      <AdminConfirmDialog
        cancelText="Cancel"
        confirmText={
          isBulkPending
            ? 'Deleting…'
            : selectedVisibleIds.length === 1
              ? 'Delete Contact'
              : `Delete ${selectedVisibleIds.length} Contacts`
        }
        description={
          selectedVisibleIds.length === 1
            ? 'Are you sure you want to permanently delete this contact inquiry? This action cannot be undone.'
            : `Are you sure you want to permanently delete these ${selectedVisibleIds.length} selected contact inquiries? This action cannot be undone.`
        }
        disabled={isBulkPending}
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={
          selectedVisibleIds.length === 1
            ? 'Delete contact permanently?'
            : `Delete ${selectedVisibleIds.length} contacts permanently?`
        }
        tone="danger"
      />

      {/* iOS Glassmorphism Reply Outcome Confirmation Modal */}
      <dialog
        aria-labelledby="reply-outcome-title"
        aria-modal="true"
        className="inquiries-outcome-modal"
        onCancel={(e) => {
          e.preventDefault()
          if (!isSendingReply) {
            setReplyOutcome(null)
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSendingReply) {
            setReplyOutcome(null)
          }
        }}
        ref={outcomeDialogRef}
      >
        {replyOutcome && (
          <InquiryReplyOutcomeModal
            isSendingReply={isSendingReply}
            onClose={() => setReplyOutcome(null)}
            onCloseInquiry={handleCloseModal}
            onRetry={() => {
              setReplyOutcome(null)
              handleSendReply()
            }}
            outcome={replyOutcome}
            primaryButtonRef={outcomePrimaryBtnRef}
          />
        )}
      </dialog>
    </div>
  )
}
