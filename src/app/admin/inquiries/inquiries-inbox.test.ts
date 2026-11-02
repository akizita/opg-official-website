import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import {
  InquiriesInbox,
  parseInquiryDetails,
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

    // Pill dropdown filter
    expect(html).toContain('inquiries-pill-filter')
    expect(html).toContain('inquiries-pill-filter__trigger')
    expect(html).toContain('All Inquiries')

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
  })

  it('renders clean empty state without reset filters button when no inquiries match', () => {
    const html = renderToString(
      createElement(InquiriesInbox, {
        initialInquiries: [],
        canManage: true,
        initialStatus: 'read',
      }),
    )

    expect(html).toContain('No inquiries found')
    expect(html).toContain('inquiries-empty-state')
    expect(html).not.toContain('Reset filters')
  })
})

