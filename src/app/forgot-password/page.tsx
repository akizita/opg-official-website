import type { Metadata } from 'next'

import { AuthPanel } from '@/components/admin/auth-panel'

import { VisitorForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
}

export default function VisitorForgotPasswordPage() {
  return (
    <AuthPanel
      description="Enter your account email and we will send you a reset link."
      eyebrow="Your OPG account"
      title="Forgot password?"
    >
      <VisitorForgotPasswordForm />
    </AuthPanel>
  )
}
