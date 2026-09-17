'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'
import type { AuthFormState } from '@/lib/auth/form-state'
import { createClient } from '@/lib/supabase/server'

export async function signInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailValue = formData.get('email')
  const passwordValue = formData.get('password')

  if (typeof emailValue !== 'string' || typeof passwordValue !== 'string') {
    return { status: 'error', message: 'Enter your email and password.' }
  }

  const email = emailValue.trim().toLowerCase()

  if (!email || !passwordValue) {
    return { status: 'error', message: 'Enter your email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordValue,
  })

  if (error) {
    return {
      status: 'error',
      message: 'The email or password is incorrect.',
    }
  }

  const session = await getAdminSession()

  if (!session) {
    await supabase.auth.signOut()
    return {
      status: 'error',
      message: 'This account does not have active OPG administrator access.',
    }
  }

  revalidatePath('/admin', 'layout')
  redirect(getAdminAuthDestination(session))
}
