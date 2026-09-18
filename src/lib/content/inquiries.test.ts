import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  checkDuplicateFingerprint,
  checkRateLimits,
  hashValue,
  submitContactInquiry,
  validateInquiryInput,
} from '@/lib/content/inquiries'
import { createClient } from '@/lib/supabase/server'

describe('inquiries schema & validation', () => {
  it('validates a valid inquiry payload', () => {
    const valid = {
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      subject: 'Inquiry on Dedicated Engineering Teams',
      message: 'We are seeking to expand our team with 5 senior engineers.',
      intent: 'client' as const,
      privacyConsent: true,
      elapsedSeconds: 5,
    }

    const { data, errors } = validateInquiryInput(valid)
    expect(errors).toEqual({})
    expect(data).not.toBeNull()
    expect(data?.fullName).toBe('Alice Johnson')
  })

  it('rejects submission if honeypot is populated', () => {
    const honeypotSubmission = {
      fullName: 'Bot User',
      email: 'bot@example.com',
      subject: 'Spam Subject',
      message: 'Spam message content here that meets length requirements.',
      privacyConsent: true,
      honeypot: 'filled_by_bot',
    }

    const { data, errors } = validateInquiryInput(honeypotSubmission)
    expect(data).toBeNull()
    expect(errors.honeypot).toBe('Automated submission detected')
  })

  it('rejects submission if time trap triggered (<2 seconds)', () => {
    const fastSubmission = {
      fullName: 'Fast User',
      email: 'fast@example.com',
      subject: 'Fast Subject Here',
      message: 'Message content that is long enough to pass message length.',
      privacyConsent: true,
      elapsedSeconds: 1,
    }

    const { data, errors } = validateInquiryInput(fastSubmission)
    expect(data).toBeNull()
    expect(errors.timeTrap).toBe('Form submitted too quickly')
  })

  it('rejects submission without privacy consent', () => {
    const noConsent = {
      fullName: 'No Consent User',
      email: 'user@example.com',
      subject: 'Subject Line Here',
      message: 'Message content that is long enough to pass message length.',
      privacyConsent: false,
    }

    const { data, errors } = validateInquiryInput(noConsent)
    expect(data).toBeNull()
    expect(errors.privacyConsent).toBe(
      'You must acknowledge the Privacy Notice to submit',
    )
  })
})

describe('inquiries abuse controls', () => {
  it('hashes values deterministically with sha256', () => {
    const h1 = hashValue('test@example.com')
    const h2 = hashValue('TEST@EXAMPLE.COM ')
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
  })

  it('detects exact duplicate fingerprints within suppression window', () => {
    const email = 'duplicate-test@example.com'
    const message = 'Identical message content for duplication test.'

    const first = checkDuplicateFingerprint(email, message)
    expect(first).toBe(false) // not duplicate yet

    const second = checkDuplicateFingerprint(email, message)
    expect(second).toBe(true) // duplicate!
  })

  it('enforces rate limits per IP and email', () => {
    const ip = '192.0.2.1'
    const email = 'rate-test@example.com'

    // First submissions are allowed
    const allowed = checkRateLimits(ip, email)
    expect(allowed.allowed).toBe(true)
  })
})

describe('inquiry submission database transaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts inquiry and queues notification in outbox', async () => {
    const mockInquiry = { id: 'inq-12345678-uuid' }

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'contact_inquiries') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockInquiry, error: null }),
              }),
            }),
          }
        }
        if (table === 'notification_outbox') {
          return {
            insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await submitContactInquiry(
      {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        subject: 'Engineering Delivery Inquiry',
        message: 'Looking to hire a pod of 3 React engineers for 6 months.',
        intent: 'client',
        privacyConsent: true,
        elapsedSeconds: 5,
        turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
      },
      { clientIp: '198.51.100.1' },
    )

    expect(result.success).toBe(true)
    expect(result.referenceId).toBe('OPG-INQ-1234')
  })
})
