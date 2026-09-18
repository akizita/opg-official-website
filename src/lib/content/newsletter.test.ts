import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createStaticClient: vi.fn(),
}))

import {
  confirmNewsletterSubscription,
  generateToken,
  hashToken,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from '@/lib/content/newsletter'
import { createClient } from '@/lib/supabase/server'

describe('newsletter double opt-in tokens', () => {
  it('generates a 64-character random token and hashes it', () => {
    const token = generateToken()
    expect(token).toHaveLength(64)

    const hash = hashToken(token)
    expect(hash).toHaveLength(64)
    expect(hash).not.toBe(token)
  })
})

describe('newsletter subscription flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid email address', async () => {
    const result = await subscribeToNewsletter('not-an-email')
    expect(result.success).toBe(false)
    expect(result.error).toContain('valid email')
  })

  it('upserts pending subscription and queues confirmation email', async () => {
    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'newsletter_subscriptions') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'notification_outbox') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await subscribeToNewsletter('reader@example.com')
    expect(result.success).toBe(true)
    expect(result.message).toContain('confirm your subscription')
    expect(result.token).toBeDefined()
  })

  it('confirms subscription with matching token hash', async () => {
    const token = 'sample-verification-token'
    const tokenHash = hashToken(token)

    const mockSub = {
      id: 'sub-1',
      status: 'pending_confirmation',
      confirmation_token_hash: tokenHash,
    }

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSub, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await confirmNewsletterSubscription(
      token,
      'reader@example.com',
    )
    expect(result.success).toBe(true)
    expect(result.message).toContain('confirmed')
  })

  it('handles unsubscribe request', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockClient as never)

    const result = await unsubscribeFromNewsletter(
      'any-token',
      'reader@example.com',
    )
    expect(result.success).toBe(true)
    expect(result.message).toContain('unsubscribed')
  })
})
