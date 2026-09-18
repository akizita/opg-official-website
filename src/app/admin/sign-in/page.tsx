import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'

import { SignInForm } from './sign-in-form'

export const metadata: Metadata = {
  title: 'Administrator sign in',
  robots: { index: false, follow: false },
}

type SignInPageProps = {
  searchParams: Promise<{ notice?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getAdminSession()

  if (session) redirect(getAdminAuthDestination(session))

  const { notice } = await searchParams

  return (
    <AuthPanel
      description="Use the account issued by an OPG Super Admin. Public registration is disabled."
      eyebrow="OPG administration"
      title="Sign in"
    >
      {notice === 'invalid-link' ? (
        <p className="form-message form-message--error" role="alert">
          This link is invalid or has expired. Ask a Super Admin for a new
          invitation.
        </p>
      ) : null}
      {notice === 'signup-disabled' ? (
        <p className="form-message form-message--error" role="alert">
          Signups are disabled in Supabase. In Supabase Dashboard, go to
          Authentication &rarr; Sign In / Up and enable &ldquo;Allow new users
          to sign up&rdquo;.
        </p>
      ) : null}
      {notice === 'oauth-failed' || notice === 'oauth-error' ? (
        <p className="form-message form-message--error" role="alert">
          Google authentication could not be completed. Please ensure your
          account has access and try again.
        </p>
      ) : null}
      {notice === 'unauthorized' ? (
        <p className="form-message form-message--error" role="alert">
          This Google account does not have active OPG administrator access.
        </p>
      ) : null}
      <SignInForm />
      <p className="auth-panel__note">
        Access is restricted to invited OPG administrators and protected by an
        authenticator app.
      </p>
    </AuthPanel>
  )
}
