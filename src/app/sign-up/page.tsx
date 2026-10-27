import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { GoogleAuthForm } from '@/components/site/google-auth-form'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { VisitorSignUpForm } from './sign-up-form'

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false, follow: false },
}

export default async function VisitorSignUpPage() {
  if (await getVisitorSession()) redirect('/contact')

  return (
    <AuthPanel
      description="Create an account to contact the OutPro Global team."
      eyebrow="Your OPG account"
      title="Get started"
    >
      <GoogleAuthForm />
      <div className="auth-divider" role="separator">
        <span>or sign up with email</span>
      </div>
      <VisitorSignUpForm />
    </AuthPanel>
  )
}
