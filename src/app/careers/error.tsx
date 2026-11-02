'use client'

import { useEffect } from 'react'

export default function CareersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Careers route failed to load', {
      digest: error.digest,
      message: error.message,
    })
  }, [error])

  return (
    <main id="main-content" className="careers-error container">
      <p className="careers-eyebrow">Careers at OPG</p>
      <h1>Our live roles are temporarily unavailable here.</h1>
      <p>
        Our recruitment feed could not be reached. Try again, or contact our
        recruitment team if the issue continues.
      </p>
      <div className="button-row">
        <a
          className="button-link button-link--primary"
          href="mailto:recruitment@opglobal.com.hk"
        >
          Contact recruitment
        </a>
        <button
          className="button button--secondary"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
