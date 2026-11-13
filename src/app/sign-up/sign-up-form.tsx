'use client'

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  LockKeyIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import styles from '@/app/sign-in/sign-in.module.css'
import { GoogleAuthForm } from '@/components/site/google-auth-form'
import { initialAuthFormState } from '@/lib/auth/form-state'
import { MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/auth/password'

import { visitorSignUpAction } from './actions'

interface VisitorSignUpFormProps {
  destination?: string
  next?: string
}

export function VisitorSignUpForm({
  next = '/contact',
  destination,
}: VisitorSignUpFormProps) {
  const targetPath = destination || next || '/contact'

  const [signUpState, signUpAction, isSignUpPending] = useActionState(
    visitorSignUpAction,
    initialAuthFormState,
  )
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const signInHref =
    targetPath && targetPath !== '/contact'
      ? `/sign-in?next=${encodeURIComponent(targetPath)}`
      : '/sign-in'

  if (signUpState.status === 'success') {
    return (
      <div className={styles.successCard} role="status">
        <div className={styles.successIconWrap}>
          <HugeiconsIcon
            aria-hidden="true"
            icon={CheckmarkCircle02Icon}
            size={32}
          />
        </div>
        <h3 className={styles.successTitle}>Check your email</h3>
        <p className={styles.successMessage}>{signUpState.message}</p>
        <Link className={styles.submitButtonYellow} href={signInHref}>
          <span>Proceed to Sign In</span>
          <HugeiconsIcon
            aria-hidden="true"
            icon={ArrowRight01Icon}
            size={18}
          />
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.formWrapper}>
      <form action={signUpAction} className={styles.form}>
        <div className={styles.fieldsStack}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="signup-email">
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
                autoComplete="email"
                className={styles.inputControl}
                id="signup-email"
                name="email"
                placeholder="Enter your work email"
                required
                type="email"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="signup-password">
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
                autoComplete="new-password"
                className={styles.inputControl}
                id="signup-password"
                minLength={MIN_ADMIN_PASSWORD_LENGTH}
                name="password"
                placeholder="Create password"
                required
                type={showSignUpPassword ? 'text' : 'password'}
              />
              <button
                aria-label={
                  showSignUpPassword ? 'Hide password' : 'Show password'
                }
                className={styles.passwordToggleBtn}
                onClick={() => setShowSignUpPassword((prev) => !prev)}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={showSignUpPassword ? ViewOffSlashIcon : ViewIcon}
                  size={18}
                />
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label
              className={styles.fieldLabel}
              htmlFor="signup-confirm-password"
            >
              Confirm password
            </label>
            <div className={styles.inputWrapper}>
              <HugeiconsIcon
                aria-hidden="true"
                className={styles.inputIcon}
                icon={LockKeyIcon}
                size={18}
              />
              <input
                autoComplete="new-password"
                className={styles.inputControl}
                id="signup-confirm-password"
                minLength={MIN_ADMIN_PASSWORD_LENGTH}
                name="passwordConfirmation"
                placeholder="Confirm password"
                required
                type={showConfirmPassword ? 'text' : 'password'}
              />
              <button
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                className={styles.passwordToggleBtn}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={showConfirmPassword ? ViewOffSlashIcon : ViewIcon}
                  size={18}
                />
              </button>
            </div>
          </div>

          <div className={styles.fieldHint}>
            <HugeiconsIcon
              aria-hidden="true"
              className={styles.fieldHintIcon}
              icon={InformationCircleIcon}
              size={15}
            />
            <span>
              Use at least {MIN_ADMIN_PASSWORD_LENGTH} characters with uppercase
              and lowercase letters, a number, and a symbol.
            </span>
          </div>

          {signUpState.status === 'error' && (
            <div className={styles.errorAlert} role="alert">
              <HugeiconsIcon
                aria-hidden="true"
                icon={AlertCircleIcon}
                size={18}
              />
              <span>{signUpState.message}</span>
            </div>
          )}
        </div>

        <button
          className={styles.submitButtonYellow}
          disabled={isSignUpPending}
          type="submit"
        >
          <span>
            {isSignUpPending ? 'Creating account…' : 'Create account'}
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
            Already have an account?{' '}
            <Link className={styles.switchTabLink} href={signInHref}>
              Sign in
            </Link>
          </p>
          <p className={styles.cardTermsNotice}>
            By registering you agree to our{' '}
            <Link href="/terms">Terms</Link> &amp;{' '}
            <Link href="/privacy">Security Policy</Link>.
          </p>
        </div>
      </form>
    </div>
  )
}
