'use client'

import { useEffect } from 'react'

import { logger } from '@/lib/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Unhandled global application error', {
      digest: error.digest,
      message: error.message,
      name: error.name,
    })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: '2rem',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          background: '#f4f8fa',
          color: '#102a43',
        }}
      >
        <main
          style={{
            maxWidth: '32rem',
            padding: '2rem',
            background: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 1rem 3rem rgba(16, 42, 67, 0.09)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontWeight: 800,
              fontSize: '0.76rem',
              color: '#0b6e69',
              margin: '0 0 0.5rem',
            }}
          >
            Application Error
          </p>
          <h1 style={{ margin: '0 0 1rem', fontSize: '1.75rem' }}>
            Something went wrong
          </h1>
          <p
            style={{ color: '#334e68', lineHeight: 1.5, margin: '0 0 1.5rem' }}
          >
            A critical application error occurred. You may try reloading the
            application.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#0b6e69',
              color: '#ffffff',
              border: 0,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
