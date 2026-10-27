import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { GoogleAuthForm } from '@/components/site/google-auth-form'
import { getSafePublicPath } from '@/lib/auth/redirect'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { VisitorSignInForm } from './sign-in-form'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default async function VisitorSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>
}) {
  const { next, notice } = await searchParams
  const destination = getSafePublicPath(next)
  if (await getVisitorSession()) redirect(destination)

  return (
    <AuthPanel
      description="Sign in to send an inquiry to the OutPro Global team."
      eyebrow="Your OPG account"
      title="Welcome back"
    >
      {notice === 'oauth-error' && (
        <p className="form-message form-message--error" role="alert">
          Google sign-in could not be completed. Please try again.
        </p>
      )}
      {notice === 'invalid-link' && (
        <p className="form-message form-message--error" role="alert">
          This sign-in link is invalid or has expired. Please try again.
        </p>
      )}
      <GoogleAuthForm next={destination} />
      <div className="auth-divider" role="separator">
        <span>or continue with email</span>
      </div>
      <VisitorSignInForm next={destination} />
    </AuthPanel>
  )
}
