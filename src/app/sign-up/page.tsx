import type { Metadata } from 'next'
import Link from 'next/link'

import { visitorSignOutAction } from '@/app/account/actions'
import { AuthPanel } from '@/components/admin/auth-panel'
import { GoogleAuthForm } from '@/components/site/google-auth-form'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { VisitorSignUpForm } from './sign-up-form'

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false, follow: false },
}

export default async function VisitorSignUpPage() {
  const session = await getVisitorSession()

  return (
    <AuthPanel
      description="Create an account to contact the OutPro Global team."
      eyebrow="Your OPG account"
      title="Get started"
    >
      {session && (
        <div className="auth-session-note" role="status">
          <p>
            You are signed in as <strong>{session.email}</strong>. Sign out
            before creating another account.
          </p>
          <div className="auth-session-note__actions">
            <Link href="/account">View account</Link>
            <form action={visitorSignOutAction}>
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>
      )}
      <GoogleAuthForm />
      <div className="auth-divider" role="separator">
        <span>or sign up with email</span>
      </div>
      <VisitorSignUpForm />
    </AuthPanel>
  )
}
