'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useRef, useState, useTransition } from 'react'

import { submitCareerApplicationAction } from '@/app/careers/[slug]/apply/actions'
import {
  MAX_RESUME_BYTES,
  RESUME_ACCEPT,
} from '@/lib/jazzhr/application-validation'
import type { CareerQuestion } from '@/lib/jazzhr/types'

type TurnstileWindow = Window & {
  turnstile?: {
    remove: (widgetId: string) => void
    render: (
      container: HTMLElement,
      options: { sitekey: string; size: 'flexible' },
    ) => string
    reset: (widgetId: string) => void
  }
}

type ApplicationResult = {
  errors?: Record<string, string>
  referenceId?: string
  success: boolean
}

function FieldError({ error, id }: { error: string | undefined; id: string }) {
  if (!error) return null
  return (
    <p className="career-application__field-error" id={id}>
      <span aria-hidden="true">!</span>
      {error}
    </p>
  )
}

function QuestionField({
  disabled,
  error,
  question,
}: {
  disabled: boolean
  error: string | undefined
  question: CareerQuestion
}) {
  const id = `application-${question.fieldName}`
  const errorId = `${id}-error`
  const shared = {
    'aria-describedby': error ? errorId : undefined,
    'aria-invalid': Boolean(error),
    disabled,
    id,
    name: question.fieldName,
    required: question.mandatory,
  }

  return (
    <div className="career-application__field">
      <label htmlFor={question.format === 'checkbox' ? undefined : id}>
        {question.label}
        {question.mandatory ? (
          <span aria-label="required" className="field-required">
            {' '}
            *
          </span>
        ) : (
          <span className="career-application__optional"> Optional</span>
        )}
      </label>

      {question.format === 'select' ? (
        <select {...shared} defaultValue="">
          <option disabled={question.mandatory} value="">
            Select an answer
          </option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : question.format === 'textarea' ? (
        <textarea {...shared} maxLength={question.maxLength || 5000} rows={4} />
      ) : question.format === 'checkbox' ? (
        <fieldset
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className="career-application__choices"
        >
          <legend className="sr-only">{question.label}</legend>
          {question.options.map((option, index) => (
            <label key={option}>
              <input
                disabled={disabled}
                id={`${id}-${index}`}
                name={question.fieldName}
                type="checkbox"
                value={option}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <input
          {...shared}
          maxLength={question.maxLength || undefined}
          step={question.format === 'number' ? 'any' : undefined}
          type={question.format}
        />
      )}
      <FieldError error={error} id={errorId} />
    </div>
  )
}

export function CareerApplicationForm({
  jobSlug,
  jobTitle,
  questions,
}: {
  jobSlug: string
  jobTitle: string
  questions: CareerQuestion[]
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const [turnstileReady, setTurnstileReady] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ApplicationResult | null>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const mountTimeRef = useRef<number | null>(null)
  const submittingRef = useRef(false)
  const turnstileIdRef = useRef<string | null>(null)

  useEffect(() => {
    mountTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!siteKey || !turnstileReady || result?.success) return
    const container = formRef.current?.querySelector<HTMLElement>(
      '#career-application-turnstile',
    )
    const turnstile = (window as TurnstileWindow).turnstile
    if (!container || !turnstile || turnstileIdRef.current) return

    turnstileIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      size: 'flexible',
    })

    return () => {
      if (turnstileIdRef.current) {
        turnstile.remove(turnstileIdRef.current)
        turnstileIdRef.current = null
      }
    }
  }, [result?.success, siteKey, turnstileReady])

  useEffect(() => {
    if (result?.errors?.form) alertRef.current?.focus()
  }, [result])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setResult(null)

    const formData = new FormData(event.currentTarget)
    formData.set(
      'elapsedSeconds',
      String(
        mountTimeRef.current
          ? Math.round((Date.now() - mountTimeRef.current) / 1000)
          : 0,
      ),
    )

    startTransition(async () => {
      try {
        const response = await submitCareerApplicationAction(jobSlug, formData)
        setResult(response)
        if (!response.success && turnstileIdRef.current) {
          ;(window as TurnstileWindow).turnstile?.reset(turnstileIdRef.current)
        }
      } catch {
        setResult({
          errors: {
            form: 'A network error interrupted the submission. Please try again.',
          },
          success: false,
        })
        if (turnstileIdRef.current) {
          ;(window as TurnstileWindow).turnstile?.reset(turnstileIdRef.current)
        }
      } finally {
        submittingRef.current = false
      }
    })
  }

  if (result?.success) {
    return (
      <section
        aria-live="polite"
        className="career-application__success"
        role="status"
      >
        <span>Application received</span>
        <h2>Thank you for applying.</h2>
        <p>
          Your application for <strong>{jobTitle}</strong> was submitted to our
          recruitment team.
        </p>
        {result.referenceId ? (
          <p>
            Reference: <strong>{result.referenceId}</strong>
          </p>
        ) : null}
        <p>Keep this reference for any follow-up with recruitment.</p>
        <Link className="button-link button-link--primary" href="/careers">
          View other open roles
        </Link>
      </section>
    )
  }

  const errors = result?.errors || {}

  return (
    <form
      aria-label={`Application for ${jobTitle}`}
      className="career-application__form"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {siteKey ? (
        <Script
          onReady={() => setTurnstileReady(true)}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      ) : null}

      {errors.form ? (
        <div
          aria-live="assertive"
          className="career-application__alert"
          ref={alertRef}
          role="alert"
          tabIndex={-1}
        >
          <strong>We could not complete the submission.</strong>
          <p>{errors.form}</p>
          {result?.referenceId ? (
            <p>
              Reference: <strong>{result.referenceId}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      <div aria-hidden="true" className="career-application__honeypot">
        <label htmlFor="career-website">Leave this field empty</label>
        <input
          autoComplete="off"
          id="career-website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <fieldset className="career-application__section">
        <legend>Your details</legend>
        <p>Fields marked with an asterisk (*) are required.</p>
        <div className="career-application__grid">
          <div className="career-application__field">
            <label htmlFor="application-first-name">
              First name <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={
                errors.firstName ? 'first-name-error' : undefined
              }
              aria-invalid={Boolean(errors.firstName)}
              autoComplete="given-name"
              disabled={isPending}
              id="application-first-name"
              maxLength={80}
              name="firstName"
              required
              type="text"
            />
            <FieldError error={errors.firstName} id="first-name-error" />
          </div>
          <div className="career-application__field">
            <label htmlFor="application-last-name">
              Last name <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={errors.lastName ? 'last-name-error' : undefined}
              aria-invalid={Boolean(errors.lastName)}
              autoComplete="family-name"
              disabled={isPending}
              id="application-last-name"
              maxLength={80}
              name="lastName"
              required
              type="text"
            />
            <FieldError error={errors.lastName} id="last-name-error" />
          </div>
          <div className="career-application__field">
            <label htmlFor="application-email">
              Email address <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={
                errors.email ? 'application-email-error' : undefined
              }
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              disabled={isPending}
              id="application-email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
            <FieldError error={errors.email} id="application-email-error" />
          </div>
          <div className="career-application__field">
            <label htmlFor="application-phone">
              Phone number <span className="field-required">*</span>
            </label>
            <input
              aria-describedby={
                errors.phone ? 'application-phone-error' : undefined
              }
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              disabled={isPending}
              id="application-phone"
              maxLength={40}
              name="phone"
              required
              type="tel"
            />
            <FieldError error={errors.phone} id="application-phone-error" />
          </div>
        </div>
      </fieldset>

      <fieldset className="career-application__section">
        <legend>Résumé and introduction</legend>
        <div className="career-application__field">
          <label htmlFor="application-resume">
            Résumé <span className="field-required">*</span>
          </label>
          <input
            accept={RESUME_ACCEPT}
            aria-describedby="application-resume-hint application-resume-error"
            aria-invalid={Boolean(errors.resume)}
            disabled={isPending}
            id="application-resume"
            name="resume"
            required
            type="file"
          />
          <small id="application-resume-hint">
            PDF, DOC, DOCX, ODT, RTF, or TXT. Maximum{' '}
            {MAX_RESUME_BYTES / 1024 / 1024} MB.
          </small>
          <FieldError error={errors.resume} id="application-resume-error" />
        </div>
        <div className="career-application__field">
          <label htmlFor="application-cover-letter">
            Cover letter
            <span className="career-application__optional"> Optional</span>
          </label>
          <textarea
            aria-describedby={
              errors.coverLetter ? 'application-cover-letter-error' : undefined
            }
            aria-invalid={Boolean(errors.coverLetter)}
            disabled={isPending}
            id="application-cover-letter"
            maxLength={5000}
            name="coverLetter"
            rows={6}
          />
          <FieldError
            error={errors.coverLetter}
            id="application-cover-letter-error"
          />
        </div>
      </fieldset>

      {questions.length > 0 ? (
        <fieldset className="career-application__section">
          <legend>Role-specific questions</legend>
          <div className="career-application__questions">
            {questions.map((question) => (
              <QuestionField
                disabled={isPending}
                error={errors[question.fieldName]}
                key={question.fieldName}
                question={question}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="career-application__consent">
        <label>
          <input
            aria-describedby={
              errors.privacyConsent ? 'application-consent-error' : undefined
            }
            aria-invalid={Boolean(errors.privacyConsent)}
            disabled={isPending}
            name="privacyConsent"
            required
            type="checkbox"
          />
          <span>
            I acknowledge the OPG <Link href="/privacy">Privacy Notice</Link>{' '}
            and consent to OPG and its recruitment platform, JazzHR, processing
            my information for recruitment purposes.{' '}
            <span className="field-required">*</span>
          </span>
        </label>
        <FieldError
          error={errors.privacyConsent}
          id="application-consent-error"
        />
      </div>

      {siteKey ? (
        <div
          className="career-application__turnstile"
          id="career-application-turnstile"
        />
      ) : null}

      <div className="career-application__submit">
        <button
          className="button button--primary"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Submitting application…' : 'Submit application'}
        </button>
        <p>
          Your application is sent securely to OPG&apos;s JazzHR recruitment
          workspace.
        </p>
      </div>
    </form>
  )
}
