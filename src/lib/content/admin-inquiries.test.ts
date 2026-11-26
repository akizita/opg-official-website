import { afterEach, describe, expect, it, vi } from 'vitest'

const { buildGravatarUrlMock, resolveAuthAvatarsByEmailMock } = vi.hoisted(
  () => ({
    buildGravatarUrlMock: vi.fn((email: string) => `gravatar:${email}`),
    resolveAuthAvatarsByEmailMock: vi.fn(async () => new Map<string, string>()),
  }),
)

vi.mock('@/lib/auth/user-avatars', () => ({
  buildGravatarUrl: buildGravatarUrlMock,
  resolveAuthAvatarsByEmail: resolveAuthAvatarsByEmailMock,
}))

import {
  broadcastAdminInquiriesChanged,
  loadAdminInquiries,
} from './admin-inquiries'

function createSupabaseMock({
  data,
  error,
}: {
  data: Record<string, unknown>[] | null
  error: { message: string } | null
}) {
  const order = vi.fn(async () => ({ data, error }))
  const select = vi.fn(() => ({ order }))
  const from = vi.fn(() => ({ select }))
  return { from, select, order }
}

describe('admin-inquiries helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    resolveAuthAvatarsByEmailMock.mockResolvedValue(new Map())
  })

  it('loads ordered inquiries and enriches auth avatars and Gravatar URLs', async () => {
    resolveAuthAvatarsByEmailMock.mockResolvedValueOnce(
      new Map([['aki@example.com', 'https://cdn.example.com/aki.png']]),
    )
    const supabase = createSupabaseMock({
      data: [
        {
          id: 'inq-1',
          full_name: 'Aki Zita',
          email: '  Aki@Example.com ',
          subject: '[Client] Hello',
          message: 'Test body',
          status: 'new',
          submitted_at: '2026-11-26T00:00:00Z',
        },
      ],
      error: null,
    })

    const result = await loadAdminInquiries(supabase as never)

    expect(result.error).toBeNull()
    expect(supabase.from).toHaveBeenCalledWith('contact_inquiries')
    expect(supabase.order).toHaveBeenCalledWith('submitted_at', {
      ascending: false,
    })
    expect(result.inquiries).toEqual([
      {
        id: 'inq-1',
        full_name: 'Aki Zita',
        email: '  Aki@Example.com ',
        subject: '[Client] Hello',
        message: 'Test body',
        status: 'new',
        submitted_at: '2026-11-26T00:00:00Z',
        avatar_url: 'https://cdn.example.com/aki.png',
        gravatar_url: 'gravatar:  Aki@Example.com ',
      },
    ])
  })

  it('returns an empty list and error message when Supabase fails', async () => {
    const supabase = createSupabaseMock({
      data: null,
      error: { message: 'database unavailable' },
    })

    const result = await loadAdminInquiries(supabase as never)

    expect(result).toEqual({
      error: 'database unavailable',
      inquiries: [],
    })
  })

  it('broadcasts admin-inquiries-realtime changed events when Supabase env is configured', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }))
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://demo.supabase.co/')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'secret-test-key')
    vi.stubGlobal('fetch', fetchMock)

    await broadcastAdminInquiriesChanged()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://demo.supabase.co/realtime/v1/api/broadcast',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'secret-test-key',
          Authorization: 'Bearer secret-test-key',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })
})
