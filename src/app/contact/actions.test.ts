import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi
    .fn()
    .mockResolvedValue(
      new Headers({ 'x-forwarded-for': '198.51.100.21, 10.0.0.1' }),
    ),
}))
vi.mock('@/lib/content/inquiries', () => ({ submitContactInquiry: vi.fn() }))

import { submitContactAction } from '@/app/contact/actions'
import { submitContactInquiry } from '@/lib/content/inquiries'

describe('submitContactAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes the contact form and verification token to the inquiry writer', async () => {
    vi.mocked(submitContactInquiry).mockResolvedValue({
      success: true,
      referenceId: 'OPG-12345678',
    })
    const form = new FormData()
    form.set('fullName', 'Jamie Test')
    form.set('email', 'jamie@example.com')
    form.set('subject', 'Staffing inquiry')
    form.set('message', 'Please contact me about a dedicated staffing team.')
    form.set('intent', 'client')
    form.set('privacyConsent', 'on')
    form.set('elapsedSeconds', '12')
    form.set('cf-turnstile-response', 'verified-token')

    const result = await submitContactAction(form)

    expect(result.success).toBe(true)
    expect(submitContactInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Jamie Test',
        turnstileToken: 'verified-token',
        privacyConsent: true,
        elapsedSeconds: 12,
      }),
      { clientIp: '198.51.100.21' },
    )
  })
})
