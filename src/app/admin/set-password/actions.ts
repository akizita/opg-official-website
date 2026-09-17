'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'
import type { AuthFormState } from '@/lib/auth/form-state'
import { validateAdminPassword } from '@/lib/auth/password'
import { createClient } from '@/lib/supabase/server'

export async function setPasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const passwordValue = formData.get('password')
  const confirmationValue = formData.get('passwordConfirmation')

  if (
    typeof passwordValue !== 'string' ||
    typeof confirmationValue !== 'string'
  ) {
    return { status: 'error', message: 'Enter and confirm your password.' }
  }

  if (passwordValue !== confirmationValue) {
    return { status: 'error', message: 'The passwords do not match.' }
  }

  const passwordError = validateAdminPassword(passwordValue)

  if (passwordError) return { status: 'error', message: passwordError }

  const supabase = await createClient()
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: 'error',
      message: 'Your invitation session has expired. Request a new invitation.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password: passwordValue })

  if (error) {
    return {
      status: 'error',
      message: 'The password could not be saved. Please try again.',
    }
  }

  const session = await getAdminSession()

  if (!session) redirect('/admin/access-denied')

  revalidatePath('/admin', 'layout')
  redirect(getAdminAuthDestination(session))
}
