'use client'

import { useEffect } from 'react'

import { logger } from '@/lib/logger'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Page-level error caught by error boundary', {
      digest: error.digest,
      message: error.message,
      name: error.name,
    })
  }, [error])

  return (
    <div className="container status-page">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again. If the problem continues, come back a little later.
      </p>
      <button
        className="button-link button-link--primary"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}
