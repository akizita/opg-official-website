'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'

import { submitCareerApplicationAction } from '@/app/careers/[slug]/apply/actions'
import {
  OpgIconCheck,
  OpgIconClose,
  OpgIconCopy,
} from '@/components/icons/opg-icons'
import {
  MAX_RESUME_BYTES,
  PDF_INLINE_PREVIEW_MAX_BYTES,
  RESUME_ACCEPT,
  sanitizeCareerPhoneInput,
  validateCareerPhone,
  validateCareerResumeFile,
} from '@/lib/jazzhr/application-validation'
import type { CareerQuestion } from '@/lib/jazzhr/types'

import modalStyles from './application-success-modal.module.css'

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

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
  const shouldReduceMotion = Boolean(useReducedMotion())
  const [turnstileReady, setTurnstileReady] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ApplicationResult | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [phoneValue, setPhoneValue] = useState('')
  const [formResetKey, setFormResetKey] = useState(0)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [submittedReferenceId, setSubmittedReferenceId] = useState<
    string | null
  >(null)
  const [copiedRef, setCopiedRef] = useState(false)
  const [resumeSummary, setResumeSummary] = useState<{
    isPdf: boolean
    name: string
    sizeBytes: number
    sizeLabel: string
  } | null>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const modalCloseRef = useRef<HTMLButtonElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const mountTimeRef = useRef<number | null>(null)
  const submittingRef = useRef(false)
  const turnstileIdRef = useRef<string | null>(null)

  useEffect(() => {
    mountTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!siteKey || !turnstileReady) return
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
  }, [siteKey, turnstileReady])

  useEffect(() => {
    if (fieldErrors.form) alertRef.current?.focus()
  }, [fieldErrors])

  useEffect(() => {
    if (!successModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => modalCloseRef.current?.focus(), 40)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSuccessModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [successModalOpen])

  async function handleCopyReference() {
    if (!submittedReferenceId || typeof navigator === 'undefined') return
    try {
      await navigator.clipboard?.writeText(submittedReferenceId)
      setCopiedRef(true)
      window.setTimeout(() => setCopiedRef(false), 2200)
    } catch {
      // Clipboard API unavailable
    }
  }

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    const sanitized = sanitizeCareerPhoneInput(raw)
    setPhoneValue(sanitized)

    if (raw !== sanitized) {
      setFieldErrors((prev) => ({
        ...prev,
        phone:
          'Phone number cannot contain letters or unsupported symbols.',
      }))
      return
    }

    const phoneError = validateCareerPhone(sanitized)
    setFieldErrors((prev) => {
      if (!prev.phone) return prev
      if (!phoneError) {
        const next = { ...prev }
        delete next.phone
        return next
      }
      return prev
    })
  }

  function handlePhoneBlur() {
    if (!phoneValue.trim()) return
    const phoneError = validateCareerPhone(phoneValue)
    setFieldErrors((prev) => {
      if (!phoneError) {
        const next = { ...prev }
        delete next.phone
        return next
      }
      return { ...prev, phone: phoneError }
    })
  }

  function handleResumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setResumeSummary(null)
      setFieldErrors((prev) => {
        if (!prev.resume) return prev
        const next = { ...prev }
        delete next.resume
        return next
      })
      return
    }

    const resumeError = validateCareerResumeFile(file)
    if (resumeError) {
      setResumeSummary(null)
      setFieldErrors((prev) => ({ ...prev, resume: resumeError }))
      return
    }

    const isPdf =
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type.toLowerCase() === 'application/pdf'

    setResumeSummary({
      isPdf,
      name: file.name,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
    })
    setFieldErrors((prev) => {
      if (!prev.resume) return prev
      const next = { ...prev }
      delete next.resume
      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const phoneError = validateCareerPhone(phoneValue)
    const selectedFile = resumeInputRef.current?.files?.[0] ?? null
    const resumeError = validateCareerResumeFile(selectedFile)

    if (phoneError || resumeError) {
      const nextErrors: Record<string, string> = {}
      if (phoneError) nextErrors.phone = phoneError
      if (resumeError) nextErrors.resume = resumeError
      setFieldErrors(nextErrors)
      const firstInvalidId = phoneError
        ? 'application-phone'
        : 'application-resume'
      document.getElementById(firstInvalidId)?.focus()
      return
    }

    submittingRef.current = true
    setResult(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    formData.set('phone', phoneValue)
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
        setFieldErrors(response.errors ?? {})
        if (response.success) {
          formRef.current?.reset()
          setPhoneValue('')
          setResumeSummary(null)
          setFormResetKey((prev) => prev + 1)
          mountTimeRef.current = Date.now()
          setSubmittedReferenceId(response.referenceId ?? null)
          setCopiedRef(false)
          setSuccessModalOpen(true)
        }
        if (turnstileIdRef.current) {
          ;(window as TurnstileWindow).turnstile?.reset(turnstileIdRef.current)
        }
      } catch {
        const fallbackErrors = {
          form: 'A network error interrupted the submission. Please try again.',
        }
        setResult({
          errors: fallbackErrors,
          success: false,
        })
        setFieldErrors(fallbackErrors)
        if (turnstileIdRef.current) {
          ;(window as TurnstileWindow).turnstile?.reset(turnstileIdRef.current)
        }
      } finally {
        submittingRef.current = false
      }
    })
  }

  const errors = fieldErrors

  return (
    <>
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
              inputMode="tel"
              maxLength={40}
              name="phone"
              onBlur={handlePhoneBlur}
              onChange={handlePhoneChange}
              placeholder="e.g. +63 912 345 6789"
              required
              type="tel"
              value={phoneValue}
            />
            <FieldError error={errors.phone} id="application-phone-error" />
          </div>
          <div className="career-application__field">
            <label htmlFor="application-location">
              Location / City
              <span className="career-application__optional"> Optional</span>
            </label>
            <input
              aria-describedby={
                errors.location ? 'application-location-error' : undefined
              }
              aria-invalid={Boolean(errors.location)}
              autoComplete="address-level2"
              disabled={isPending}
              id="application-location"
              maxLength={160}
              name="location"
              placeholder="e.g. Makati City, Philippines"
              type="text"
            />
            <FieldError error={errors.location} id="application-location-error" />
          </div>
          <div className="career-application__field">
            <label htmlFor="application-linkedin-url">
              LinkedIn Profile URL
              <span className="career-application__optional"> Optional</span>
            </label>
            <input
              aria-describedby={
                errors.linkedinUrl
                  ? 'application-linkedin-url-error'
                  : undefined
              }
              aria-invalid={Boolean(errors.linkedinUrl)}
              autoComplete="url"
              disabled={isPending}
              id="application-linkedin-url"
              inputMode="url"
              maxLength={300}
              name="linkedinUrl"
              placeholder="e.g. https://www.linkedin.com/in/your-name"
              type="text"
            />
            <FieldError
              error={errors.linkedinUrl}
              id="application-linkedin-url-error"
            />
          </div>
          <div className="career-application__field career-application__field--full">
            <label htmlFor="application-website-url">
              Portfolio / Website URL
              <span className="career-application__optional"> Optional</span>
            </label>
            <input
              aria-describedby={
                errors.websiteUrl ? 'application-website-url-error' : undefined
              }
              aria-invalid={Boolean(errors.websiteUrl)}
              autoComplete="url"
              disabled={isPending}
              id="application-website-url"
              inputMode="url"
              maxLength={300}
              name="websiteUrl"
              placeholder="e.g. https://yourportfolio.com"
              type="text"
            />
            <FieldError
              error={errors.websiteUrl}
              id="application-website-url-error"
            />
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
            onChange={handleResumeChange}
            ref={resumeInputRef}
            required
            type="file"
          />
          <small id="application-resume-hint">
            PDF, DOC, DOCX, ODT, RTF, or TXT. Recommended: PDF under{' '}
            {PDF_INLINE_PREVIEW_MAX_BYTES / 1024 / 1024} MB for full visual
            preview (max {MAX_RESUME_BYTES / 1024 / 1024} MB).
          </small>
          {resumeSummary && !errors.resume ? (
            <p
              aria-live="polite"
              className={`career-application__resume-notice ${
                resumeSummary.sizeBytes > PDF_INLINE_PREVIEW_MAX_BYTES
                  ? 'career-application__resume-notice--warning'
                  : resumeSummary.isPdf
                    ? 'career-application__resume-notice--ready'
                    : ''
              }`}
            >
              <strong>
                {resumeSummary.name} ({resumeSummary.sizeLabel})
              </strong>{' '}
              {resumeSummary.sizeBytes > PDF_INLINE_PREVIEW_MAX_BYTES
                ? `exceeds ${PDF_INLINE_PREVIEW_MAX_BYTES / 1024 / 1024} MB — your original file will still be attached under Documents, though compressing your PDF under ${PDF_INLINE_PREVIEW_MAX_BYTES / 1024 / 1024} MB enables full inline PDF rendering.`
                : resumeSummary.isPdf
                  ? '— ready for full PDF preview.'
                  : '— ready to attach with your application.'}
            </p>
          ) : null}
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
                key={`${question.fieldName}-${formResetKey}`}
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
          {isPending ? 'Submitting' : 'Submit'}
        </button>
        <p>
          Your application is sent securely to OPG&apos;s JazzHR recruitment
          workspace.
        </p>
      </div>
    </form>

    {typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {successModalOpen ? (
              <motion.div
                animate={{ opacity: 1 }}
                className={modalStyles.backdrop}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={(event) => {
                  if (event.target === event.currentTarget) {
                    setSuccessModalOpen(false)
                  }
                }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
              >
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  aria-describedby="career-success-modal-desc"
                  aria-labelledby="career-success-modal-title"
                  aria-modal="true"
                  className={modalStyles.modal}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, y: 10 }
                  }
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, y: 14 }
                  }
                  role="dialog"
                  transition={{
                    duration: shouldReduceMotion ? 0.01 : 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <button
                    aria-label="Close confirmation dialog"
                    className={modalStyles.closeBtn}
                    onClick={() => setSuccessModalOpen(false)}
                    ref={modalCloseRef}
                    type="button"
                  >
                    <OpgIconClose size={17} />
                  </button>

                  <div aria-hidden="true" className={modalStyles.iconOrb}>
                    <OpgIconCheck size={28} />
                  </div>

                  <p className={modalStyles.eyebrow}>Application received</p>

                  <h2 className={modalStyles.title} id="career-success-modal-title">
                    Thank you for applying.
                  </h2>

                  <p
                    className={modalStyles.description}
                    id="career-success-modal-desc"
                  >
                    Your application for <strong>{jobTitle}</strong> has been
                    submitted to our recruitment team.
                  </p>

                  {submittedReferenceId ? (
                    <div className={modalStyles.referenceCard}>
                      <div className={modalStyles.referenceMeta}>
                        <span className={modalStyles.referenceLabel}>
                          Application Reference
                        </span>
                        <span className={modalStyles.referenceCode}>
                          {submittedReferenceId}
                        </span>
                      </div>
                      <button
                        className={modalStyles.copyBtn}
                        onClick={() => void handleCopyReference()}
                        type="button"
                      >
                        <OpgIconCopy size={14} />
                        <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ) : null}

                  <p className={modalStyles.note}>
                    Keep this reference for any follow-up with our talent
                    acquisition team at recruitment@opglobal.com.hk.
                  </p>

                  <div className={modalStyles.actions}>
                    <Link className={modalStyles.primaryAction} href="/careers">
                      Browse open roles
                    </Link>
                    <button
                      className={modalStyles.secondaryAction}
                      onClick={() => setSuccessModalOpen(false)}
                      type="button"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null}
    </>
  )
}
