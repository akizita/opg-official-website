import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { isAdminMfaRequired } from '@/lib/auth/config'
import { createClient } from '@/lib/supabase/server'

import { PasswordForm } from './password-form'

export const metadata: Metadata = {
  title: 'Create administrator password',
  robots: { index: false, follow: false },
}

export default async function SetPasswordPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) redirect('/admin/sign-in')

  const description = isAdminMfaRequired()
    ? 'Create the password for your invited OPG administrator account. You will set up an authenticator app next.'
    : 'Create the password for your OPG administrator account. Authenticator setup is temporarily skipped in development mode.'

  return (
    <AuthPanel
      description={description}
      eyebrow="Invitation accepted"
      title="Create your password"
    >
      <PasswordForm />
    </AuthPanel>
  )
}
