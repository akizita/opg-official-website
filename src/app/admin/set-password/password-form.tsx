'use client'

import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'
import { MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/auth/password'

import { setPasswordAction } from './actions'

export function PasswordForm() {
  const [state, action] = useActionState(
    setPasswordAction,
    initialAuthFormState,
  )

  return (
    <form action={action} className="auth-form">
      <label className="field" htmlFor="new-password">
        <span>New password</span>
        <input
          autoComplete="new-password"
          id="new-password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="field" htmlFor="confirm-password">
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          id="confirm-password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          name="passwordConfirmation"
          required
          type="password"
        />
      </label>
      <p className="field-hint">
        Use at least {MIN_ADMIN_PASSWORD_LENGTH} characters with uppercase and
        lowercase letters and a number. A password manager is recommended.
      </p>
      {state.status === 'error' ? (
        <p className="form-message form-message--error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Saving…">Save password</SubmitButton>
    </form>
  )
}
