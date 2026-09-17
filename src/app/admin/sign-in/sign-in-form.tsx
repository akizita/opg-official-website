'use client'

import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'

import { signInAction } from './actions'

export function SignInForm() {
  const [state, action] = useActionState(signInAction, initialAuthFormState)

  return (
    <form action={action} className="auth-form">
      <label className="field" htmlFor="admin-email">
        <span>Email address</span>
        <input
          autoComplete="username"
          id="admin-email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="field" htmlFor="admin-password">
        <span>Password</span>
        <input
          autoComplete="current-password"
          id="admin-password"
          name="password"
          required
          type="password"
        />
      </label>
      {state.status === 'error' ? (
        <p className="form-message form-message--error" role="alert">
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Signing in…">Sign in securely</SubmitButton>
    </form>
  )
}
