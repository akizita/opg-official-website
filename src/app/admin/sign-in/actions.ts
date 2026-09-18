'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { headers } from 'next/headers'

import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'
import type { AuthFormState } from '@/lib/auth/form-state'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction(): Promise<void> {
  const headersList = await headers()
  const host = headersList.get('host')
  const proto =
    headersList.get('x-forwarded-proto') ??
    (host?.startsWith('localhost') ? 'http' : 'https')
  const origin = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/admin`,
      queryParams: {
        access_type: 'offline',
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
