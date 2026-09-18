'use client'

import { useRef, useState, useTransition } from 'react'

import { subscribeNewsletterAction } from '@/app/newsletter/actions'

export function NewsletterForm() {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<{
    submitted: boolean
    success: boolean
    message: string
    error?: string
  } | null>(null)

  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const res = await subscribeNewsletterAction(formData)
        setState({
          submitted: true,
          success: res.success,
          message: res.message,
          error: res.error,
        })
        if (res.success && formRef.current) {
          formRef.current.reset()
        }
      } catch {
        setState({
          submitted: true,
          success: false,
          message: '',
          error:
            'Unable to process subscription right now. Please try again later.',
        })
      }
    })
  }

  return (
    <div className="newsletter-box">
      <div className="newsletter-box__content">
        <h3 className="newsletter-box__title">OPG Insights</h3>
        <p className="newsletter-box__desc">
          Subscribe for quarterly analysis on global workforce dynamics,
          cross-border engineering pods, and talent retention strategies.
        </p>
      </div>

      {state?.submitted && state.success ? (
        <div
          aria-live="polite"
          className="newsletter-box__success"
          role="status"
        >
          <span className="newsletter-box__icon">✓</span>
          <p>{state.message}</p>
        </div>
      ) : (
        <form
          aria-label="Newsletter Subscription Form"
          className="newsletter-box__form"
          noValidate
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <div className="newsletter-box__input-group">
            <label className="sr-only" htmlFor="newsletter-email">
              Work Email Address
            </label>
            <input
              aria-describedby={state?.error ? 'newsletter-error' : undefined}
              aria-invalid={Boolean(state?.error)}
              aria-label="Work email address"
              autoComplete="email"
              disabled={isPending}
              id="newsletter-email"
              name="email"
              placeholder="Enter your work email"
              required
              type="email"
            />
            <input name="source" type="hidden" value="footer_form" />
            <button
              className="button button--primary newsletter-box__button"
              disabled={isPending}
              type="submit"
            >
              {isPending ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>

          {state?.error && (
            <p
              aria-live="assertive"
              className="field-error newsletter-box__error"
              id="newsletter-error"
              role="alert"
            >
              {state.error}
            </p>
          )}

          <p className="newsletter-box__privacy-note">
            Double opt-in verification. Unsubscribe at any time with one click.
          </p>
        </form>
      )}
    </div>
  )
}
