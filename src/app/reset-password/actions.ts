'use server'

import { redirect } from 'next/navigation'

import type { AuthFormState } from '@/lib/auth/form-state'
import { validateAdminPassword } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/server'

export async function visitorResetPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formData.get('password')
  const confirmation = formData.get('passwordConfirmation')
  if (typeof password !== 'string' || typeof confirmation !== 'string') {
    return { status: 'error', message: 'Enter and confirm your new password.' }
  }
  if (password !== confirmation) {
    return { status: 'error', message: 'The passwords do not match.' }
  }
  const passwordError = validateAdminPassword(password)
  if (passwordError) return { status: 'error', message: passwordError }

  const supabase = await createClient()
  const { data, error: claimsError } = await supabase.auth.getClaims()
  if (claimsError || !data?.claims?.sub) {
    return {
      status: 'error',
      message: 'Your reset link has expired. Request a new one.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return {
      status: 'error',
      message: 'Unable to update your password. Please try again.',
    }
  }

  redirect('/contact')
}
