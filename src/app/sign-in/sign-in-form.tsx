'use client'

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Key01Icon,
  LockKeyIcon,
  Login01Icon,
  Mail01Icon,
  ShieldCheckIcon,
  UserAdd01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import { visitorSignUpAction } from '@/app/sign-up/actions'
import { GoogleAuthForm } from '@/components/site/google-auth-form'
import { initialAuthFormState } from '@/lib/auth/form-state'
import { MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/auth/password'

import { visitorSignInAction } from './actions'
import styles from './sign-in.module.css'

interface VisitorSignInFormProps {
  destination?: string
  initialTab?: 'signin' | 'signup'
  next?: string
}

export function VisitorSignInForm({
  next = '/contact',
  destination,
  initialTab = 'signin',
}: VisitorSignInFormProps) {
  const targetPath = destination || next || '/contact'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab)

  // Sign In state
  const [signInState, signInAction, isSignInPending] = useActionState(
    visitorSignInAction,
    initialAuthFormState,
  )
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Sign Up state
  const [signUpState, signUpAction, isSignUpPending] = useActionState(
    visitorSignUpAction,
    initialAuthFormState,
  )
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleTabChange = (newTab: 'signin' | 'signup') => {
    setActiveTab(newTab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (newTab === 'signup') {
        url.searchParams.set('tab', 'signup')
      } else {
        url.searchParams.delete('tab')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div className={styles.authTabsRoot}>
      {/* Segmented Tab Switcher */}
      <div className={styles.tabContainer}>
        <div
          aria-label="Account access options"
          className={styles.tabList}
          role="tablist"
        >
          <button
            aria-controls="panel-signin"
            aria-selected={activeTab === 'signin'}
            className={`${styles.tabButton} ${activeTab === 'signin' ? styles.tabButtonActive : ''}`}
            id="tab-signin"
            onClick={() => handleTabChange('signin')}
            role="tab"
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              className={styles.tabButtonIcon}
              icon={Login01Icon}
              size={16}
            />
            <span>Sign In</span>
          </button>

          <button
            aria-controls="panel-signup"
            aria-selected={activeTab === 'signup'}
            className={`${styles.tabButton} ${activeTab === 'signup' ? styles.tabButtonActive : ''}`}
            id="tab-signup"
            onClick={() => handleTabChange('signup')}
            role="tab"
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              className={styles.tabButtonIcon}
              icon={UserAdd01Icon}
              size={16}
            />
            <span>Sign Up</span>
          </button>
        </div>
      </div>

      {/* Unified Google OAuth section */}
      <div className={styles.oauthSection}>
        <GoogleAuthForm next={targetPath} />
      </div>

      {/* Dynamic Divider */}
      <div className={styles.divider} role="separator">
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>
          {activeTab === 'signin'
            ? 'or continue with email'
            : 'or register with email'}
        </span>
        <span className={styles.dividerLine} />
      </div>

      {/* Equal-Height Tab Panels with Smooth Motion Morph/Fade Transitions */}
      <div className={styles.tabPanelsWrapper}>
        <AnimatePresence initial={false} mode="wait">
          {activeTab === 'signin' ? (
            <motion.div
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              aria-labelledby="tab-signin"
              className={styles.tabPanelMotion}
              exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
              id="panel-signin"
              initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
              key="signin-panel"
              role="tabpanel"
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <form action={signInAction} className={styles.form}>
                <input name="next" type="hidden" value={targetPath} />

                <div className={styles.fieldsStack}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="visitor-email">
                      Email address
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
                        placeholder="Enter your email address"
                        required
                        type="email"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor="visitor-password"
                    >
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
                          showSignInPassword
                            ? 'Hide password'
                            : 'Show password'
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
                    <label
                      className={styles.rememberMeLabel}
                      htmlFor="remember-me"
                    >
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

                <div className={styles.formBottomCluster}>
                  <button
                    className={styles.submitButton}
                    disabled={isSignInPending}
                    type="submit"
                  >
                    <span>
                      {isSignInPending
                        ? 'Signing in securely…'
                        : 'Sign in securely'}
                    </span>
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={ArrowRight01Icon}
                      size={18}
                    />
                  </button>

                  <div
                    aria-label="Security standards"
                    className={styles.cardSecurityRow}
                  >
                    <span className={styles.microBadge}>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className={styles.microBadgeIcon}
                        icon={ShieldCheckIcon}
                        size={14}
                      />
                      Secure Login
                    </span>
                    <span className={styles.microBadge}>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className={styles.microBadgeIcon}
                        icon={LockKeyIcon}
                        size={14}
                      />
                      SSL Protected
                    </span>
                    <span className={styles.microBadge}>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className={styles.microBadgeIcon}
                        icon={Key01Icon}
                        size={14}
                      />
                      256-bit Encryption
                    </span>
                  </div>

                  <div className={styles.cardFooterLinks}>
                    <p className={styles.signupPrompt}>
                      Don&apos;t have an account?{' '}
                      <button
                        className={styles.switchTabLink}
                        onClick={() => handleTabChange('signup')}
                        type="button"
                      >
                        Create an account
                      </button>
                    </p>
                    <p className={styles.cardTermsNotice}>
                      By signing in you agree to our{' '}
                      <Link href="/terms">Terms</Link> &amp;{' '}
                      <Link href="/privacy">Security Policy</Link>.
                    </p>
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              aria-labelledby="tab-signup"
              className={styles.tabPanelMotion}
              exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
              id="panel-signup"
              initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
              key="signup-panel"
              role="tabpanel"
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {signUpState.status === 'success' ? (
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
                  <button
                    className={styles.submitButton}
                    onClick={() => handleTabChange('signin')}
                    type="button"
                  >
                    <span>Proceed to Sign In</span>
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={ArrowRight01Icon}
                      size={18}
                    />
                  </button>
                </div>
              ) : (
                <form action={signUpAction} className={styles.form}>
                  <div className={styles.fieldsStack}>
                    <div className={styles.fieldGroup}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="signup-email"
                      >
                        Email address
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
                          placeholder="Enter your email address"
                          required
                          type="email"
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label
                        className={styles.fieldLabel}
                        htmlFor="signup-password"
                      >
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
                          placeholder="Create a strong password"
                          required
                          type={showSignUpPassword ? 'text' : 'password'}
                        />
                        <button
                          aria-label={
                            showSignUpPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                          className={styles.passwordToggleBtn}
                          onClick={() => setShowSignUpPassword((prev) => !prev)}
                          type="button"
                        >
                          <HugeiconsIcon
                            aria-hidden="true"
                            icon={
                              showSignUpPassword
                                ? ViewOffSlashIcon
                                : ViewIcon
                            }
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
                          placeholder="Confirm your password"
                          required
                          type={showConfirmPassword ? 'text' : 'password'}
                        />
                        <button
                          aria-label={
                            showConfirmPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                          className={styles.passwordToggleBtn}
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          type="button"
                        >
                          <HugeiconsIcon
                            aria-hidden="true"
                            icon={
                              showConfirmPassword
                                ? ViewOffSlashIcon
                                : ViewIcon
                            }
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
                        Use at least 12 characters with uppercase and lowercase
                        letters, a number, and a symbol.
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

                  <div className={styles.formBottomCluster}>
                    <button
                      className={styles.submitButton}
                      disabled={isSignUpPending}
                      type="submit"
                    >
                      <span>
                        {isSignUpPending
                          ? 'Creating account…'
                          : 'Create account'}
                      </span>
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={ArrowRight01Icon}
                        size={18}
                      />
                    </button>

                    <div
                      aria-label="Security standards"
                      className={styles.cardSecurityRow}
                    >
                      <span className={styles.microBadge}>
                        <HugeiconsIcon
                          aria-hidden="true"
                          className={styles.microBadgeIcon}
                          icon={ShieldCheckIcon}
                          size={14}
                        />
                        Instant Activation
                      </span>
                      <span className={styles.microBadge}>
                        <HugeiconsIcon
                          aria-hidden="true"
                          className={styles.microBadgeIcon}
                          icon={LockKeyIcon}
                          size={14}
                        />
                        SSL Protected
                      </span>
                      <span className={styles.microBadge}>
                        <HugeiconsIcon
                          aria-hidden="true"
                          className={styles.microBadgeIcon}
                          icon={Key01Icon}
                          size={14}
                        />
                        256-bit Encryption
                      </span>
                    </div>

                    <div className={styles.cardFooterLinks}>
                      <p className={styles.signupPrompt}>
                        Already have an account?{' '}
                        <button
                          className={styles.switchTabLink}
                          onClick={() => handleTabChange('signin')}
                          type="button"
                        >
                          Sign in
                        </button>
                      </p>
                      <p className={styles.cardTermsNotice}>
                        By registering you agree to our{' '}
                        <Link href="/terms">Terms</Link> &amp;{' '}
                        <Link href="/privacy">Security Policy</Link>.
                      </p>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
