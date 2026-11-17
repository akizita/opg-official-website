import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'

import {
  DESIGNATED_SUPER_ADMIN_EMAIL,
  isAdminMfaRequired,
} from '@/lib/auth/config'
import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'

import { SignInForm } from './sign-in-form'
import styles from './sign-in.module.css'

export const metadata: Metadata = {
  title: 'Administrator sign in | OutPro Global',
  robots: { index: false, follow: false },
}

const ADMIN_LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/logo-1789740351319.png'

type SignInPageProps = {
  searchParams: Promise<{ notice?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getAdminSession()

  if (session) redirect(getAdminAuthDestination(session))

  const { notice } = await searchParams
  const mfaRequired = isAdminMfaRequired()

  return (
    <div className={`admin-sign-in-page ${styles.page}`}>
      {/* Diffused Pure-CSS Mesh Gradient Background with Concentric Contours */}
      <div aria-hidden="true" className={styles.bg}>
        <div className={styles.glowLeft} />
        <div className={styles.glowRight} />
        <div className={styles.contoursLeft} />
        <div className={styles.contoursRight} />
      </div>

      {/* Centered Translucent Glassmorphic Form Card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <Image
              alt="Outsource Pro Global"
              className={styles.logo}
              height={64}
              priority
              src={ADMIN_LOGO_URL}
              width={64}
            />
          </div>

          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>
            Use your approved OPG administrator credentials to access the workspace.
          </p>
        </div>

        {notice === 'invalid-link' ? (
          <p className={styles.alert} role="alert">
            This link is invalid or has expired. Ask a Super Admin for a new
            invitation.
          </p>
        ) : null}
        {notice === 'signup-disabled' ? (
          <p className={styles.alert} role="alert">
            Signups are disabled in Supabase. Please ask a Super Admin to invite your
            account.
          </p>
        ) : null}
        {notice === 'oauth-failed' || notice === 'oauth-error' ? (
          <p className={styles.alert} role="alert">
            Google authentication could not be completed. Please ensure your
            account has access and try again.
          </p>
        ) : null}
        {notice === 'unauthorized' ? (
          <p className={styles.alert} role="alert">
            This Google account does not have active OPG administrator access.
          </p>
        ) : null}
        {notice === 'super-admin-provisioning' ? (
          <p className={styles.alert} role="alert">
            The OPG Google account was authenticated, but its Super Admin profile
            has not been provisioned in the database yet.
          </p>
        ) : null}

        <SignInForm defaultEmail={DESIGNATED_SUPER_ADMIN_EMAIL} />

        <p className={styles.note}>
          {mfaRequired
            ? 'Access is restricted to approved administrators and protected by an authenticator app.'
            : 'Development mode: authenticator verification is temporarily bypassed.'}
        </p>
      </div>
    </div>
  )
}
