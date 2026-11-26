import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import {
  formatMiddleTruncate,
  formatSheetDateTime,
  getSheetStatusMeta,
  InquiriesInbox,
  InquiryDetailSheet,
  InquiryReplyOutcomeModal,
  parseInquiryDetails,
  REPLY_TEMPLATES,
  type InquiryItem,
} from './inquiries-inbox'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const sampleInquiries: InquiryItem[] = [
  {
    id: 'sample-1',
    full_name: 'John Doe',
    email: 'john@example.com',
    subject: '[Client] Enterprise Staffing Requirement',
    message: 'We are looking to scale our offshore engineering team by 10 senior developers.',
    status: 'new',
    submitted_at: '2026-10-28T08:30:00Z',
    ip_hash: 'abc123hash',
    retention_expires_at: '2027-10-28T08:30:00Z',
  },
  {
    id: 'sample-2',
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    subject: '[Talent] Senior Full Stack Application',
    message: 'I would like to apply for the Lead React / Node.js role.',
    status: 'replied',
    submitted_at: '2026-10-27T14:15:00Z',
  },
]

describe('parseInquiryDetails', () => {
  it('correctly identifies Client inquiry intent', () => {
    const res = parseInquiryDetails('[Client] Team Scaling')
    expect(res.type).toBe('Client')
    expect(res.cleanSubject).toBe('Team Scaling')
  })

  it('correctly identifies Talent inquiry intent', () => {
    const res = parseInquiryDetails('[Talent] Candidate Resume')
    expect(res.type).toBe('Talent')
    expect(res.cleanSubject).toBe('Candidate Resume')
  })

  it('falls back to General for un-prefixed subject', () => {
    const res = parseInquiryDetails('General Partnership Inquiry')
    expect(res.type).toBe('General')
    expect(res.cleanSubject).toBe('General Partnership Inquiry')
  })
})

