'use client'

import { useActionState } from 'react'

import { SubmitButton } from '@/components/ui/submit-button'
import { initialAuthFormState } from '@/lib/auth/form-state'

import { signInAction, signInWithGoogleAction } from './actions'

export function SignInForm() {
  const [state, action] = useActionState(signInAction, initialAuthFormState)

  return (
    <div className="auth-signin-container">
      <form action={signInWithGoogleAction} className="auth-oauth-form">
        <button className="button button--oauth" type="submit">
          <svg
            aria-hidden="true"
            className="button__icon"
            height="20"
            viewBox="0 0 24 24"
            width="20"
          >
            <path
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              fill="#4285F4"
            />
            <path
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              fill="#34A853"
            />
            <path
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>

      <div className="auth-divider" role="separator">
        <span>or continue with email</span>
      </div>

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
    </div>
  )
}
