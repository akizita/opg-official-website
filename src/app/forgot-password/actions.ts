'use server'

import type { AuthFormState } from '@/lib/auth/form-state'
import { getSiteUrl } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export async function visitorForgotPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawEmail = formData.get('email')
  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return { status: 'error', message: 'Enter your email address.' }
  }

  const callback = new URL('/auth/callback', getSiteUrl())
  callback.searchParams.set('next', '/reset-password')
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    rawEmail.trim().toLowerCase(),
    { redirectTo: callback.toString() },
  )

  if (error) {
    return {
      status: 'error',
      message: 'Unable to send a reset link right now. Please try again later.',
    }
  }

  return {
    status: 'success',
    message:
      'If an account exists for that address, a password reset link is on its way.',
  }
}
