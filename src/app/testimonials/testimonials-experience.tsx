'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'

import { submitCandidateTestimonialAction } from '@/app/testimonials/actions'
import Aurora from '@/components/ui/aurora'
import { CandidateTestimonialsLive } from '@/components/ui/candidate-testimonials-live'
import PeekRating from '@/components/ui/peek-rating'
import Stepper, { Step } from '@/components/ui/react-bits-stepper'
import type { CandidateTestimonial } from '@/lib/content/candidate-testimonials'

type Relationship = '' | 'prospective' | 'past'
type TurnstileWindow = Window & {
  turnstile?: {
    render: (container: HTMLElement, options: { sitekey: string }) => string
    remove: (widgetId: string) => void
  }
}

const relationshipOptions = [
  { value: 'prospective', label: 'Prospective candidate' },
  { value: 'past', label: 'Past candidate' },
] as const

export function CandidateTestimonialsExperience({
  testimonials,
}: {
  testimonials: CandidateTestimonial[]
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const [modalOpen, setModalOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [authorName, setAuthorName] = useState('')
  const [email, setEmail] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [quote, setQuote] = useState('')
  const [publicationConsent, setPublicationConsent] = useState(false)
  const [rating, setRating] = useState(0)
  const [relationship, setRelationship] = useState<Relationship>('')
  const [relationshipOpen, setRelationshipOpen] = useState(false)
  const [relationshipMenuPosition, setRelationshipMenuPosition] = useState<{
    left: number
    top: number
    width: number
    placement: 'above' | 'below'
  } | null>(null)
  const [activeRelationshipIndex, setActiveRelationshipIndex] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    errors?: Record<string, string>
  } | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [turnstileReady, setTurnstileReady] = useState(false)
  const [pending, startTransition] = useTransition()
  const openedAt = useRef<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const successDialogRef = useRef<HTMLDialogElement>(null)
  const modalScrollerRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  const previousFormStep = useRef(formStep)
  const relationshipRef = useRef<HTMLDivElement>(null)
  const relationshipButtonRef = useRef<HTMLButtonElement>(null)
  const relationshipMenuRef = useRef<HTMLDivElement>(null)

  const positionRelationshipMenu = useCallback(() => {
    const trigger = relationshipButtonRef.current
    const dialog = dialogRef.current
    if (!trigger || !dialog) return

    const triggerRect = trigger.getBoundingClientRect()
    const dialogRect = dialog.getBoundingClientRect()
    const menuHeight = relationshipMenuRef.current?.offsetHeight ?? 110
    const placement =
      window.innerHeight - triggerRect.bottom < menuHeight + 12 &&
      triggerRect.top > menuHeight + 12
        ? 'above'
        : 'below'

    setRelationshipMenuPosition({
      left: triggerRect.left - dialogRect.left,
      top:
        placement === 'above'
          ? triggerRect.top - dialogRect.top - menuHeight - 6
          : triggerRect.bottom - dialogRect.top + 6,
      width: triggerRect.width,
      placement,
    })
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!modalOpen || !dialog) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [modalOpen])

  useEffect(() => {
    if (!result?.success || modalOpen) return
    // The form dialog must leave the top layer before the thank-you dialog
    // opens, so each modal has its own backdrop and focus trap.
    const frame = requestAnimationFrame(() => setSuccessOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [result?.success, modalOpen])

  useEffect(() => {
    const dialog = successDialogRef.current
    if (!successOpen || !dialog) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [successOpen])

  useEffect(() => {
    if (formStep === previousFormStep.current) return
    previousFormStep.current = formStep
    if (!modalOpen || result?.success) return

    const frame = requestAnimationFrame(() => {
      const form = formRef.current
      if (!form) return
      form
        .querySelector<HTMLElement>(
          '.stepper__pane:not(.stepper__pane--leaving)',
        )
        ?.focus({ preventScroll: true })
      modalScrollerRef.current?.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [formStep, result?.success, modalOpen])

  useEffect(() => {
    if (!relationshipOpen) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (
        !relationshipRef.current?.contains(event.target as Node) &&
        !relationshipMenuRef.current?.contains(event.target as Node)
      ) {
        setRelationshipOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [relationshipOpen])

  useEffect(() => {
    if (!relationshipOpen) return
    positionRelationshipMenu()
    const scroller = modalScrollerRef.current
    scroller?.addEventListener('scroll', positionRelationshipMenu, {
      passive: true,
    })
    window.addEventListener('resize', positionRelationshipMenu)
    return () => {
      scroller?.removeEventListener('scroll', positionRelationshipMenu)
      window.removeEventListener('resize', positionRelationshipMenu)
    }
  }, [relationshipOpen, positionRelationshipMenu])

  useEffect(() => {
    if (
      !siteKey ||
      !turnstileReady ||
      !modalOpen ||
      formStep !== 3 ||
      result?.success
    )
      return

    const container = formRef.current?.querySelector<HTMLElement>(
      '.stepper__pane:not(.stepper__pane--leaving) #candidate-testimonials-turnstile',
    )
    const turnstile = (window as TurnstileWindow).turnstile
    if (!container || !turnstile) return

    const widgetId = turnstile.render(container, { sitekey: siteKey })
    return () => turnstile.remove(widgetId)
  }, [formStep, result?.success, siteKey, modalOpen, turnstileReady])

  function openModal() {
    openedAt.current = Date.now()
    setModalOpen(true)
  }

  function closeModal() {
    if (pending) return
    setModalOpen(false)
    setRelationshipOpen(false)
    requestAnimationFrame(() => shareButtonRef.current?.focus())
  }

  function closeSuccessModal() {
    successDialogRef.current?.close()
    setSuccessOpen(false)
    setResult(null)
    requestAnimationFrame(() => shareButtonRef.current?.focus())
  }

  function shareAnotherStory() {
    successDialogRef.current?.close()
    setSuccessOpen(false)
    setResult(null)
    setFormStep(1)
    requestAnimationFrame(openModal)
  }

  function chooseRelationship(value: Relationship) {
    setRelationship(value)
    setRelationshipOpen(false)
    clearFieldError('relationship')
    relationshipButtonRef.current?.focus()
  }

  function clearFieldError(field: string) {
    setClientErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    if (result?.errors?.[field]) setResult(null)
  }

  function validateStep(step: number): Record<string, string> {
    const nextErrors: Record<string, string> = {}

    if (step === 1) {
      if (authorName.trim().length < 2 || authorName.trim().length > 100)
        nextErrors.authorName = 'Enter a name between 2 and 100 characters.'
      if (
        email.trim().length > 254 ||
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim())
      )
        nextErrors.email = 'Enter a valid email address.'
      if (!relationship)
        nextErrors.relationship = 'Select your connection with OPG.'
      if (roleTitle.trim().length > 120)
        nextErrors.roleTitle = 'Role or field must be 120 characters or fewer.'
    } else if (step === 2) {
      if (rating < 1 || rating > 5)
        nextErrors.rating = 'Choose a rating from 1 to 5 stars.'
      if (quote.trim().length < 20 || quote.trim().length > 1200)
        nextErrors.quote = 'Your story must be between 20 and 1,200 characters.'
    } else if (step === 3 && !publicationConsent) {
      nextErrors.publicationConsent = 'Consent is required to share your story.'
    }

    return nextErrors
  }

  function handleStepContinue(event: React.MouseEvent<HTMLButtonElement>) {
    const stepErrors = validateStep(formStep)
    if (Object.keys(stepErrors).length) {
      event.preventDefault()
      setClientErrors(stepErrors)
    } else {
      setClientErrors({})
    }
  }

  function handleRelationshipKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const selectedIndex = relationshipOptions.findIndex(
        (option) => option.value === relationship,
      )
      setActiveRelationshipIndex((index) =>
        relationshipOpen
          ? (index + step + relationshipOptions.length) %
            relationshipOptions.length
          : selectedIndex >= 0
            ? selectedIndex
            : step > 0
              ? 0
              : relationshipOptions.length - 1,
      )
      if (!relationshipOpen) positionRelationshipMenu()
      setRelationshipOpen(true)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveRelationshipIndex(
        event.key === 'Home' ? 0 : relationshipOptions.length - 1,
      )
      if (!relationshipOpen) positionRelationshipMenu()
      setRelationshipOpen(true)
    } else if (event.key === 'Escape' && relationshipOpen) {
      event.preventDefault()
      event.stopPropagation()
      setRelationshipOpen(false)
    } else if (
      relationshipOpen &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault()
      chooseRelationship(relationshipOptions[activeRelationshipIndex].value)
    } else if (event.key === 'Tab') {
      setRelationshipOpen(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formStep < 3) {
      const stepErrors = validateStep(formStep)
      if (Object.keys(stepErrors).length) setClientErrors(stepErrors)
      else {
        setClientErrors({})
        setFormStep(formStep + 1)
      }
      return
    }
    const allErrors = {
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
    }
    if (Object.keys(allErrors).length) {
      setClientErrors(allErrors)
      setFormStep(
        allErrors.authorName ||
          allErrors.email ||
          allErrors.relationship ||
          allErrors.roleTitle
          ? 1
          : allErrors.rating || allErrors.quote
            ? 2
            : 3,
      )
      return
    }
    const formData = new FormData(event.currentTarget)
    formData.set('authorName', authorName)
    formData.set('email', email)
    formData.set('relationship', relationship)
    formData.set('roleTitle', roleTitle)
    formData.set('rating', String(rating))
    formData.set('quote', quote)
    formData.set('publicationConsent', publicationConsent ? 'on' : '')
    formData.set(
      'elapsedSeconds',
      String(openedAt.current ? (Date.now() - openedAt.current) / 1000 : 0),
    )
    setResult(null)
    startTransition(async () => {
      try {
        const response = await submitCandidateTestimonialAction(formData)
        setResult(response)
        if (!response.success && response.errors) {
          const serverErrors = response.errors
          setFormStep(
            serverErrors.authorName ||
              serverErrors.email ||
              serverErrors.relationship ||
              serverErrors.roleTitle
              ? 1
              : serverErrors.rating || serverErrors.quote
                ? 2
                : 3,
          )
        }
        if (response.success) {
          dialogRef.current?.close()
          setModalOpen(false)
          formRef.current?.reset()
          setAuthorName('')
          setEmail('')
          setRoleTitle('')
          setQuote('')
          setPublicationConsent(false)
          setRating(0)
          setRelationship('')
          setRelationshipOpen(false)
          setClientErrors({})
        }
      } catch {
        setResult({
          success: false,
          errors: {
            form: 'The submission did not go through. Please try again.',
          },
        })
      }
    })
  }

  const errors = { ...(result?.errors ?? {}), ...clientErrors }

  return (
    <div className="candidate-testimonials-page">
      <div className="candidate-testimonials-page__aurora">
        <Aurora amplitude={0.75} blend={0.4} speed={0.45} />
      </div>
      <div className="candidate-testimonials-content container">
        <CandidateTestimonialsLive audience="public" showStatus={false} />

        <section
          className="candidate-testimonials-workspace"
          aria-label="Candidate testimonials"
        >
          <header className="candidate-testimonials-intro">
            <div className="candidate-testimonials-intro__copy">
              <h1>Stories from our candidate community.</h1>
              <p>
                From first conversations to new opportunities, discover what
                connecting with OPG has meant to our candidate community. Each
                story is shared with permission and reviewed by our team.
              </p>
            </div>
            <button
              aria-haspopup="dialog"
              className="candidate-testimonials-share-button"
              onClick={openModal}
              ref={shareButtonRef}
              type="button"
            >
              Share your story
            </button>
          </header>
          {modalOpen && (
            <dialog
              aria-labelledby="candidate-testimonials-modal-title"
              className="candidate-testimonials-modal"
              onCancel={(event) => {
                if (pending) event.preventDefault()
                else closeModal()
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) closeModal()
              }}
              ref={dialogRef}
            >
              <div
                className="candidate-testimonials-modal__scroller"
                ref={modalScrollerRef}
              >
                <div className="candidate-testimonials-modal__header">
                  <div>
                    <h2 id="candidate-testimonials-modal-title">
                      Share your story
                    </h2>
                    <p>
                      Your email stays private. Our team reviews each submission
                      before a story appears here.
                    </p>
                  </div>
                  <button
                    aria-label="Close story form"
                    className="candidate-testimonials-modal__close"
                    disabled={pending}
                    onClick={closeModal}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <form
                  className="candidate-testimonials-form"
                  noValidate
                  onSubmit={handleSubmit}
                  ref={formRef}
                >
                  {errors.form && (
                    <p
                      className="candidate-testimonials-form__error"
                      role="alert"
                    >
                      {errors.form}
                    </p>
                  )}
                  <div
                    aria-hidden="true"
                    className="candidate-testimonials-form__trap"
                  >
                    <label htmlFor="candidate-testimonials-website">
                      Leave this empty
                    </label>
                    <input
                      autoComplete="off"
                      id="candidate-testimonials-website"
                      name="website"
                      tabIndex={-1}
                    />
                  </div>
                  {siteKey && (
                    <Script
                      onReady={() => setTurnstileReady(true)}
                      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                      strategy="afterInteractive"
                    />
                  )}
                  <Stepper
                    accentColor="#f2b111"
                    backButtonProps={{ disabled: pending }}
                    backButtonText="Back"
                    className="candidate-testimonials-stepper"
                    completeButtonText={
                      pending ? 'Submitting…' : 'Submit for review'
                    }
                    disableStepIndicators
                    frame={false}
                    nextButtonProps={{
                      disabled: pending,
                      onClick: handleStepContinue,
                    }}
                    nextButtonText="Continue"
                    onFinalStepCompleted={() =>
                      formRef.current?.requestSubmit()
                    }
                    onStepChange={setFormStep}
                    step={formStep}
                    theme="light"
                    transition="slide"
                    width="100%"
                    style={
                      {
                        '--stepper-ink': '#31291e',
                        '--stepper-muted': '#766b5a',
                        '--stepper-well': 'rgb(255 255 255 / 42%)',
                        '--stepper-tile':
                          'linear-gradient(135deg, #ffe085, #f2b111)',
                        '--stepper-tile-edge': 'rgb(191 129 14 / 32%)',
                        '--stepper-solid-ink': '#291c05',
                      } as React.CSSProperties
                    }
                  >
                    <Step title="About you">
                      <div className="candidate-testimonials-form__row">
                        <div className="candidate-testimonials-form__field">
                          <label htmlFor="candidate-testimonials-name">
                            Your name <span>*</span>
                          </label>
                          <input
                            aria-invalid={Boolean(errors.authorName)}
                            autoComplete="name"
                            disabled={pending}
                            id="candidate-testimonials-name"
                            maxLength={100}
                            name="authorName"
                            onChange={(event) => {
                              setAuthorName(event.target.value)
                              clearFieldError('authorName')
                            }}
                            placeholder="How should we credit you?"
                            required
                            value={authorName}
                          />
                          {errors.authorName && (
                            <small role="alert">{errors.authorName}</small>
                          )}
                        </div>
                        <div className="candidate-testimonials-form__field">
                          <label htmlFor="candidate-testimonials-email">
                            Email address <span>*</span>
                          </label>
                          <input
                            aria-invalid={Boolean(errors.email)}
                            autoComplete="email"
                            disabled={pending}
                            id="candidate-testimonials-email"
                            maxLength={254}
                            name="email"
                            onChange={(event) => {
                              setEmail(event.target.value)
                              clearFieldError('email')
                            }}
                            placeholder="Only used about your submission"
                            required
                            type="email"
                            value={email}
                          />
                          {errors.email && (
                            <small role="alert">{errors.email}</small>
                          )}
                        </div>
                      </div>
                      <div className="candidate-testimonials-form__section-divider" />
                      <div className="candidate-testimonials-form__row">
                        <div className="candidate-testimonials-form__field">
                          <label
                            htmlFor="candidate-testimonials-relationship"
                            id="candidate-testimonials-relationship-label"
                          >
                            Your connection with OPG <span>*</span>
                          </label>
                          <div
                            className="candidate-testimonials-select"
                            ref={relationshipRef}
                          >
                            <input
                              name="relationship"
                              type="hidden"
                              value={relationship}
                            />
                            <button
                              aria-activedescendant={
                                relationshipOpen
                                  ? `candidate-testimonials-relationship-option-${activeRelationshipIndex}`
                                  : undefined
                              }
                              aria-controls={
                                relationshipOpen
                                  ? 'candidate-testimonials-relationship-listbox'
                                  : undefined
                              }
                              aria-describedby={
                                errors.relationship
                                  ? 'candidate-testimonials-relationship-error'
                                  : undefined
                              }
                              aria-expanded={relationshipOpen}
                              aria-invalid={Boolean(errors.relationship)}
                              aria-labelledby="candidate-testimonials-relationship-label"
                              aria-required="true"
                              className="candidate-testimonials-select__trigger"
                              disabled={pending}
                              id="candidate-testimonials-relationship"
                              onClick={() => {
                                setActiveRelationshipIndex(
                                  Math.max(
                                    0,
                                    relationshipOptions.findIndex(
                                      (option) => option.value === relationship,
                                    ),
                                  ),
                                )
                                if (!relationshipOpen)
                                  positionRelationshipMenu()
                                setRelationshipOpen((open) => !open)
                              }}
                              onKeyDown={handleRelationshipKeyDown}
                              ref={relationshipButtonRef}
                              role="combobox"
                              type="button"
                            >
                              {relationship
                                ? relationshipOptions.find(
                                    (option) => option.value === relationship,
                                  )?.label
                                : 'Select one'}
                            </button>
                          </div>
                          {errors.relationship && (
                            <small
                              id="candidate-testimonials-relationship-error"
                              role="alert"
                            >
                              {errors.relationship}
                            </small>
                          )}
                        </div>
                        <div className="candidate-testimonials-form__field">
                          <label htmlFor="candidate-testimonials-role">
                            Role or professional field{' '}
                            <span className="candidate-testimonials-form__optional">
                              Optional
                            </span>
                          </label>
                          <input
                            aria-invalid={Boolean(errors.roleTitle)}
                            disabled={pending}
                            id="candidate-testimonials-role"
                            maxLength={120}
                            name="roleTitle"
                            onChange={(event) => {
                              setRoleTitle(event.target.value)
                              clearFieldError('roleTitle')
                            }}
                            placeholder="e.g. Software engineer"
                            value={roleTitle}
                          />
                          {errors.roleTitle && (
                            <small role="alert">{errors.roleTitle}</small>
                          )}
                        </div>
                      </div>
                    </Step>
                    <Step title="Experience">
                      <div className="candidate-testimonials-form__field">
                        <div className="candidate-testimonials-form__story-heading">
                          <label htmlFor="candidate-testimonials-quote">
                            Your story <span>*</span>
                          </label>
                          <PeekRating
                            activeColor="#eda90c"
                            ariaLabel="Rating for your story"
                            disabled={pending}
                            labels={[
                              'Very poor',
                              'Poor',
                              'Okay',
                              'Good',
                              'Excellent',
                            ]}
                            onChange={(nextRating) => {
                              setRating(nextRating)
                              clearFieldError('rating')
                            }}
                            value={rating}
                            allowClear={false}
                            size={34}
                          />
                        </div>
                        <input name="rating" type="hidden" value={rating} />
                        {errors.rating && (
                          <small role="alert">{errors.rating}</small>
                        )}
                        <textarea
                          aria-invalid={Boolean(errors.quote)}
                          disabled={pending}
                          id="candidate-testimonials-quote"
                          maxLength={1200}
                          minLength={20}
                          name="quote"
                          onChange={(event) => {
                            setQuote(event.target.value)
                            clearFieldError('quote')
                          }}
                          placeholder="What was your experience with OPG? What would you want another candidate to know?"
                          required
                          rows={6}
                          value={quote}
                        />
                        <p className="candidate-testimonials-form__hint">
                          20–1,200 characters. Please avoid sharing private
                          details about other people.
                        </p>
                        {errors.quote && (
                          <small role="alert">{errors.quote}</small>
                        )}
                      </div>
                    </Step>
                    <Step title="Permission">
                      <label
                        className="candidate-testimonials-form__consent"
                        htmlFor="candidate-testimonials-consent"
                      >
                        <input
                          aria-invalid={Boolean(errors.publicationConsent)}
                          checked={publicationConsent}
                          disabled={pending}
                          id="candidate-testimonials-consent"
                          name="publicationConsent"
                          onChange={(event) => {
                            setPublicationConsent(event.target.checked)
                            clearFieldError('publicationConsent')
                          }}
                          required
                          type="checkbox"
                        />
                        <span>
                          I agree that OPG may publish my name, role or field,
                          candidate relationship, rating, and story if approved.
                          I have read the{' '}
                          <Link href="/privacy" target="_blank">
                            Privacy Notice
                          </Link>
                          . <strong>*</strong>
                        </span>
                      </label>
                      {errors.publicationConsent && (
                        <small
                          className="candidate-testimonials-form__error"
                          role="alert"
                        >
                          {errors.publicationConsent}
                        </small>
                      )}
                      {siteKey && <div id="candidate-testimonials-turnstile" />}
                      <div className="candidate-testimonials-form__submit">
                        <p>Stories are reviewed before publication.</p>
                      </div>
                    </Step>
                  </Stepper>
                </form>
              </div>
              {relationshipOpen &&
                relationshipMenuPosition &&
                dialogRef.current &&
                createPortal(
                  <div
                    aria-labelledby="candidate-testimonials-relationship-label"
                    className="candidate-testimonials-select__listbox candidate-testimonials-select__listbox--floating"
                    data-placement={relationshipMenuPosition.placement}
                    id="candidate-testimonials-relationship-listbox"
                    ref={relationshipMenuRef}
                    role="listbox"
                    style={{
                      left: relationshipMenuPosition.left,
                      top: relationshipMenuPosition.top,
                      width: relationshipMenuPosition.width,
                    }}
                  >
                    {relationshipOptions.map((option, index) => (
                      <button
                        aria-selected={relationship === option.value}
                        className="candidate-testimonials-select__option"
                        data-active={activeRelationshipIndex === index}
                        id={`candidate-testimonials-relationship-option-${index}`}
                        key={option.value}
                        onClick={() => chooseRelationship(option.value)}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveRelationshipIndex(index)}
                        role="option"
                        tabIndex={-1}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>,
                  dialogRef.current,
                )}
            </dialog>
          )}
          {successOpen && (
            <dialog
              aria-describedby="candidate-testimonials-success-description"
              aria-labelledby="candidate-testimonials-success-title"
              className="candidate-testimonials-modal candidate-testimonials-modal--success"
              onCancel={(event) => {
                event.preventDefault()
                closeSuccessModal()
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) closeSuccessModal()
              }}
              ref={successDialogRef}
            >
              <div className="candidate-testimonials-success">
                <button
                  aria-label="Close thank-you message"
                  className="candidate-testimonials-modal__close candidate-testimonials-success__close"
                  onClick={closeSuccessModal}
                  type="button"
                >
                  ×
                </button>
                <span
                  className="candidate-testimonials-success__icon"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <h2 id="candidate-testimonials-success-title">
                  Thank you for sharing.
                </h2>
                <p id="candidate-testimonials-success-description">
                  Your story has been submitted for review. It will appear in
                  Testimonials only if approved.
                </p>
                <button onClick={shareAnotherStory} type="button">
                  Share another story
                </button>
              </div>
            </dialog>
          )}
          <div className="candidate-testimonials-stories">
            {testimonials.length ? (
              <div
                className="candidate-testimonials-grid"
                data-layout={testimonials.length > 2 ? 'bento' : 'compact'}
              >
                {testimonials.map((item, index) => (
                  <article
                    className="candidate-testimonials-card"
                    key={item.id}
                    style={
                      {
                        '--testimonial-index': Math.min(index, 8),
                      } as React.CSSProperties
                    }
                  >
                    <div className="candidate-testimonials-card__top">
                      <span
                        aria-hidden="true"
                        className="candidate-testimonials-card__mark"
                      >
                        “
                      </span>
                      {item.rating !== null && (
                        <PeekRating
                          ariaLabel={`${item.rating} out of 5 stars`}
                          className="candidate-testimonials-card__rating"
                          readOnly
                          showTip={false}
                          size={19}
                          value={item.rating}
                        />
                      )}
                    </div>
                    <blockquote>{item.quote}</blockquote>
                    <div className="candidate-testimonials-card__author">
                      <div>
                        <strong>{item.author_name}</strong>
                        <p>
                          {item.role_title ||
                            (item.relationship === 'past'
                              ? 'Past candidate'
                              : 'Prospective candidate')}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="candidate-testimonials-empty">
                <span aria-hidden="true">✦</span>
                <h2>Candidate stories are coming soon.</h2>
                <p>
                  Approved testimonials will appear here. You can be among the
                  first to share your experience.
                </p>
                <button onClick={openModal} type="button">
                  Share your story
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
