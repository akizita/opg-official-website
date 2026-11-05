'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  ArrowRight01Icon,
  Cancel01Icon,
  FlashIcon,
  InformationCircleIcon,
  Layers01Icon,
  LockKeyIcon,
  Login01Icon,
  Mail01Icon,
  Tag01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { submitContactAction } from '@/app/contact/actions'
import type { InquiryIntent } from '@/lib/content/inquiries'
import { createClient } from '@/lib/supabase/client'

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: { sitekey: string; size: 'flexible' },
    ) => string
    remove: (widgetId: string) => void
  }
}

const DRAFT_KEY = 'opg_contact_draft_v1'

export function ContactForm({
  copy,
  signedInEmail = '',
}: {
  copy: Record<string, string>
  signedInEmail?: string
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()

  const [draft] = useState<{
    fullName?: string
    intent?: InquiryIntent
    subject?: string
    message?: string
  } | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [intent, setIntent] = useState<InquiryIntent>(() =>
    draft?.intent === 'talent' ? 'talent' : 'client',
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [turnstileReady, setTurnstileReady] = useState(false)
  const [messageLength, setMessageLength] = useState(
    () => draft?.message?.length || 0,
  )
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(
    () => signedInEmail?.trim().toLowerCase() || '',
  )
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    success: boolean
    referenceId?: string
    errors?: Record<string, string>
  } | null>(null)

  const mountTimeRef = useRef<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const submittingRef = useRef(false)

  const saveDraftToStorage = useCallback(() => {
    if (typeof window === 'undefined' || !formRef.current) return
    try {
      const data = {
        fullName:
          (formRef.current.querySelector('#fullName') as HTMLInputElement)
            ?.value || '',
        intent,
        subject:
          (formRef.current.querySelector('#subject') as HTMLInputElement)
            ?.value || '',
        message:
          (formRef.current.querySelector('#message') as HTMLTextAreaElement)
            ?.value || '',
      }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }, [intent])

  useEffect(() => {
    mountTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    let active = true
    const supabase = createClient()

    void supabase.auth
      .getClaims()
      .then(({ data, error }) => {
        if (!active) return
        const email = data?.claims?.email
        if (!error && typeof email === 'string' && email.trim()) {
          setCurrentUserEmail(email.trim().toLowerCase())
        } else {
          setCurrentUserEmail('')
        }
      })
      .catch(() => {
        if (active) setCurrentUserEmail('')
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      const email = session?.user?.email
      if (email && email.trim()) {
        setCurrentUserEmail(email.trim().toLowerCase())
      } else {
        setCurrentUserEmail('')
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [signedInEmail])

  // Modal keyboard handling and scroll lock
  useEffect(() => {
    if (!showSignInModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSignInModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [showSignInModal])

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [dropdownOpen])

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

    // If not signed in, show alert modal encouraging sign-in
    if (!currentUserEmail || !currentUserEmail.trim()) {
      saveDraftToStorage()
      setShowSignInModal(true)
      return
    }

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
    formData.set('email', currentUserEmail)

    startTransition(async () => {
      try {
        const res = await submitContactAction(formData)
        setResult(res)
        if (res.success && formRef.current) {
          formRef.current.reset()
          setIntent('client')
          setMessageLength(0)
          try {
            sessionStorage.removeItem(DRAFT_KEY)
          } catch {
            // ignore
          }
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
              setMessageLength(0)
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

          {/* Header inside the Card: Eyebrow + Subtitle */}
          <div className="contact-form__header">
            <span className="contact-form__eyebrow">Get in touch</span>
            <p className="contact-form__subtitle">
              Tell us what you need and we will route your inquiry to the right
              team.
            </p>
          </div>

          {/* Row 1: Full Name & Work Email Address */}
          <div className="contact-form__row contact-form__row--2col">
            <div className="form-field">
              <label htmlFor="fullName">
                {copy.nameLabel} <span className="field-required">*</span>
              </label>
              <div className="contact-input-wrapper">
                <span aria-hidden="true" className="contact-input-icon">
                  <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.8} />
                </span>
                <input
                  aria-describedby={
                    result?.errors?.fullName ? 'fullName-error' : undefined
                  }
                  aria-invalid={Boolean(result?.errors?.fullName)}
                  autoComplete="name"
                  defaultValue={draft?.fullName}
                  disabled={isPending}
                  id="fullName"
                  maxLength={100}
                  name="fullName"
                  placeholder={copy.namePlaceholder}
                  required
                  type="text"
                />
              </div>
              {result?.errors?.fullName && (
                <p className="field-error" id="fullName-error">
                  <span aria-hidden="true" className="field-error__icon">!</span>
                  {result.errors.fullName}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor={currentUserEmail ? 'email' : undefined}>
                {copy.emailLabel} <span className="field-required">*</span>
              </label>
              {currentUserEmail ? (
                <div className="contact-input-wrapper contact-input-wrapper--readonly">
                  <span aria-hidden="true" className="contact-input-icon">
                    <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.8} />
                  </span>
                  <input
                    aria-describedby={
                      result?.errors?.email ? 'email-error' : undefined
                    }
                    aria-invalid={Boolean(result?.errors?.email)}
                    autoComplete="email"
                    defaultValue={currentUserEmail}
                    disabled={isPending}
                    id="email"
                    maxLength={254}
                    name="email"
                    readOnly
                    required
                    title={`Signed in as ${currentUserEmail}`}
                    type="email"
                  />
                  <span className="contact-verified-badge" title="Verified OPG Account">
                    <HugeiconsIcon icon={LockKeyIcon} size={13} strokeWidth={2.2} />
                    <span>Verified</span>
                  </span>
                </div>
              ) : (
                <div className="contact-input-wrapper contact-input-wrapper--signin-trigger">
                  <Link
                    aria-label="Sign in to link your work email address"
                    className="contact-signin-field-btn"
                    href="/sign-in?next=/contact"
                    onClick={saveDraftToStorage}
                  >
                    <span className="contact-signin-field-left">
                      <span
                        aria-hidden="true"
                        className="contact-signin-field-icon"
                      >
                        <HugeiconsIcon icon={Login01Icon} size={18} strokeWidth={2} />
                      </span>
                      <span className="contact-signin-field-text">
                        Sign-in
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="contact-signin-field-arrow"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.2} />
                    </span>
                  </Link>
                </div>
              )}
              {result?.errors?.email && (
                <p className="field-error" id="email-error">
                  <span aria-hidden="true" className="field-error__icon">!</span>
                  {result.errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Inquiry Type & Subject */}
          <div className="contact-form__row contact-form__row--2col">
            <div className="form-field" ref={dropdownRef}>
              <label id="intent-label" htmlFor="intent-trigger">
                Inquiry type <span className="field-required">*</span>
              </label>
              <input name="intent" type="hidden" value={intent} />
              <div className="contact-input-wrapper contact-custom-select-wrapper">
                <span aria-hidden="true" className="contact-input-icon">
                  <HugeiconsIcon icon={Layers01Icon} size={18} strokeWidth={1.8} />
                </span>
                <button
                  aria-describedby={
                    result?.errors?.intent ? 'intent-error' : undefined
                  }
                  aria-expanded={dropdownOpen}
                  aria-haspopup="listbox"
                  aria-labelledby="intent-label intent-trigger"
                  className={`contact-custom-select-trigger ${
                    dropdownOpen ? 'contact-custom-select-trigger--open' : ''
                  }`}
                  disabled={isPending}
                  id="intent-trigger"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'ArrowDown' ||
                      e.key === ' ' ||
                      e.key === 'Enter'
                    ) {
                      e.preventDefault()
                      setDropdownOpen(true)
                    }
                    if (e.key === 'Escape') {
                      setDropdownOpen(false)
                    }
                  }}
                  type="button"
                >
                  <span className="contact-custom-select-value">
                    {intent === 'client'
                      ? copy.clientTabTitle || 'Client Inquiry'
                      : copy.talentTabTitle || 'Talent Inquiry'}
                  </span>
                  <span
                    aria-hidden="true"
                    className="contact-custom-select-chevron"
                  >
                    <svg
                      fill="none"
                      height="16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {dropdownOpen && (
                  <div
                    aria-labelledby="intent-label"
                    className="contact-custom-select-menu"
                    role="listbox"
                  >
                    <button
                      aria-selected={intent === 'client'}
                      className={`contact-custom-select-option ${
                        intent === 'client'
                          ? 'contact-custom-select-option--selected'
                          : ''
                      }`}
                      onClick={() => {
                        setIntent('client')
                        setDropdownOpen(false)
                      }}
                      role="option"
                      type="button"
                    >
                      <div className="contact-custom-select-option__text">
                        <span className="contact-custom-select-option__title">
                          {copy.clientTabTitle || 'Client Inquiry'}
                        </span>
                        {copy.clientTabDescription && (
                          <span className="contact-custom-select-option__desc">
                            {copy.clientTabDescription}
                          </span>
                        )}
                      </div>
                      {intent === 'client' && (
                        <span
                          aria-hidden="true"
                          className="contact-custom-select-check"
                        >
                          ✓
                        </span>
                      )}
                    </button>

                    <button
                      aria-selected={intent === 'talent'}
                      className={`contact-custom-select-option ${
                        intent === 'talent'
                          ? 'contact-custom-select-option--selected'
                          : ''
                      }`}
                      onClick={() => {
                        setIntent('talent')
                        setDropdownOpen(false)
                      }}
                      role="option"
                      type="button"
                    >
                      <div className="contact-custom-select-option__text">
                        <span className="contact-custom-select-option__title">
                          {copy.talentTabTitle || 'Talent Inquiry'}
                        </span>
                        {copy.talentTabDescription && (
                          <span className="contact-custom-select-option__desc">
                            {copy.talentTabDescription}
                          </span>
                        )}
                      </div>
                      {intent === 'talent' && (
                        <span
                          aria-hidden="true"
                          className="contact-custom-select-check"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {result?.errors?.intent && (
                <p className="field-error" id="intent-error">
                  <span aria-hidden="true" className="field-error__icon">!</span>
                  {result.errors.intent}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="subject">
                {copy.subjectLabel} <span className="field-required">*</span>
              </label>
              <div className="contact-input-wrapper">
                <span aria-hidden="true" className="contact-input-icon">
                  <HugeiconsIcon icon={Tag01Icon} size={18} strokeWidth={1.8} />
                </span>
                <input
                  aria-describedby={
                    result?.errors?.subject ? 'subject-error' : undefined
                  }
                  aria-invalid={Boolean(result?.errors?.subject)}
                  defaultValue={draft?.subject}
                  disabled={isPending}
                  id="subject"
                  maxLength={111}
                  name="subject"
                  placeholder={
                    intent === 'client'
                      ? copy.clientSubjectPlaceholder
                      : copy.talentSubjectPlaceholder
                  }
                  required
                  type="text"
                />
              </div>
              {result?.errors?.subject && (
                <p className="field-error" id="subject-error">
                  <span aria-hidden="true" className="field-error__icon">!</span>
                  {result.errors.subject}
                </p>
              )}
            </div>
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

          {/* Row 3: Message Textarea */}
          <div className="form-field">
            <label htmlFor="message">
              {copy.messageLabel} <span className="field-required">*</span>
            </label>
            <textarea
              aria-describedby={
                result?.errors?.message ? 'message-error' : 'message-hint'
              }
              aria-invalid={Boolean(result?.errors?.message)}
              defaultValue={draft?.message}
              disabled={isPending}
              id="message"
              maxLength={5000}
              name="message"
              onChange={(e) => setMessageLength(e.target.value.length)}
              placeholder={copy.messagePlaceholder}
              required
              rows={4}
            />
            <div className="contact-field-footer">
              <span className="field-hint" id="message-hint">
                {copy.messageHint}
              </span>
              <span
                aria-live="polite"
                className={`contact-char-counter ${
                  messageLength >= 20 ? 'contact-char-counter--valid' : ''
                }`}
              >
                {messageLength} / 20 min
              </span>
            </div>
            {result?.errors?.message && (
              <p className="field-error" id="message-error">
                <span aria-hidden="true" className="field-error__icon">!</span>
                {result.errors.message}
              </p>
            )}
          </div>

          {/* Row 4: Privacy Consent Custom Checkbox */}
          <div className="form-field form-field--checkbox">
            <label className="checkbox-label" htmlFor="privacyConsent">
              <span className="custom-checkbox-wrapper">
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
                <span aria-hidden="true" className="custom-checkbox-box">
                  <svg
                    aria-hidden="true"
                    className="custom-checkbox-check"
                    fill="none"
                    height="12"
                    viewBox="0 0 14 14"
                    width="12"
                  >
                    <path
                      d="m3 7 3 3 5-6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                    />
                  </svg>
                </span>
              </span>
              <span className="checkbox-label__text">
                {copy.privacyPrefix}{' '}
                <Link className="inline-link" href="/privacy" target="_blank">
                  {copy.privacyLink}
                </Link>
                . <span className="field-required">*</span>
              </span>
            </label>
            {result?.errors?.privacyConsent && (
              <p className="field-error" id="privacy-error">
                <span aria-hidden="true" className="field-error__icon">!</span>
                {result.errors.privacyConsent}
              </p>
            )}
          </div>

          {siteKey && <div id="contact-turnstile" />}

          {/* Row 5: Submit Button Row & SLA Note (Right-aligned Submit Button) */}
          <div className="contact-form__submit-row">
            <div className="contact-sla-badge">
              <span aria-hidden="true" className="contact-sla-icon">
                <HugeiconsIcon icon={FlashIcon} size={15} strokeWidth={2} />
              </span>
              <span>{copy.formSla}</span>
            </div>
            <button
              className="contact-submit-btn"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <span aria-hidden="true" className="contact-submit-spinner" />
                  <span>{copy.sendingButton}</span>
                </>
              ) : (
                <>
                  <span>{copy.submitButton}</span>
                  <span aria-hidden="true" className="contact-submit-arrow">
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={18}
                      strokeWidth={2.2}
                    />
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Alert Modal encouraging sign-in when submitting as guest */}
      {showSignInModal && (
        <div
          aria-labelledby="contact-signin-modal-title"
          aria-modal="true"
          className="contact-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignInModal(false)
            }
          }}
          role="dialog"
        >
          <div className="contact-modal-card">
            <button
              aria-label="Close modal"
              className="contact-modal-close"
              onClick={() => setShowSignInModal(false)}
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>

            <div className="contact-modal-icon-wrap">
              <HugeiconsIcon icon={LockKeyIcon} size={28} />
            </div>

            <h3
              className="contact-modal-title"
              id="contact-signin-modal-title"
            >
              Sign in to send your message
            </h3>

            <p
              className="contact-modal-desc"
              id="contact-signin-modal-desc"
            >
              To ensure secure delivery and verify inquiry routing, an Outsource
              Pro Global account is required before submitting.
            </p>

            <div className="contact-modal-draft-note">
              <HugeiconsIcon icon={InformationCircleIcon} size={16} />
              <span>Your message draft has been saved.</span>
            </div>

            <div className="contact-modal-actions">
              <Link
                className="contact-modal-btn contact-modal-btn--primary"
                href="/sign-in?next=/contact"
                onClick={saveDraftToStorage}
              >
                <span>Sign in</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
              <Link
                className="contact-modal-btn contact-modal-btn--secondary"
                href="/sign-in?tab=signup&next=/contact"
                onClick={saveDraftToStorage}
              >
                <span>Create an account</span>
              </Link>
            </div>

            <button
              className="contact-modal-dismiss"
              onClick={() => setShowSignInModal(false)}
              type="button"
            >
              Continue editing draft
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
