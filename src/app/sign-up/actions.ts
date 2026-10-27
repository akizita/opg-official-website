'use server'

import { redirect } from 'next/navigation'

import type { AuthFormState } from '@/lib/auth/form-state'
import { validateAdminPassword } from '@/lib/auth/password'
import { getSiteUrl } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export async function visitorSignUpAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawEmail = formData.get('email')
  const password = formData.get('password')
  const confirmation = formData.get('passwordConfirmation')

  if (
    typeof rawEmail !== 'string' ||
    typeof password !== 'string' ||
    typeof confirmation !== 'string'
  ) {
    return { status: 'error', message: 'Complete all account fields.' }
  }

  const email = rawEmail.trim().toLowerCase()
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' }
  }
  if (password !== confirmation) {
    return { status: 'error', message: 'The passwords do not match.' }
  }
  const passwordError = validateAdminPassword(password)
  if (passwordError) return { status: 'error', message: passwordError }

  const callback = new URL('/auth/callback', getSiteUrl())
  callback.searchParams.set('next', '/contact')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callback.toString() },
  })

  if (error) {
    return {
      status: 'error',
      message: 'The account could not be created. Please try again.',
    }
  }
  if (data.session) redirect('/contact')

  return {
    status: 'success',
    message: 'Check your email for a confirmation link, then sign in.',
  }
}
