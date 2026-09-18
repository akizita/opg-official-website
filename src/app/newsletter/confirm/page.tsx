import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { confirmNewsletterSubscription } from '@/lib/content/newsletter'

export const metadata: Metadata = {
  title: 'Confirm Newsletter Subscription | Outsourced Pro Global',
  robots: {
    index: false,
    follow: false,
  },
}

type ConfirmPageProps = {
  searchParams: Promise<{
    token?: string
    email?: string
  }>
}

export default async function NewsletterConfirmPage({
  searchParams,
}: ConfirmPageProps) {
  const { token, email } = await searchParams

  let result: { success: boolean; message: string }

  if (!token || !email) {
    result = {
      success: false,
      message: 'Invalid or missing confirmation credentials.',
    }
  } else {
    result = await confirmNewsletterSubscription(token, email)
  }

  return (
    <main className="container status-page">
      <div style={{ maxWidth: '540px', margin: '4rem auto', width: '100%' }}>
        <Card
          eyebrow={result.success ? 'Subscription Confirmed' : 'Confirmation Issue'}
          title={result.success ? 'Welcome to OPG Insights' : 'Verification Required'}
        >
          <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>{result.message}</p>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {result.success ? (
              <>
                <Link className="button button--primary" href="/articles">
                  Browse Published Articles →
                </Link>
                <Link className="button button--secondary" href="/">
                  Return to Home
                </Link>
              </>
            ) : (
              <Link className="button button--secondary" href="/contact">
                Contact Support
              </Link>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}

