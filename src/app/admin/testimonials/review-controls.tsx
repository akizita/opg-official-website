'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  reviewCandidateTestimonialAction,
  type TestimonialReviewDecision,
} from '@/app/admin/testimonials/actions'

export function TestimonialReviewControls({
  id,
  onComplete,
}: {
  id: string
  onComplete?: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmReject, setConfirmReject] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  function review(decision: TestimonialReviewDecision) {
    setError('')
    startTransition(async () => {
      try {
        const result = await reviewCandidateTestimonialAction(id, decision)
        if (!result.success) {
          setError(result.error ?? 'The review could not be saved.')
          return
        }
        setCompleted(true)
        onComplete?.()
        router.refresh()
      } catch {
        setError('The review could not be saved. Try again.')
      }
    })
  }

  if (completed) {
    return (
      <p className="candidate-review-controls__success" role="status">
        Review saved.
      </p>
    )
  }

  return (
    <div className="candidate-review-controls">
      {confirmReject ? (
        <div className="candidate-review-controls__confirmation">
          <span>Reject this story?</span>
          <button
            className="candidate-review-button candidate-review-button--reject"
            disabled={pending}
            onClick={() => review('rejected')}
            type="button"
          >
            {pending ? 'Saving…' : 'Confirm rejection'}
          </button>
          <button
            className="candidate-review-button candidate-review-button--neutral"
            disabled={pending}
            onClick={() => setConfirmReject(false)}
            type="button"
          >
            Keep pending
          </button>
        </div>
      ) : (
        <>
          <button
            className="candidate-review-button candidate-review-button--approve"
            disabled={pending}
            onClick={() => review('approved')}
            type="button"
          >
            {pending ? 'Saving…' : 'Approve for website'}
          </button>
          <button
            className="candidate-review-button candidate-review-button--neutral"
            disabled={pending}
            onClick={() => setConfirmReject(true)}
            type="button"
          >
            Reject
          </button>
        </>
      )}
      {error && (
        <p className="candidate-review-controls__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
