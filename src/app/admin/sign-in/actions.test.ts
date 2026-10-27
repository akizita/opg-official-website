import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/auth/admin-session', () => ({
  getAdminSession: vi.fn(),
  getAdminAuthDestination: vi.fn(() => '/admin'),
}))

import { createClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/auth/admin-session'

import { signInAction, signInWithGoogleAction } from './actions'

describe('administrator sign-in', () => {
  const signInWithOAuth = vi.fn()
  const signInWithPassword = vi.fn()
  const signOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    vi.mocked(createClient).mockResolvedValue({
      auth: { signInWithOAuth, signInWithPassword, signOut },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('uses the configured site origin for Google OAuth', async () => {
    signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/example' },
      error: null,
    })

    await expect(signInWithGoogleAction()).rejects.toThrow(
      'REDIRECT:https://accounts.google.com/example',
    )
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback?next=%2Fadmin',
        queryParams: { prompt: 'select_account' },
      },
    })
  })

  it('signs out an authenticated account without an admin profile', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
    vi.mocked(getAdminSession).mockResolvedValue(null)
    const form = new FormData()
    form.set('email', 'visitor@example.com')
    form.set('password', 'correct-password')

    const result = await signInAction({ status: 'idle', message: '' }, form)

    expect(result.status).toBe('error')
    expect(result.message).toContain('administrator access')
    expect(signOut).toHaveBeenCalled()
  })
})
