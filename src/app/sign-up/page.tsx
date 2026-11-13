import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { visitorSignOutAction } from '@/app/account/actions'
import styles from '@/app/sign-in/sign-in.module.css'
import { AuthHeroPanel } from '@/components/ui/auth-split-card'
import { getSafePublicPath } from '@/lib/auth/redirect'
import { getVisitorSession } from '@/lib/auth/visitor-session'

import { VisitorSignUpForm } from './sign-up-form'

export const metadata: Metadata = {
  title: 'Create an account | Outsource Pro Global',
  description:
    'Create your Outsource Pro Global account to access dedicated global talent operations and enterprise services.',
  robots: { index: false, follow: false },
}

export default async function VisitorSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>
}) {
  const { next, notice } = await searchParams
  const destination = getSafePublicPath(next)
  const session = await getVisitorSession()

  return (
    <div className={styles.signInPage}>
      <main className={styles.container}>
        <div className={styles.splitCardWrapper}>
          <div className={`${styles.splitCard} ${styles.splitCardReverse}`}>
            {/* Left Column: Clean White Sign-Up Surface */}
            <div className={styles.formColumn}>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Create an account</h1>
                <p className={styles.formSubtitle}>
                  Start building your dedicated cross-border pod today.
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

              {/* Dedicated Sign-Up Form */}
              <VisitorSignUpForm destination={destination} />
            </div>

            {/* Right Column: Inset Yellow Hero Card with ASCII Globe & Official Logo */}
            <AuthHeroPanel
              badgeText="1,000+ Verified Global Talents"
              description="Deploy verified, cross-border talent pods tailored to your technical and operational objectives. Scale with enterprise confidence."
              headline="Build your dedicated team with OutPro Global"
              variant="yellow"
            />
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
