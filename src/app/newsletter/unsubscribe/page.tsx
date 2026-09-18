import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { unsubscribeFromNewsletter } from '@/lib/content/newsletter'

export const metadata: Metadata = {
  title: 'Unsubscribe from Newsletter | Outsourced Pro Global',
  robots: {
    index: false,
    follow: false,
  },
}

type UnsubscribePageProps = {
  searchParams: Promise<{
    token?: string
    email?: string
  }>
}

export default async function NewsletterUnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token, email } = await searchParams

  let result: { success: boolean; message: string }

  if (!email) {
    result = {
      success: false,
      message: 'Email address is required to unsubscribe.',
    }
  } else {
    result = await unsubscribeFromNewsletter(token || '', email)
  }

  return (
    <main className="container status-page">
      <div style={{ maxWidth: '540px', margin: '4rem auto', width: '100%' }}>
        <Card
          eyebrow={result.success ? 'Unsubscribed' : 'Unsubscribe Issue'}
          title={result.success ? 'Subscription Updated' : 'Request Incomplete'}
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
            <Link className="button button--secondary" href="/">
              Return to Homepage
            </Link>
          </div>
        </Card>
      </div>
    </main>
  )
}

