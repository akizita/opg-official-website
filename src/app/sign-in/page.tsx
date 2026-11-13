import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { visitorSignOutAction } from '@/app/account/actions'
import { AuthHeroPanel } from '@/components/ui/auth-split-card'
import { getSafePublicPath } from '@/lib/auth/redirect'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { VisitorSignInForm } from './sign-in-form'
import styles from './sign-in.module.css'

export const metadata: Metadata = {
  title: 'Sign in | Outsource Pro Global',
  description:
    'Secure digital access to Outsource Pro Global talent operations and enterprise services.',
  robots: { index: false, follow: false },
}

export default async function VisitorSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string; tab?: string }>
}) {
  const { next, notice, tab } = await searchParams

  // If a legacy query requested sign up, redirect to the dedicated sign-up page
  if (tab === 'signup') {
    const dest = next
      ? `/sign-up?next=${encodeURIComponent(next)}`
      : '/sign-up'
    redirect(dest)
  }

  const destination = getSafePublicPath(next)
  const session = await getVisitorSession()

  return (
    <div className={styles.signInPage}>
      <main className={styles.container}>
        <div className={styles.splitCardWrapper}>
          <div className={styles.splitCard}>
            {/* Left Column: Inset Dark Hero Card with ASCII Globe & Official Logo */}
            <AuthHeroPanel
              badgeText="1,000+ Verified Global Talents"
              description="Outsource Pro Global connects world-class cross-border talent pods with leading organizations. Unified governance, verified compliance, and continuous scale."
              headline="Your global talent operations, always accessible"
            />

            {/* Right Column: Clean White Sign-In Surface */}
            <div className={styles.formColumn}>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Welcome Back</h1>
                <p className={styles.formSubtitle}>
                  Enter your enterprise credentials to access your portal.
                </p>
              </div>

              {session && (
                <div className={styles.sessionNotice} role="status">
                  <p>
                    You are signed in as <strong>{session.email}</strong>. You
                    can use another account below or sign out first.
                  </p>
                  <div className={styles.sessionActions}>
                    <Link href="/account">View account</Link>
                    <form action={visitorSignOutAction}>
                      <button type="submit">Sign out</button>
                    </form>
                  </div>
                </div>
              )}

              {notice === 'oauth-error' && (
                <div className={styles.errorAlert} role="alert">
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={AlertCircleIcon}
                    size={18}
                  />
                  <span>
                    Google sign-in could not be completed. Please try again.
                  </span>
                </div>
              )}

              {notice === 'invalid-link' && (
                <div className={styles.errorAlert} role="alert">
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={AlertCircleIcon}
                    size={18}
                  />
                  <span>
                    This sign-in link is invalid or has expired. Please try
                    again.
                  </span>
                </div>
              )}

              {/* Dedicated Sign-In Form */}
              <VisitorSignInForm destination={destination} />
            </div>
          </div>

          {/* Centered Copyright below card */}
          <div className={styles.pageCopyright}>
            <span>&copy; 2026 Outsource Pro Global. All rights reserved.</span>
          </div>
        </div>
      </main>
    </div>
  )
}
