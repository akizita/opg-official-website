import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { signOutAction } from '@/app/admin/actions'
import { AuthPanel } from '@/components/admin/auth-panel'
import { requireAdminSession } from '@/lib/auth/admin-session'

import { MfaChallengeForm } from './mfa-challenge-form'

export const metadata: Metadata = {
  title: 'Verify administrator sign in',
}

export default async function MfaChallengePage() {
  const session = await requireAdminSession()

  if (session.currentLevel === 'aal2') redirect('/admin')
  if (session.nextLevel !== 'aal2') redirect('/admin/mfa/enroll')

  return (
    <AuthPanel
      description="Enter the current code from the authenticator app linked to your account."
      eyebrow="Two-step verification"
      title="Verify it’s you"
    >
      <MfaChallengeForm />
      <form action={signOutAction} className="auth-secondary-action">
        <button className="text-button" type="submit">
          Sign out and use another account
        </button>
      </form>
    </AuthPanel>
  )
}
