'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'
import { DESIGNATED_SUPER_ADMIN_EMAIL } from '@/lib/auth/config'
import type { AuthFormState } from '@/lib/auth/form-state'
import { getSiteUrl } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction(): Promise<void> {
  const callback = new URL('/auth/callback', getSiteUrl())
  callback.searchParams.set('next', '/admin')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callback.toString(),
      scopes: 'openid email profile',
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error || !data?.url) {
    redirect('/admin/sign-in?notice=oauth-failed')
  }

  redirect(data.url)
}

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

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordValue,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.message === 'Invalid login credentials'
            ? 'The email or password is incorrect.'
            : error.message || 'The email or password is incorrect.',
      }
    }

    const session = await getAdminSession()

    if (!session) {
      await supabase.auth.signOut()
      return {
        status: 'error',
        message:
          email === DESIGNATED_SUPER_ADMIN_EMAIL
            ? 'The OPG account was authenticated, but its Super Admin profile has not been provisioned in Supabase yet.'
            : 'This account does not have active OPG administrator access.',
      }
    }

    revalidatePath('/admin', 'layout')
    redirect(getAdminAuthDestination(session))
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message.startsWith('REDIRECT:') ||
        ('digest' in err &&
          typeof (err as { digest?: unknown }).digest === 'string' &&
          (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')))
    ) {
      throw err
    }
    return {
      status: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during sign in.',
    }
  }
}
