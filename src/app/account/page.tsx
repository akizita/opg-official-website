import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { visitorSignOutAction } from './actions'

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
}

export default async function VisitorAccountPage() {
  const session = await getVisitorSession()
  if (!session) redirect('/sign-in?next=/account')

  return (
    <AuthPanel
      description="Your account is ready to use on the OutPro Global website."
      eyebrow="Your OPG account"
      title="Account"
    >
      <p>
        Signed in as <strong>{session.email}</strong>
      </p>
      <div className="public-account-actions">
        <Link className="button-link button-link--primary" href="/contact">
          Contact us
        </Link>
        <form action={visitorSignOutAction}>
          <button className="button button--secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </AuthPanel>
  )
}
