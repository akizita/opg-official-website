'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'

import { visitorSignInAction } from './actions'

export function VisitorSignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(
    visitorSignInAction,
    initialAuthFormState,
  )

  return (
    <form action={action} className="auth-form">
      <input name="next" type="hidden" value={next} />
      <label className="field" htmlFor="visitor-email">
        <span>Email address</span>
        <input
          autoComplete="username"
          id="visitor-email"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="field" htmlFor="visitor-password">
        <span>Password</span>
        <input
          autoComplete="current-password"
          id="visitor-password"
          name="password"
          required
          type="password"
        />
      </label>
      {state.status === 'error' && (
        <p className="form-message form-message--error" role="alert">
          {state.message}
        </p>
      )}
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      <div className="public-auth-links">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/sign-up">Create an account</Link>
      </div>
    </form>
  )
}
