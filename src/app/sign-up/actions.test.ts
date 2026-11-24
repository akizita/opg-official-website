import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createPrivilegedClient: vi.fn(),
}))

import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

import { visitorSignUpAction } from './actions'

describe('visitor sign-up', () => {
  const signUp = vi.fn()
  const getClaims = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    getClaims.mockResolvedValue({ data: null, error: null })
    vi.mocked(createClient).mockResolvedValue({
      auth: { signUp, getClaims },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })
  afterEach(() => vi.unstubAllEnvs())

  function form() {
    const data = new FormData()
    data.set('email', ' Visitor@Example.com ')
    data.set('password', 'Strong-password-2048')
    data.set('passwordConfirmation', 'Strong-password-2048')
    return data
  }

  it('requests email confirmation with the public callback', async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null })
    const result = await visitorSignUpAction(
      { status: 'idle', message: '' },
      form(),
    )

    expect(result.status).toBe('success')
    expect(signUp).toHaveBeenCalledWith({
      email: 'visitor@example.com',
      password: 'Strong-password-2048',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?next=%2Fcontact',
      },
    })
  })

  it('rejects a weak password before calling Supabase', async () => {
    const data = form()
    data.set('password', 'weak')
    data.set('passwordConfirmation', 'weak')

    const result = await visitorSignUpAction(
      { status: 'idle', message: '' },
      data,
    )
    expect(result.status).toBe('error')
    expect(signUp).not.toHaveBeenCalled()
  })

  it('requires sign-out before creating another account', async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: 'visitor-1' } },
      error: null,
    })

    const result = await visitorSignUpAction(
      { status: 'idle', message: '' },
      form(),
    )

    expect(result).toEqual({
      status: 'error',
      message: 'Sign out before creating another account.',
    })
    expect(signUp).not.toHaveBeenCalled()
  })

  it('stores optional full name and uploaded avatar in sign-up metadata', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/avatars/signup-1.png' },
    })
    vi.mocked(createPrivilegedClient).mockReturnValue({
      storage: { from: () => ({ upload, getPublicUrl }) },
    } as unknown as ReturnType<typeof createPrivilegedClient>)
    signUp.mockResolvedValue({ data: { session: null }, error: null })

    const data = form()
    data.set('fullName', '  Jane Doe  ')
    data.set(
      'avatar',
      new File([new Uint8Array([137, 80, 78, 71])], 'avatar.png', {
        type: 'image/png',
      }),
    )

    const result = await visitorSignUpAction(
      { status: 'idle', message: '' },
      data,
    )

    expect(result.status).toBe('success')
    expect(upload).toHaveBeenCalledTimes(1)
    expect(signUp).toHaveBeenCalledWith({
      email: 'visitor@example.com',
      password: 'Strong-password-2048',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?next=%2Fcontact',
        data: {
          full_name: 'Jane Doe',
          avatar_url: 'https://cdn.example.com/avatars/signup-1.png',
        },
      },
    })
  })
})
