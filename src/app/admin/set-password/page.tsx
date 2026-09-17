import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
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

  return (
    <AuthPanel
      description="Create the password for your invited OPG administrator account. You will set up an authenticator app next."
      eyebrow="Invitation accepted"
      title="Create your password"
    >
      <PasswordForm />
    </AuthPanel>
  )
}
