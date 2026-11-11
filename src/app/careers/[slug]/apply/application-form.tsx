'use client'

import { AnimatePresence, motion } from 'framer-motion'
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

function CustomQuestionSelect({
  disabled,
  error,
  question,
}: {
  disabled: boolean
  error: string | undefined
  question: CareerQuestion
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const id = `application-${question.fieldName}`
  const errorId = `${id}-error`

  return (
    <div className="custom-form-select" ref={containerRef}>
      {/* Hidden input submitted with the FormData */}
      <input name={question.fieldName} type="hidden" value={selected} />

      {/* Hidden input for HTML5 required constraint validation */}
      {question.mandatory && (
        <input
          aria-hidden="true"
          disabled={disabled}
          onChange={() => {}}
          required
          style={{
            bottom: 0,
            height: 0,
            left: '50%',
            opacity: 0,
            pointerEvents: 'none',
            position: 'absolute',
            width: 0,
          }}
          tabIndex={-1}
          value={selected}
        />
      )}

      <button
        aria-describedby={error ? errorId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`custom-form-select__trigger ${
          open ? 'custom-form-select__trigger--open' : ''
        } ${error ? 'custom-form-select__trigger--error' : ''}`}
        disabled={disabled}
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        ref={triggerRef}
        type="button"
      >
        <span
          className={`custom-form-select__value ${
            !selected ? 'custom-form-select__placeholder' : ''
          }`}
        >
          {selected || 'Select an answer'}
        </span>
        <svg
          aria-hidden="true"
          className={`custom-form-select__chevron ${
            open ? 'custom-form-select__chevron--open' : ''
          }`}
          fill="none"
          height="16"
          viewBox="0 0 24 24"
          width="16"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.25"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="custom-form-select__menu"
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            role="listbox"
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {question.options.map((option) => {
              const isSelected = selected === option
              return (
                <button
                  aria-selected={isSelected}
                  className={`custom-form-select__option ${
                    isSelected ? 'custom-form-select__option--selected' : ''
                  }`}
                  key={option}
                  onClick={() => {
                    setSelected(option)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                  role="option"
                  type="button"
                >
                  <span>{option}</span>
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="custom-form-select__check"
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        <CustomQuestionSelect
          disabled={disabled}
          error={error}
          question={question}
        />
      ) : question.format === 'textarea' ? (
        <textarea
          {...shared}
          maxLength={question.maxLength || 5000}
          placeholder="Provide your response or details here…"
          rows={4}
        />
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
          placeholder={
            question.format === 'number' ? 'e.g. 5' : 'Enter your answer…'
          }
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
              placeholder="e.g. John"
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
              placeholder="e.g. Doe"
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
              placeholder="e.g. john.doe@example.com"
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
              placeholder="e.g. +63 912 345 6789"
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
            placeholder="Write a brief introduction, highlights of your relevant experience, or why you'd be a great fit for this role…"
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
