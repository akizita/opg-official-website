'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'
import { MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/auth/password'

import { visitorSignUpAction } from './actions'

export function VisitorSignUpForm() {
  const [state, action] = useActionState(
    visitorSignUpAction,
    initialAuthFormState,
  )

  if (state.status === 'success') {
    return (
      <p className="form-message" role="status">
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className="auth-form">
      <label className="field" htmlFor="signup-email">
        <span>Email address</span>
        <input
          autoComplete="email"
          id="signup-email"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="field" htmlFor="signup-password">
        <span>Password</span>
        <input
          autoComplete="new-password"
          id="signup-password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="field" htmlFor="signup-confirmation">
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          id="signup-confirmation"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          name="passwordConfirmation"
          required
          type="password"
        />
      </label>
      <p className="field-hint">
        Use at least 12 characters with uppercase and lowercase letters, a
        number, and a symbol.
      </p>
      {state.status === 'error' && (
        <p className="form-message form-message--error" role="alert">
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Creating account…">
        Create account
      </SubmitButton>
      <p className="auth-secondary-action">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  )
}
