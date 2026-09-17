import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { requireAdminSession } from '@/lib/auth/admin-session'

import { EnrollMfaForm } from './enroll-mfa-form'

export const metadata: Metadata = {
  title: 'Set up administrator MFA',
}

export default async function EnrollMfaPage() {
  const session = await requireAdminSession()

  if (session.currentLevel === 'aal2') redirect('/admin')
  if (session.nextLevel === 'aal2') redirect('/admin/mfa/challenge')

  return (
    <AuthPanel
      description="Every administrator must verify sign-ins with a time-based code from an authenticator app."
      eyebrow="Security setup"
      title="Protect your account"
    >
      <EnrollMfaForm />
    </AuthPanel>
  )
}
