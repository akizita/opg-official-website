'use server'

import { redirect } from 'next/navigation'

import type { AuthFormState } from '@/lib/auth/form-state'
import { getSafePublicPath } from '@/lib/auth/redirect'
import { getSiteUrl } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export async function visitorSignInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawEmail = formData.get('email')
  const password = formData.get('password')
  const destination = getSafePublicPath(formData.get('next')?.toString())

  if (typeof rawEmail !== 'string' || typeof password !== 'string') {
    return { status: 'error', message: 'Enter your email and password.' }
  }

  const email = rawEmail.trim().toLowerCase()
  if (!email || !password) {
    return { status: 'error', message: 'Enter your email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { status: 'error', message: 'The email or password is incorrect.' }
  }

  redirect(destination)
}

export async function visitorGoogleSignInAction(formData: FormData) {
  const destination = getSafePublicPath(formData.get('next')?.toString())
  const callback = new URL('/auth/callback', getSiteUrl())
  callback.searchParams.set('next', destination)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callback.toString(),
      queryParams: { prompt: 'select_account' },
    },
  })

  if (error || !data?.url) {
    redirect('/sign-in?notice=oauth-error')
  }

  redirect(data.url)
}
