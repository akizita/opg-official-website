'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
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
