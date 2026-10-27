import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createPrivilegedClient: vi.fn(),
}))

import {
  checkRateLimits,
  hashValue,
  submitContactInquiry,
  validateInquiryInput,
} from '@/lib/content/inquiries'
import { createPrivilegedClient } from '@/lib/supabase/server'

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
      elapsedSeconds: 5,
    }

    const { data, errors } = validateInquiryInput(honeypotSubmission)
    expect(data).toBeNull()
    expect(errors.form).toBeDefined()
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
    expect(errors.form).toBeDefined()
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
    vi.mocked(createPrivilegedClient).mockReset()
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
      { clientIp: '198.51.100.1', client: mockClient as never },
    )

    expect(result.success).toBe(true)
    expect(result.referenceId).toBe('OPG-INQ-1234')
  })

  it('uses the server-only client so public inquiries enter the protected inbox', async () => {
    const inquiryInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'inq-87654321-uuid' },
          error: null,
        }),
      }),
    })
    const notificationInsert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn((table: string) =>
      table === 'contact_inquiries'
        ? { insert: inquiryInsert }
        : { insert: notificationInsert },
    )
    vi.mocked(createPrivilegedClient).mockReturnValue({ from } as never)

    const result = await submitContactInquiry(
      {
        fullName: 'Morgan Lee',
        email: 'morgan@example.com',
        subject: 'A project inquiry',
        message: 'Please contact me about a dedicated delivery team.',
        intent: 'talent',
        privacyConsent: true,
        elapsedSeconds: 5,
      },
      { clientIp: '198.51.100.2' },
    )

    expect(result).toEqual({ success: true, referenceId: 'OPG-INQ-8765' })
    expect(from).toHaveBeenCalledWith('contact_inquiries')
    expect(from).toHaveBeenCalledWith('notification_outbox')
    expect(inquiryInsert).toHaveBeenCalledWith(
      expect.objectContaining({ subject: '[Talent] A project inquiry' }),
    )
    expect(notificationInsert).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: 'recruitment@opglobal.com.hk' }),
    )
  })

  it('allows retry after a database failure without acknowledging an unsaved inquiry', async () => {
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'offline' } })
      .mockResolvedValueOnce({ data: { id: 'inq-abcdef12-uuid' }, error: null })
    const client = {
      from: vi.fn((table: string) =>
        table === 'contact_inquiries'
          ? {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({ single }),
              }),
            }
          : { insert: vi.fn().mockResolvedValue({ error: null }) },
      ),
    }
    const input = {
      fullName: 'Retry Person',
      email: 'retry-contact@example.com',
      subject: 'A project inquiry',
      message: 'Please contact me about a dedicated delivery team.',
      privacyConsent: true,
      elapsedSeconds: 5,
    }
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const first = await submitContactInquiry(input, {
        clientIp: '198.51.100.3',
        client: client as never,
      })
      const second = await submitContactInquiry(input, {
        clientIp: '198.51.100.3',
        client: client as never,
      })

      expect(first.success).toBe(false)
      expect(second).toEqual({ success: true, referenceId: 'OPG-INQ-ABCD' })
      expect(single).toHaveBeenCalledTimes(2)
    } finally {
      errorLog.mockRestore()
    }
  })

  it('keeps the saved inquiry successful when notification queuing fails', async () => {
    const client = {
      from: vi.fn((table: string) =>
        table === 'contact_inquiries'
          ? {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'inq-fedcba98-uuid' },
                    error: null,
                  }),
                }),
              }),
            }
          : { insert: vi.fn().mockRejectedValue(new Error('queue offline')) },
      ),
    }
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const result = await submitContactInquiry(
        {
          fullName: 'Taylor Cruz',
          email: 'taylor@example.com',
          subject: 'A project inquiry',
          message: 'Please contact me about a dedicated delivery team.',
          privacyConsent: true,
          elapsedSeconds: 5,
        },
        { clientIp: '198.51.100.4', client: client as never },
      )

      expect(result).toEqual({ success: true, referenceId: 'OPG-INQ-FEDC' })
      expect(errorLog).toHaveBeenCalled()
    } finally {
      errorLog.mockRestore()
    }
  })

  it('reports unavailable storage instead of claiming success without a server key', async () => {
    vi.mocked(createPrivilegedClient).mockReturnValue(null)
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      const result = await submitContactInquiry(
        {
          fullName: 'Robin Kim',
          email: 'robin@example.com',
          subject: 'A project inquiry',
          message: 'Please contact me about a dedicated delivery team.',
          privacyConsent: true,
          elapsedSeconds: 5,
        },
        { clientIp: '198.51.100.5' },
      )

      expect(result.success).toBe(false)
      expect(result.errors?.form).toContain('temporarily unavailable')
    } finally {
      errorLog.mockRestore()
    }
  })
})
