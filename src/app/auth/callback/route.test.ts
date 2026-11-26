import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/admin-session', () => ({
  getAdminSession: vi.fn(),
  getAdminAuthDestination: vi.fn((session) => {
    if (session.currentLevel === 'aal2') return '/admin'
    if (session.nextLevel === 'aal2') return '/admin/mfa/challenge'
    return '/admin/mfa/enroll'
  }),
}))

import { GET } from '@/app/auth/callback/route'
import { getAdminSession } from '@/lib/auth/admin-session'
import { createClient } from '@/lib/supabase/server'

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects with oauth-error when error parameter is present', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?error=access_denied',
    )
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/sign-in?notice=oauth-error',
    )
  })

  it('returns public OAuth errors to the visitor sign-in page', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?error=access_denied&next=/contact',
    )
    const response = await GET(request)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?notice=oauth-error',
    )
  })

  it('redirects with signup-disabled when error_code is signup_disabled', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?error=access_denied&error_code=signup_disabled',
    )
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/sign-in?notice=signup-disabled',
    )
  })

  it('redirects with invalid-link when neither code nor error is present', async () => {
    const request = new NextRequest('http://localhost:3000/auth/callback')
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/sign-in?notice=invalid-link',
    )
  })

  it('redirects with oauth-error when exchangeCodeForSession fails', async () => {
    const exchangeCodeForSession = vi
      .fn()
      .mockResolvedValue({ error: new Error('Exchange failed') })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=bad-code',
    )
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/sign-in?notice=oauth-error',
    )
  })

  it('redirects with unauthorized and signs out if user has no admin session', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { email: 'unknown@example.com' } },
      error: null,
    })
    const signOut = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims, signOut },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    vi.mocked(getAdminSession).mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code',
    )
    const response = await GET(request)
    expect(signOut).toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/sign-in?notice=unauthorized',
    )
  })

  it('reports missing provisioning for the designated OPG account', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { email: 'recruitment@opglobal.com.hk' } },
      error: null,
    })
    const signOut = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims, signOut },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    vi.mocked(getAdminSession).mockResolvedValue(null)

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code',
    )
    const response = await GET(request)

    expect(signOut).toHaveBeenCalled()
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/sign-in?notice=super-admin-provisioning',
    )
  })

  it('redirects to /admin/mfa/enroll if session requires MFA enrollment', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal1',
      profile: {
        id: 'admin-1',
        email: 'recruitment@opglobal.com.hk',
        displayName: 'OPG',
        roleKey: 'super_admin',
        roleDisplayName: 'Super Admin',
        isActive: true,
      },
    })

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code',
    )
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/mfa/enroll',
    )
  })

  it('redirects to safe admin destination if AAL2 MFA is already met', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    vi.mocked(getAdminSession).mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      profile: {
        id: 'admin-1',
        email: 'recruitment@opglobal.com.hk',
        displayName: 'OPG',
        roleKey: 'super_admin',
        roleDisplayName: 'Super Admin',
        isActive: true,
      },
    })

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code&next=/admin/media',
    )
    const response = await GET(request)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/media',
    )
  })

  it('sends a signed-in public visitor to Contact Us without admin provisioning', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { sub: 'visitor-1', email: 'visitor@example.com' } },
      error: null,
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/callback?code=valid-code&next=/contact',
      ),
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )
    expect(getAdminSession).not.toHaveBeenCalled()
  })

  it('hydrates missing avatar_url from Google OIDC userinfo when provider_token is present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'Aki Zita',
          picture: 'https://lh3.googleusercontent.com/a/workspace-photo',
        }),
        { status: 200 },
      ),
    )

    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          provider_token: 'google-access-token-123',
          user: { user_metadata: {} },
        },
      },
      error: null,
    })
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { sub: 'visitor-1', email: 'aki@example.com' } },
      error: null,
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims, updateUser },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/callback?code=valid-code&next=/contact',
      ),
    )

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://openidconnect.googleapis.com/v1/userinfo',
      expect.objectContaining({
        headers: { Authorization: 'Bearer google-access-token-123' },
      }),
    )
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        avatar_url: 'https://lh3.googleusercontent.com/a/workspace-photo',
        full_name: 'Aki Zita',
        picture: 'https://lh3.googleusercontent.com/a/workspace-photo',
      },
    })
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )

    fetchSpy.mockRestore()
  })

  it('refreshes stored avatar_url when a signed-in Google user changes their photo', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'Aki Zita',
          picture: 'https://lh3.googleusercontent.com/a/updated-photo',
        }),
        { status: 200 },
      ),
    )

    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          provider_token: 'google-access-token-new',
          user: {
            user_metadata: {
              avatar_url: 'https://lh3.googleusercontent.com/a/old-photo',
              full_name: 'Aki Zita',
              picture: 'https://lh3.googleusercontent.com/a/old-photo',
            },
          },
        },
      },
      error: null,
    })
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { sub: 'visitor-1', email: 'aki@example.com' } },
      error: null,
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims, updateUser },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/callback?code=valid-code&next=/contact',
      ),
    )

    expect(updateUser).toHaveBeenCalledWith({
      data: {
        avatar_url: 'https://lh3.googleusercontent.com/a/updated-photo',
        picture: 'https://lh3.googleusercontent.com/a/updated-photo',
      },
    })
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )

    fetchSpy.mockRestore()
  })

  it('falls back to Google People API photos when OIDC userinfo omits picture', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: 'Aki Zita' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            names: [{ displayName: 'Aki Zita' }],
            photos: [
              {
                default: false,
                url: 'https://lh3.googleusercontent.com/a/people-api-photo',
              },
            ],
          }),
          { status: 200 },
        ),
      )

    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          provider_token: 'google-access-token-people',
          user: {
            email: 'aki@example.com',
            id: 'user-1',
            identities: [],
            user_metadata: {},
          },
        },
      },
      error: null,
    })
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { sub: 'visitor-1', email: 'aki@example.com' } },
      error: null,
    })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims, updateUser },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/callback?code=valid-code&next=/contact',
      ),
    )

    expect(updateUser).toHaveBeenCalledWith({
      data: {
        avatar_url: 'https://lh3.googleusercontent.com/a/people-api-photo',
        full_name: 'Aki Zita',
        picture: 'https://lh3.googleusercontent.com/a/people-api-photo',
      },
    })
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )

    fetchSpy.mockRestore()
  })
})
