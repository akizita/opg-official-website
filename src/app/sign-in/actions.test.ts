import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { visitorGoogleSignInAction, visitorSignInAction } from './actions'
import { createClient } from '@/lib/supabase/server'

describe('visitor sign-in', () => {
  const signInWithPassword = vi.fn()
  const signInWithOAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: { signInWithPassword, signInWithOAuth },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('signs in with email and password and redirects to Contact Us', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    const form = new FormData()
    form.set('email', ' VISITOR@example.com ')
    form.set('password', 'correct-password')
    form.set('next', '/contact')

    await expect(
      visitorSignInAction({ status: 'idle', message: '' }, form),
    ).rejects.toThrow('REDIRECT:/contact')
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'visitor@example.com',
      password: 'correct-password',
    })
  })

  it('does not accept an external post-login destination', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    const form = new FormData()
    form.set('email', 'visitor@example.com')
    form.set('password', 'correct-password')
    form.set('next', 'https://attacker.example')

    await expect(
      visitorSignInAction({ status: 'idle', message: '' }, form),
    ).rejects.toThrow('REDIRECT:/contact')
  })

  it('starts Google OAuth with the public callback', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/example' },
      error: null,
    })
    const form = new FormData()
    form.set('next', '/contact')

    try {
      await expect(visitorGoogleSignInAction(form)).rejects.toThrow(
        'REDIRECT:https://accounts.google.com/example',
      )
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback?next=%2Fcontact',
          queryParams: { prompt: 'select_account' },
        },
      })
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
