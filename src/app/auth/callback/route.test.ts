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
    const signOut = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession, signOut },
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
        email: 'aki.zita@freedompropertyinvestors.com.au',
        displayName: 'Aki Zita',
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
        email: 'aki.zita@freedompropertyinvestors.com.au',
        displayName: 'Aki Zita',
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
})
