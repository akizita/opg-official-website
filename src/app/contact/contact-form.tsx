'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useRef, useState, useTransition } from 'react'

import { submitContactAction } from '@/app/contact/actions'
import type { InquiryIntent } from '@/lib/content/inquiries'

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: { sitekey: string; size: 'flexible' },
    ) => string
    remove: (widgetId: string) => void
  }
}

export function ContactForm({ copy }: { copy: Record<string, string> }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const [intent, setIntent] = useState<InquiryIntent>('client')
  const [turnstileReady, setTurnstileReady] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    success: boolean
    referenceId?: string
    errors?: Record<string, string>
  } | null>(null)

  const mountTimeRef = useRef<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    mountTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!siteKey || !turnstileReady || result?.success) return
    const container =
      formRef.current?.querySelector<HTMLElement>('#contact-turnstile')
    const turnstile = (window as TurnstileWindow).turnstile
    if (!container || !turnstile) return
    const widgetId = turnstile.render(container, {
      sitekey: siteKey,
      size: 'flexible',
    })
    return () => turnstile.remove(widgetId)
  }, [siteKey, turnstileReady, result?.success])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setResult(null)

    const form = event.currentTarget
    const formData = new FormData(form)

    const elapsedSeconds = mountTimeRef.current
      ? Math.round((Date.now() - mountTimeRef.current) / 1000)
      : 5
    formData.set('elapsedSeconds', String(elapsedSeconds))
    formData.set('intent', intent)

    startTransition(async () => {
      try {
        const res = await submitContactAction(formData)
        setResult(res)
        if (res.success && formRef.current) {
          formRef.current.reset()
        }
      } catch {
        setResult({
          success: false,
          errors: {
            form: 'A network error occurred while submitting your inquiry. Please try again.',
          },
        })
      } finally {
        submittingRef.current = false
      }
    })
  }

  return (
    <div className="contact-form-container">
      {/* Inquiry category selector */}
      <div
        aria-label="Inquiry Category"
        className="contact-intent-tabs"
        role="group"
      >
        <button
          aria-pressed={intent === 'client'}
          className={`contact-intent-tab ${intent === 'client' ? 'contact-intent-tab--active' : ''}`}
          onClick={() => setIntent('client')}
          type="button"
        >
          <span className="contact-intent-tab__title">
            {copy.clientTabTitle}
          </span>
          <span className="contact-intent-tab__desc">
            {copy.clientTabDescription}
          </span>
        </button>
        <button
          aria-pressed={intent === 'talent'}
          className={`contact-intent-tab ${intent === 'talent' ? 'contact-intent-tab--active' : ''}`}
          onClick={() => setIntent('talent')}
          type="button"
        >
          <span className="contact-intent-tab__title">
            {copy.talentTabTitle}
          </span>
          <span className="contact-intent-tab__desc">
            {copy.talentTabDescription}
          </span>
        </button>
      </div>

      {intent === 'talent' && (
        <aside
          aria-label="Talent Careers Notice"
          className="contact-talent-notice"
        >
          <p>
            {copy.talentNotice}{' '}
            <Link className="inline-link" href="/careers">
              {copy.careersLink}
            </Link>
          </p>
        </aside>
      )}

      {result?.success ? (
        <div aria-live="polite" className="contact-success-card" role="status">
          <div className="contact-success-badge">{copy.successBadge}</div>
          <h3>{copy.successTitle}</h3>
          <p>
            {copy.successBody}
            {result.referenceId && (
              <span className="contact-reference">
                {copy.referenceLabel} <strong>{result.referenceId}</strong>
              </span>
            )}
          </p>
          <p className="contact-sla-note">{copy.successSla}</p>
          <button
            className="button button--secondary"
            onClick={() => {
              setResult(null)
              mountTimeRef.current = Date.now()
            }}
            type="button"
          >
            {copy.againButton}
          </button>
        </div>
      ) : (
        <form
          aria-label="Contact Inquiry Form"
          className="contact-form"
          noValidate
          onSubmit={handleSubmit}
          ref={formRef}
        >
          {siteKey && (
            <Script
              onReady={() => setTurnstileReady(true)}
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
            />
          )}
          {result?.errors?.form && (
            <div
              aria-live="assertive"
              className="alert-banner alert-banner--error"
              role="alert"
            >
              <p>{result.errors.form}</p>
            </div>
          )}

          {/* Honeypot trap: hidden from human sight and assistive tech */}
          <div aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="contact-website-field">Leave this empty</label>
            <input
              autoComplete="off"
              id="contact-website-field"
              name="website"
              tabIndex={-1}
              type="text"
            />
          </div>

          <div className="form-field">
            <label htmlFor="fullName">
              {copy.nameLabel} <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={
                result?.errors?.fullName ? 'fullName-error' : undefined
              }
              aria-invalid={Boolean(result?.errors?.fullName)}
              autoComplete="name"
              disabled={isPending}
              id="fullName"
              maxLength={100}
              name="fullName"
              placeholder={copy.namePlaceholder}
              required
              type="text"
            />
            {result?.errors?.fullName && (
              <p className="field-error" id="fullName-error">
                {result.errors.fullName}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="email">
              {copy.emailLabel} <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={
                result?.errors?.email ? 'email-error' : undefined
              }
              aria-invalid={Boolean(result?.errors?.email)}
              autoComplete="email"
              disabled={isPending}
              id="email"
              maxLength={254}
              name="email"
              placeholder={copy.emailPlaceholder}
              required
              type="email"
            />
            {result?.errors?.email && (
              <p className="field-error" id="email-error">
                {result.errors.email}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="subject">
              {copy.subjectLabel} <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={
                result?.errors?.subject ? 'subject-error' : undefined
              }
              aria-invalid={Boolean(result?.errors?.subject)}
              disabled={isPending}
              id="subject"
              maxLength={120}
              name="subject"
              placeholder={
                intent === 'client'
                  ? copy.clientSubjectPlaceholder
                  : copy.talentSubjectPlaceholder
              }
              required
              type="text"
            />
            {result?.errors?.subject && (
              <p className="field-error" id="subject-error">
                {result.errors.subject}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="message">
              {copy.messageLabel} <span className="field-required">*</span>
            </label>
            <textarea
              aria-describedby={
                result?.errors?.message ? 'message-error' : 'message-hint'
              }
              aria-invalid={Boolean(result?.errors?.message)}
              disabled={isPending}
              id="message"
              maxLength={5000}
              name="message"
              placeholder={copy.messagePlaceholder}
              required
              rows={5}
            />
            <span className="field-hint" id="message-hint">
              {copy.messageHint}
            </span>
            {result?.errors?.message && (
              <p className="field-error" id="message-error">
                {result.errors.message}
              </p>
            )}
          </div>

          <div className="form-field form-field--checkbox">
            <label className="checkbox-label" htmlFor="privacyConsent">
              <input
                aria-describedby={
                  result?.errors?.privacyConsent ? 'privacy-error' : undefined
                }
                aria-invalid={Boolean(result?.errors?.privacyConsent)}
                disabled={isPending}
                id="privacyConsent"
                name="privacyConsent"
                required
                type="checkbox"
              />
              <span>
                {copy.privacyPrefix}{' '}
                <Link className="inline-link" href="/privacy" target="_blank">
                  {copy.privacyLink}
                </Link>
                . <span className="field-required">*</span>
              </span>
            </label>
            {result?.errors?.privacyConsent && (
              <p className="field-error" id="privacy-error">
                {result.errors.privacyConsent}
              </p>
            )}
          </div>

          {siteKey && <div id="contact-turnstile" />}

          <div className="contact-form__submit-row">
            <button
              className="button button--primary"
              disabled={isPending}
              type="submit"
            >
              {isPending ? copy.sendingButton : copy.submitButton}
            </button>
            <p className="field-hint contact-sla-badge">{copy.formSla}</p>
          </div>
        </form>
      )}
    </div>
  )
}
