'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function TestimonialRetryButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      className="candidate-review-button candidate-review-button--approve"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      type="button"
    >
      {pending ? 'Retrying…' : 'Retry'}
    </button>
  )
}