describe('InquiriesInbox component', () => {
  it('renders the glassmorphism pill filter and email inbox table structure', () => {
    const html = renderToString(
      createElement(InquiriesInbox, {
        initialInquiries: sampleInquiries,
        canManage: true,
        initialStatus: 'all',
      }),
    )

    // Full-width Header Section & Toolbar Row
    expect(html).toContain('inquiries-header-section')
    expect(html).toContain('inquiries-toolbar-row')

    // Search bar & visible Search button
    expect(html).toContain('role="search"')
    expect(html).toContain('inquiries-search-btn')
    expect(html).toContain('Search')
    expect(html).not.toContain('Open in Mail App')
    expect(html).not.toContain('mailto:')

    // Pill dropdown filter (default All Contacts)
    expect(html).toContain('inquiries-pill-filter')
    expect(html).toContain('inquiries-pill-filter__trigger')
    expect(html).toContain('All Contacts')

    // Card table (email inbox style)
    expect(html).toContain('inquiries-card-table')
    expect(html).toContain('inquiries-inbox-table')
    expect(html).toContain('John Doe')
    expect(html).toContain('john@example.com')
    expect(html).toContain('Enterprise Staffing Requirement')
    expect(html).toContain('We are looking to scale our offshore engineering team')

    // Badges & types
    expect(html).toContain('inquiry-type-pill--client')
    expect(html).toContain('inquiry-type-pill--talent')

    // Contact Status Pills (Verified not DRAFT)
    expect(html).toContain('inquiry-status-pill--new')
    expect(html).toContain('inquiry-status-pill--replied')
    expect(html).not.toContain('• DRAFT')

    // Multi-select checkboxes & unread/read contrast classes
    expect(html).toContain('Select all visible contacts')
    expect(html).toContain('Select inquiry from John Doe')
    expect(html).toContain('inquiries-inbox-row--new')
    expect(html).toContain('inquiries-inbox-row--read')

    // Sound toggle removed from toolbar
    expect(html).not.toContain('inquiries-sound-toggle')
    expect(html).not.toContain('Sound On')
  })

  it('renders clean empty state without reset filters button when no inquiries match', () => {
    const html = renderToString(
      createElement(InquiriesInbox, {
        initialInquiries: [],
        canManage: true,
        initialStatus: 'read',
      }),
    )

    expect(html).toContain('No contacts found')
    expect(html).toContain('inquiries-empty-state')
    expect(html).not.toContain('Reset filters')
  })

  it('gives every reply template an organized specific subject title', () => {
    const subjects = REPLY_TEMPLATES.map((template) =>
      template.getSubject('Engineering Pod Inquiry'),
    )

    expect(subjects).toEqual([
      'Re: OPG Inquiry Acknowledgement — Engineering Pod Inquiry',
      'Re: OPG Client Staffing Consultation — Engineering Pod Inquiry',
      'Re: OPG Career Opportunities — Engineering Pod Inquiry',
      'Re: OPG Project Scope & Details Request — Engineering Pod Inquiry',
    ])
    expect(new Set(subjects).size).toBe(REPLY_TEMPLATES.length)
    expect(REPLY_TEMPLATES[0].getSubject('   ')).toBe(
      'Re: OPG Inquiry Acknowledgement',
    )
  })

  it('renders native iOS sheet inquiry modal without legacy stripes, pills, or monospace chips', () => {
    const html = renderToString(
      createElement(InquiryDetailSheet, {
        inquiry: {
          ...sampleInquiries[1],
          id: 'b750cc16-aaaa-bbbb-cccc-1234567890ab',
          ip_hash: 'eff8e7ca586627fe7c42a1',
          retention_expires_at: '2027-11-26T08:05:00Z',
        },
        canManage: true,
        copiedEmail: false,
        copiedAudit: false,
        isReplying: false,
        isSendingReply: false,
        isUpdatingStatus: false,
        replySubject: '',
        replyBody: '',
        replyError: null,
        selectedTemplateId: 'ack',
        replyBodyId: 'reply-body',
        replySubjectId: 'reply-subject',
        onClose: vi.fn(),
        onCopyEmail: vi.fn(),
        onCopyAudit: vi.fn(),
        onStartReply: vi.fn(),
        onCancelReply: vi.fn(),
        onSendReply: vi.fn(),
        onUpdateStatus: vi.fn(),
        onApplyTemplate: vi.fn(),
        onChangeReplySubject: vi.fn(),
        onChangeReplyBody: vi.fn(),
      }),
    )

    // Sheet container, grabber, header title, avatar, icon copy & close button
    expect(html).toContain('inquiries-modal__card')
    expect(html).toContain('inquiries-sheet__grabber')
    expect(html).toContain('id="inquiry-modal-title"')
    expect(html).toContain('Jane Smith')
    expect(html).toContain('aria-label="Copy email address"')
    expect(html).toContain('aria-label="Close dialog"')
    expect(html).toContain('inquiries-sheet__status--replied')

    // Low-exposure inquiry context blocks & compact bottom metadata footer
    const normalizedHtml = html.replace(/<!-- -->/g, '')
    expect(normalizedHtml).toContain('inquiries-sheet__context-card')
    expect(normalizedHtml).toContain('inquiries-sheet__group-label')
    expect(normalizedHtml).toContain('Subject')
    expect(normalizedHtml).toContain('Message')
    expect(normalizedHtml).toContain('inquiries-sheet__meta-footer')
    expect(normalizedHtml).toContain('Ref: OPG-B750CC16')
    expect(normalizedHtml).toContain('Retention until')
    expect(normalizedHtml).toContain('Audit: eff8e7ca…7c42a1')
    expect(normalizedHtml).toContain('aria-label="Copy audit reference"')
    expect(normalizedHtml).not.toContain('inquiries-sheet__details-row')
    expect(normalizedHtml).not.toContain('Received')

    // Sticky action bar with brand orange Reply CTA and tinted secondary row
    expect(html).toContain('inquiries-sheet__actions')
    expect(html).toContain('inquiries-sheet__primary-btn')
    expect(html).toContain('Mark as unread')
    expect(html).toContain('Archive')

    // Removed legacy elements & monospace chips
    expect(html).not.toContain('<code>')
    expect(html).not.toContain('inquiry-type-pill')
    expect(html).not.toContain('inquiry-status-pill')
    expect(html).not.toContain('inquiries-modal__ref-tag')
    expect(html).not.toContain('inquiries-modal__audit-footer')
    expect(html).not.toContain('inquiries-gmail-reply-btn')

    // Active reply composer puts template dropdown aligned with Message label below Subject
    const replyingHtml = renderToString(
      createElement(InquiryDetailSheet, {
        inquiry: {
          ...sampleInquiries[1],
          id: 'b750cc16-aaaa-bbbb-cccc-1234567890ab',
        },
        canManage: true,
        copiedEmail: false,
        copiedAudit: false,
        isReplying: true,
        isSendingReply: false,
        isUpdatingStatus: false,
        replySubject: 'Re: OPG Inquiry Acknowledgement',
        replyBody: 'Hi Jane',
        replyError: null,
        selectedTemplateId: 'ack',
        replyBodyId: 'reply-body',
        replySubjectId: 'reply-subject',
        onClose: vi.fn(),
        onCopyEmail: vi.fn(),
        onCopyAudit: vi.fn(),
        onStartReply: vi.fn(),
        onCancelReply: vi.fn(),
        onSendReply: vi.fn(),
        onUpdateStatus: vi.fn(),
        onApplyTemplate: vi.fn(),
        onChangeReplySubject: vi.fn(),
        onChangeReplyBody: vi.fn(),
      }),
    )

    expect(replyingHtml).toContain('inquiries-sheet__composer-body-header')
    const subjectIndex = replyingHtml.indexOf('aria-label="Reply subject"')
    const messageLabelIndex = replyingHtml.indexOf('for="reply-body"')
    const templateSelectIndex = replyingHtml.indexOf(
      'aria-label="Select response template"',
    )
    expect(subjectIndex).toBeGreaterThan(-1)
    expect(messageLabelIndex).toBeGreaterThan(subjectIndex)
    expect(templateSelectIndex).toBeGreaterThan(messageLabelIndex)
  })

  it('formats sheet timestamps, middle-truncated audit hashes, and status metadata cleanly', () => {
    expect(formatMiddleTruncate('eff8e7ca586627fe7c42a1')).toBe('eff8e7ca…7c42a1')
    expect(formatMiddleTruncate('short')).toBe('short')
    expect(formatSheetDateTime('2026-11-26T00:05:00Z')).toContain('at ')
    expect(getSheetStatusMeta('replied')).toEqual({
      tone: 'replied',
      label: 'Replied',
    })
    expect(getSheetStatusMeta('new')).toEqual({
      tone: 'pending',
      label: 'New',
    })
  })

  it('renders iOS glassmorphism reply outcome modal for sent and failed deliveries', () => {
    const successHtml = renderToString(
      createElement(InquiryReplyOutcomeModal, {
        outcome: {
          kind: 'success',
          recipientName: 'Jane Smith',
          recipientEmail: 'jane@example.com',
          subject: 'Re: OPG Inquiry Acknowledgement',
          referenceCode: 'OPG-B750CC16',
          messageId: 'msg-123',
        },
        isSendingReply: false,
        onClose: vi.fn(),
        onCloseInquiry: vi.fn(),
        onRetry: vi.fn(),
      }),
    )

    expect(successHtml).toContain('inquiries-outcome-card--success')
    expect(successHtml).toContain('inquiries-outcome-check-path')
    expect(successHtml).toContain('id="reply-outcome-title"')
    expect(successHtml).toContain('Reply Sent')
    expect(successHtml).toContain('Jane Smith')
    expect(successHtml).toContain('jane@example.com')
    expect(successHtml).toContain('OPG-B750CC16')
    expect(successHtml).toContain('Done')
    expect(successHtml).toContain('Close Inquiry')

    const errorHtml = renderToString(
      createElement(InquiryReplyOutcomeModal, {
        outcome: {
          kind: 'error',
          recipientName: 'John Doe',
          recipientEmail: 'john@example.com',
          subject: 'Re: Team Scaling',
          errorMessage: 'Resend domain verification required.',
        },
        isSendingReply: false,
        onClose: vi.fn(),
        onCloseInquiry: vi.fn(),
        onRetry: vi.fn(),
      }),
    )

    expect(errorHtml).toContain('inquiries-outcome-card--error')
    expect(errorHtml).toContain('Delivery Failed')
    expect(errorHtml).toContain('Resend domain verification required.')
    expect(errorHtml).toContain('Retry Send')
    expect(errorHtml).toContain('Edit Reply')
  })
})

