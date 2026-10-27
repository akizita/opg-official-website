'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'

import { visitorForgotPasswordAction } from './actions'

export function VisitorForgotPasswordForm() {
  const [state, action] = useActionState(
    visitorForgotPasswordAction,
    initialAuthFormState,
  )

  return (
    <form action={action} className="auth-form">
      <label className="field" htmlFor="reset-email">
        <span>Email address</span>
        <input
          autoComplete="email"
          id="reset-email"
          name="email"
          required
          type="email"
        />
      </label>
      {state.status !== 'idle' && (
        <p
          className={`form-message ${state.status === 'error' ? 'form-message--error' : ''}`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Sending link…">Send reset link</SubmitButton>
      <p className="auth-secondary-action">
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </form>
  )
}
