'use client'

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  LockKeyIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import { GoogleAuthForm } from '@/components/site/google-auth-form'
import { initialAuthFormState } from '@/lib/auth/form-state'

import { visitorSignInAction } from './actions'
import styles from './sign-in.module.css'

interface VisitorSignInFormProps {
  destination?: string
  next?: string
}

export function VisitorSignInForm({
  next = '/contact',
  destination,
}: VisitorSignInFormProps) {
  const targetPath = destination || next || '/contact'

  const [signInState, signInAction, isSignInPending] = useActionState(
    visitorSignInAction,
    initialAuthFormState,
  )
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const signUpHref =
    targetPath && targetPath !== '/contact'
      ? `/sign-up?next=${encodeURIComponent(targetPath)}`
      : '/sign-up'

  return (
    <div className={styles.formWrapper}>
      <form action={signInAction} className={styles.form}>
        <input name="next" type="hidden" value={targetPath} />

        <div className={styles.fieldsStack}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="visitor-email">
              Work email
            </label>
            <div className={styles.inputWrapper}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.inputIcon}
                icon={Mail01Icon}
                size={18}
              />
              <input
                autoComplete="username"
                className={styles.inputControl}
                id="visitor-email"
                name="email"
                placeholder="Enter your work email"
                required
                type="email"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="visitor-password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.inputIcon}
                icon={LockKeyIcon}
                size={18}
              />
              <input
                autoComplete="current-password"
                className={styles.inputControl}
                id="visitor-password"
                name="password"
                placeholder="Enter your password"
                required
                type={showSignInPassword ? 'text' : 'password'}
              />
              <button
                aria-label={
                  showSignInPassword ? 'Hide password' : 'Show password'
                }
                className={styles.passwordToggleBtn}
                onClick={() => setShowSignInPassword((prev) => !prev)}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={showSignInPassword ? ViewOffSlashIcon : ViewIcon}
                  size={18}
                />
              </button>
            </div>
          </div>

          <div className={styles.utilitiesRow}>
            <label className={styles.rememberMeLabel} htmlFor="remember-me">
              <input
                checked={rememberMe}
                className={styles.rememberMeCheckbox}
                id="remember-me"
                name="remember"
                onChange={(e) => setRememberMe(e.target.checked)}
                type="checkbox"
              />
              <span>Remember me</span>
            </label>

            <Link
              className={styles.forgotPasswordLink}
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          {signInState.status === 'error' && (
            <div className={styles.errorAlert} role="alert">
              <HugeiconsIcon
                aria-hidden="true"
                icon={AlertCircleIcon}
                size={18}
              />
              <span>{signInState.message}</span>
            </div>
          )}
        </div>

        <button
          className={styles.submitButton}
          disabled={isSignInPending}
          type="submit"
        >
          <span>
            {isSignInPending ? 'Signing in securely…' : 'Sign in securely'}
          </span>
          <HugeiconsIcon
            aria-hidden="true"
            icon={ArrowRight01Icon}
            size={18}
          />
        </button>

        <div className={styles.divider} role="separator">
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or continue with</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.oauthSection}>
          <GoogleAuthForm
            buttonClassName={styles.googleOauthButton}
            next={targetPath}
          />
        </div>

        <div className={styles.cardFooterLinks}>
          <p className={styles.signupPrompt}>
            Don&apos;t have an account?{' '}
            <Link className={styles.switchTabLink} href={signUpHref}>
              Create an account
            </Link>
          </p>
          <p className={styles.cardTermsNotice}>
            By signing in you agree to our{' '}
            <Link href="/terms">Terms</Link> &amp;{' '}
            <Link href="/privacy">Security Policy</Link>.
          </p>
        </div>
      </form>
    </div>
  )
}
