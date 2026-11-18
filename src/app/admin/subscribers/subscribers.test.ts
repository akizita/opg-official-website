import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  requireAdminSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn(),
}))

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
  getSubscriberStatusLabel,
  type SubscriberItem,
} from '@/app/admin/subscribers/subscriber-utils'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { createPrivilegedClient } from '@/lib/supabase/server'

const SAMPLE_SUBSCRIBERS: SubscriberItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email_normalized: 'alice.tan@acme.com',
    display_name: 'Alice Tan',
    status: 'confirmed',
    confirmation_sent_at: '2026-11-18T02:00:00.000Z',
    confirmed_at: '2026-11-18T02:05:00.000Z',
    unsubscribed_at: null,
    consent_version: '1.0',
    consent_source: 'footer_form',
    created_at: '2026-11-18T02:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email_normalized: 'bob.reyes@northstar.io',
    status: 'pending_confirmation',
    confirmation_sent_at: '2026-11-10T08:00:00.000Z',
    confirmed_at: null,
    unsubscribed_at: null,
    consent_version: '1.0',
    consent_source: 'admin_manual',
    created_at: '2026-11-10T08:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email_normalized: '=malicious@example.com',
    status: 'unsubscribed',
    confirmation_sent_at: '2026-10-01T08:00:00.000Z',
    confirmed_at: '2026-10-01T08:10:00.000Z',
    unsubscribed_at: '2026-10-15T12:00:00.000Z',
    consent_version: '1.0',
    consent_source: 'client_request',
    created_at: '2026-10-01T08:00:00.000Z',
  },
]

describe('subscriber-utils', () => {
  it('formats consent sources and status labels cleanly', () => {
    expect(formatConsentSource('footer_form')).toBe('Footer Form')
    expect(formatConsentSource('admin_manual')).toBe('Admin Manual')
    expect(formatConsentSource('custom_partner_campaign')).toBe(
      'Custom Partner Campaign',
    )
    expect(getSubscriberStatusLabel('confirmed')).toBe('Confirmed')
    expect(getSubscriberStatusLabel('pending_confirmation')).toBe('Pending')
    expect(getSubscriberStatusLabel('unsubscribed')).toBe('Unsubscribed')
  })

  it('derives display names from profile or email local-part', () => {
    expect(deriveSubscriberDisplayName(SAMPLE_SUBSCRIBERS[0])).toBe('Alice Tan')
    expect(deriveSubscriberDisplayName(SAMPLE_SUBSCRIBERS[1])).toBe('Bob Reyes')
  })

  it('filters subscribers by status, search query, and date range', () => {
    expect(
      filterSubscribers(SAMPLE_SUBSCRIBERS, {
        statusFilter: 'confirmed',
        searchQuery: '',
        dateRange: null,
      }),
    ).toHaveLength(1)

    expect(
      filterSubscribers(SAMPLE_SUBSCRIBERS, {
        statusFilter: 'all',
        searchQuery: 'northstar',
        dateRange: null,
      }).map((s) => s.email_normalized),
    ).toEqual(['bob.reyes@northstar.io'])

    const cutoff = computeDateCutoff(
      '7days',
      '',
      new Date('2026-11-18T12:00:00.000Z'),
    )
    expect(
      filterSubscribers(SAMPLE_SUBSCRIBERS, {
        statusFilter: 'all',
        searchQuery: '',
        dateRange: cutoff,
      }).map((s) => s.email_normalized),
    ).toEqual(['alice.tan@acme.com'])
  })

  it('exports CSV and neutralizes spreadsheet formula prefixes', () => {
    const csv = buildSubscribersCsv(SAMPLE_SUBSCRIBERS)
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe(
      'Email,Status,Consent Source,Consent Version,Subscribed At,Confirmed At,Unsubscribed At',
    )
    expect(lines[1]).toContain('alice.tan@acme.com,confirmed,footer_form,1.0')
    expect(lines[3].startsWith("'=malicious@example.com,")).toBe(true)
  })
})

describe('admin subscriber actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdminSession).mockResolvedValue({
      profile: {
        id: 'admin-1',
        email: 'admin@opglobal.com.hk',
        displayName: 'OPG Admin',
        avatarUrl: null,
        roleKey: 'super_admin',
        roleDisplayName: 'Super Admin',
      },
    } as never)
  })

  it('blocks unauthorized roles from modifying subscribers', async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      profile: {
        id: 'editor-1',
        email: 'editor@opglobal.com.hk',
        displayName: 'Editor',
        avatarUrl: null,
        roleKey: 'editor',
        roleDisplayName: 'Editor',
      },
    } as never)

    const res = await addSubscriberAction({ email: 'new@company.com' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('permission')
  })

  it('validates email format and prevents duplicate registrations', async () => {
    const invalid = await addSubscriberAction({ email: 'bad-email' })
    expect(invalid.success).toBe(false)

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'existing-id', status: 'confirmed' },
              error: null,
            }),
          }),
        }),
      }),
    }
    vi.mocked(createPrivilegedClient).mockReturnValue(mockClient as never)

    const duplicate = await addSubscriberAction({
      email: 'alice.tan@acme.com',
    })
    expect(duplicate.success).toBe(false)
    expect(duplicate.error).toContain('already registered')
  })

  it('adds confirmed subscriber cleanly', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '44444444-4444-4444-8444-444444444444' },
              error: null,
            }),
          }),
        }),
      }),
    }
    vi.mocked(createPrivilegedClient).mockReturnValue(mockClient as never)

    const res = await addSubscriberAction({
      email: 'NewLead@Example.com',
      source: 'client_request',
      status: 'confirmed',
    })
    expect(res.success).toBe(true)
    expect(res.id).toBe('44444444-4444-4444-8444-444444444444')
  })

  it('updates subscriber status, resends pending confirmations, and deletes safely', async () => {
    const mockOutboxInsert = vi.fn().mockResolvedValue({ error: null })
    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'notification_outbox') {
          return { insert: mockOutboxInsert }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: '22222222-2222-4222-8222-222222222222',
                  email_normalized: 'bob.reyes@northstar.io',
                  status: 'pending_confirmation',
                },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }),
    }
    vi.mocked(createPrivilegedClient).mockReturnValue(mockClient as never)

    const updated = await updateSubscriberStatusAction(
      '22222222-2222-4222-8222-222222222222',
      'confirmed',
    )
    expect(updated.success).toBe(true)

    const resent = await resendSubscriberConfirmationAction(
      '22222222-2222-4222-8222-222222222222',
    )
    expect(resent.success).toBe(true)
    expect(mockOutboxInsert).toHaveBeenCalledTimes(1)

    const deleted = await deleteSubscriberAction(
      '22222222-2222-4222-8222-222222222222',
    )
    expect(deleted.success).toBe(true)
  })
})
