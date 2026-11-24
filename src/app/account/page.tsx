import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthPanel } from '@/components/admin/auth-panel'
import { AccountAvatar } from '@/components/ui/account-avatar'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { AccountProfileForm } from './account-profile-form'
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        <span
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#2b2720',
            color: '#fff7e4',
            fontWeight: 800,
            fontSize: '0.95rem',
            flexShrink: 0,
          }}
        >
          <AccountAvatar
            avatarUrl={session.avatarUrl}
            displayName={session.displayName ?? session.email}
            email={session.email}
            size={48}
          />
        </span>
        <div>
          {session.displayName && (
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
              {session.displayName}
            </p>
          )}
          <p style={{ margin: 0 }}>
            Signed in as <strong>{session.email}</strong>
          </p>
        </div>
      </div>
      <AccountProfileForm
        avatarUrl={session.avatarUrl}
        displayName={session.displayName}
        email={session.email}
      />
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
