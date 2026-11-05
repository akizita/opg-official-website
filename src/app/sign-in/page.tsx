import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircleIcon,
  Globe02Icon,
  Key01Icon,
  Shield01Icon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { visitorSignOutAction } from '@/app/account/actions'
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
      {/* Top Brand Logo - Always pinned at the top-left corner */}
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

      <div className={styles.container}>
        {/* 2-Column Split Layout */}
        <div className={styles.splitLayout}>
          {/* Left Column: Hero Copy & Security Cards (Aligned Left, removed on mobile) */}
          <div className={styles.leftColumn}>
            <div className={styles.eyebrowBadge}>
              <HugeiconsIcon
                aria-hidden="true"
                icon={Shield01Icon}
                size={16}
              />
              <span>Authorized Enterprise Access</span>
            </div>

            <h1 className={styles.heroHeadline}>
              A secure gateway to{' '}
              <span className={styles.highlightText}>
                global talent operations.
              </span>
            </h1>

            <p className={styles.heroSubtext}>
              Sign in to manage records, monitor recruitment operations, and
              access verified digital talent services through our unified
              enterprise portal.
            </p>

            {/* 3 Security / Trust Cards (See-through Glassmorphism) */}
            <div
              aria-label="Portal Security Architecture"
              className={styles.securityCardsGrid}
            >
              <div className={styles.securityCard}>
                <div className={styles.securityCardIconWrap}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={ShieldCheckIcon}
                    size={20}
                  />
                </div>
                <h2 className={styles.securityCardTitle}>Zero Trust</h2>
                <p className={styles.securityCardSub}>
                  Continuous identity verification
                </p>
              </div>

              <div className={styles.securityCard}>
                <div className={styles.securityCardIconWrap}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={Globe02Icon}
                    size={20}
                  />
                </div>
                <h2 className={styles.securityCardTitle}>SSO Ready</h2>
                <p className={styles.securityCardSub}>
                  Google &amp; SAML enterprise ready
                </p>
              </div>

              <div className={styles.securityCard}>
                <div className={styles.securityCardIconWrap}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={Key01Icon}
                    size={20}
                  />
                </div>
                <h2 className={styles.securityCardTitle}>256-bit TLS</h2>
                <p className={styles.securityCardSub}>
                  End-to-end encrypted protocol
                </p>
              </div>
            </div>

            <div className={styles.leftColumnFooter}>
              <span>&copy; 2026 Outsource Pro Global. All rights reserved.</span>
            </div>
          </div>

          {/* Right Column: Elevated Form Card (See-through Glassmorphism) */}
          <div className={styles.rightColumn}>
            {/* Elevated Primary Login Card */}
            <div className={styles.loginCard}>
              <div className={styles.cardHeader}>
                {/* Yellow Logo from the System: opg-square-logo-1789740365405.png */}
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
                <h2 className={styles.cardTitle}>Outsource Pro Global</h2>
                <p className={styles.cardSubtitle}>
                  Secure Digital Access · Management System
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

              <VisitorSignInForm
                destination={destination}
                initialTab={initialTab}
              />
            </div>

            {/* Out-of-card bottom footer */}
            <div className={styles.cardOuterFooter}>
              <p className={styles.termsNotice}>
                By signing in you agree to the Portal&apos;s{' '}
                <Link href="/terms">Terms</Link> &amp;{' '}
                <Link href="/privacy">Security Policy</Link>.
              </p>
              <span className={styles.mobileCopyright}>
                &copy; 2026 Outsource Pro Global. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
