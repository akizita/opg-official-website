import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sendInquiryReplyEmail } from './inquiry-reply'

describe('sendInquiryReplyEmail', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns configured=false when RESEND_API_KEY or CONTACT_FROM_EMAIL is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('CONTACT_FROM_EMAIL', '')

    const result = await sendInquiryReplyEmail({
      to: 'sender@example.com',
      toName: 'Alice Sender',
      subject: 'Re: Staffing inquiry',
      body: 'Thank you for reaching out.',
      referenceId: 'OPG-12345678',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.configured).toBe(false)
      expect(result.error).toContain('RESEND_API_KEY')
    }
  })

  it('posts formatted email payload to Resend when configured', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_12345')
    vi.stubEnv('CONTACT_FROM_EMAIL', 'support@opglobal.com.hk')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_msg_42' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendInquiryReplyEmail({
      to: 'sender@example.com',
      toName: 'Alice Sender',
      subject: 'Re: Staffing inquiry',
      body: 'Hi Alice,\n\nWe received your note.',
      referenceId: 'OPG-12345678',
      replyTo: 'recruitment@opglobal.com.hk',
    })

    expect(result).toEqual({
      ok: true,
      configured: true,
      messageId: 'email_msg_42',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(options.method).toBe('POST')
    const parsed = JSON.parse(String(options.body)) as Record<string, unknown>
    expect(parsed.from).toBe('OutPro Global <support@opglobal.com.hk>')
    expect(parsed.to).toEqual(['sender@example.com'])
    expect(parsed.reply_to).toBe('recruitment@opglobal.com.hk')
    expect(parsed.subject).toBe('Re: Staffing inquiry')
    expect(parsed.html).toContain('OPG-12345678')
    expect(parsed.html).toContain('cid:opg-logo')
    expect(parsed.html).toContain('Outsourced Pro Global')
    expect(parsed.html).toContain('backdrop-filter:blur(20px)')
    expect(parsed.html).not.toContain('#fdf8eb')
    expect(parsed.html).not.toContain('#111216')
    expect(parsed.html).not.toContain('border-left:3px solid #eab308')
    expect(parsed.attachments).toEqual([
      expect.objectContaining({
        content_id: 'opg-logo',
        content_type: 'image/png',
        filename: 'opg-logo.png',
      }),
    ])
  })

  it('returns provider error message when Resend rejects the request', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_12345')
    vi.stubEnv('CONTACT_FROM_EMAIL', 'OutPro <support@opglobal.com.hk>')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Domain not verified in Resend' }),
      }),
    )

    const result = await sendInquiryReplyEmail({
      to: 'sender@example.com',
      toName: 'Alice Sender',
      subject: 'Re: Inquiry',
      body: 'Hello',
      referenceId: 'OPG-ABCD1234',
    })

    expect(result).toEqual({
      ok: false,
      configured: true,
      error: 'Domain not verified in Resend',
    })
  })

  it('strips wrapping quotes from CONTACT_FROM_EMAIL when sending replies', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_12345')
    vi.stubEnv(
      'CONTACT_FROM_EMAIL',
      '"Outsourced Pro Global <noreply@opglobal.com.hk>"',
    )

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_reply_99' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendInquiryReplyEmail({
      to: 'aki@example.com',
      toName: 'Aki Zita',
      subject: 'Re: Engineering Pod Request',
      body: 'Thanks for reaching out — we will follow up shortly.',
      referenceId: 'OPG-87654321',
      replyTo: 'recruitment@opglobal.com.hk',
    })

    expect(result).toEqual({
      ok: true,
      configured: true,
      messageId: 'email_reply_99',
    })
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const parsed = JSON.parse(String(options.body)) as Record<string, unknown>
    expect(parsed.from).toBe('Outsourced Pro Global <noreply@opglobal.com.hk>')
    expect(parsed.to).toEqual(['aki@example.com'])
    expect(parsed.reply_to).toBe('recruitment@opglobal.com.hk')
  })
})
