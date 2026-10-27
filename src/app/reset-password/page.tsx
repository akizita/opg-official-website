import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { VisitorResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

export default async function VisitorResetPasswordPage() {
  if (!(await getVisitorSession())) redirect('/sign-in')

  return (
    <AuthPanel
      description="Choose a new password for your OPG account."
      eyebrow="Your OPG account"
      title="Set new password"
    >
      <VisitorResetPasswordForm />
    </AuthPanel>
  )
}
