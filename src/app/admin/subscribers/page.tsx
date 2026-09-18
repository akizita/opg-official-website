import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewSubscribers } from '@/lib/auth/permissions'
import type { NewsletterSubscription } from '@/lib/content/newsletter'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Newsletter Subscribers | OPG Admin',
}

export default async function AdminSubscribersPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewSubscribers(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have permission to view subscribers.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const supabase = await createClient()
  const { data: subscribers } = await supabase
    .from('newsletter_subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  const subscriberList = (subscribers as NewsletterSubscription[]) || []

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Subscribers</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Audience & Distribution</p>
            <h1>Newsletter Subscribers</h1>
            <p>
              Audience registry for OPG Insights with verified consent provenance and double opt-in statuses.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="admin-services-list" style={{ marginTop: '2rem' }}>
          {subscriberList.length > 0 ? (
            <div className="card-grid">
              {subscriberList.map((sub) => {
                const createdDate = new Date(sub.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <Card
                    eyebrow={`Source: ${sub.consent_source} · v${sub.consent_version}`}
                    key={sub.id}
                    title={sub.email_normalized}
                  >
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                      Subscribed on {createdDate}
                      {sub.confirmed_at && (
                        <span>
                          {' '}
                          · Confirmed {new Date(sub.confirmed_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <StatusBadge
                        status={
                          sub.status === 'confirmed'
                            ? 'published'
                            : sub.status === 'pending_confirmation'
                              ? 'draft'
                              : 'archived'
                        }
                      />
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              description="No subscribers have registered yet."
              title="No Subscribers Found"
            />
          )}
        </div>
      </div>
    </section>
  )
}

