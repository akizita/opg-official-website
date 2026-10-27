'use client'

import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'
import { MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/auth/password'

import { visitorResetPasswordAction } from './actions'

export function VisitorResetPasswordForm() {
  const [state, action] = useActionState(
    visitorResetPasswordAction,
    initialAuthFormState,
  )

  return (
    <form action={action} className="auth-form">
      <label className="field" htmlFor="visitor-new-password">
        <span>New password</span>
        <input
          autoComplete="new-password"
          id="visitor-new-password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="field" htmlFor="visitor-confirm-password">
        <span>Confirm password</span>
        <input
          autoComplete="new-password"
          id="visitor-confirm-password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          name="passwordConfirmation"
          required
          type="password"
        />
      </label>
      {state.status === 'error' && (
        <p className="form-message form-message--error" role="alert">
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Saving password…">Save password</SubmitButton>
    </form>
  )
}
