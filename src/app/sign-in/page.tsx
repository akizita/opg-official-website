import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { visitorSignOutAction } from '@/app/account/actions'
import { SignInAsciiBackground } from '@/components/ui/sign-in-world-map'
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
  const destination = getSafePublicPath(next)
  const initialTab = tab === 'signup' ? 'signup' : 'signin'
  const session = await getVisitorSession()

  return (
    <div className={styles.signInPage}>
      {/* Authentic Dotted ASCII Map Background - Stuck to Corners & Sides */}
      <SignInAsciiBackground />

      {/* Top Brand Logo - Always pinned at top-left corner */}
      <header className={styles.topStatusRow}>
        <Link
          aria-label="Return to Outsource Pro Global home"
          className={styles.brandLink}
          href="/"
        >
          <Image
            alt="Outsource Pro Global"
            className={styles.brandLogoImg}
            height={150}
            priority
            src="/images/opg-square-logo-1789740365405.png"
            width={150}
          />
        </Link>
      </header>

      {/* Centered Form Card Layout */}
      <main className={styles.container}>
        <div className={styles.loginCardWrapper}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardLogoWrap}>
                <Image
                  alt="Outsource Pro Global"
                  className={styles.cardLogoImg}
                  height={72}
                  priority
                  src="/images/opg-square-logo-1789740365405.png"
                  width={72}
                />
              </div>
              <h1 className={styles.cardTitle}>Outsource Pro Global</h1>
              <p className={styles.cardSubtitle}>
                Secure Digital Access · Management System
              </p>
            </div>

            {session && (
              <div className={styles.sessionNotice} role="status">
                <p>
                  You are signed in as <strong>{session.email}</strong>. You can
                  use another account below or sign out first.
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
                  This sign-in link is invalid or has expired. Please try again.
                </span>
              </div>
            )}

            <VisitorSignInForm
              destination={destination}
              initialTab={initialTab}
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
