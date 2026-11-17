import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminSignOutButton } from '@/components/admin/admin-sign-out-button'
import {
  AdminAnalyticsDashboard,
  type AnalyticsPeriod,
} from '@/components/admin/admin-analytics-dashboard'
import { Card } from '@/components/ui/card'
import { isAdminMfaRequired } from '@/lib/auth/config'
import { requireAdminSession } from '@/lib/auth/admin-session'
import {
  canViewContent,
  canViewInquiries,
  canViewSubscribers,
} from '@/lib/auth/permissions'

export const metadata: Metadata = {
  title: 'Administration',
}

type AdminPageProps = {
  searchParams: Promise<{ period?: string }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { profile } = await requireAdminSession({ requireAal2: true })
  const mfaRequired = isAdminMfaRequired()
  const { period: requestedPeriod } = await searchParams
  const period: AnalyticsPeriod = requestedPeriod === 'week' ? 'week' : 'month'

  const hasContentAccess = canViewContent(profile.roleKey)
  const hasInquiryAccess = canViewInquiries(profile.roleKey)
  const hasSubscriberAccess = canViewSubscribers(profile.roleKey)

  if (process.env.ADMIN_LEGACY_DASHBOARD !== 'true') {
    return <AdminAnalyticsDashboard period={period} profile={profile} />
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Secure workspace</p>
            <h1>Welcome, {profile.displayName}</h1>
            <p>
              Signed in as {profile.email} · {profile.roleDisplayName}
            </p>
          </div>
          <AdminSignOutButton variant="button" />
        </div>
        <div className="admin-grid">
          <Card eyebrow="Management" title="Articles, Testimonials & Clients">
            <p>
              Manage public editorial articles, client partnerships, and candidate testimonials.
            </p>
            {hasContentAccess ? (
              <>
                <div className="admin-card__row">
                  <div>
                    <strong>Articles & Insights</strong>
                    <p className="field-hint">
                      Publications, authors, and reading taxonomy
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/articles"
                  >
                    Manage →
                  </Link>
                </div>

                <div className="admin-card__row">
                  <div>
                    <strong>Testimonials</strong>
                    <p className="field-hint">
                      Candidate and talent endorsements
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/testimonials"
                  >
                    Manage →
                  </Link>
                </div>

                <div className="admin-card__row">
                  <div>
                    <strong>Clients & Partners</strong>
                    <p className="field-hint">
                      Client organizations and collaboration badges
                    </p>
                  </div>
                  <Link
                    className="button-link button-link--secondary"
                    href="/admin/clients"
                  >
                    Manage →
                  </Link>
                </div>
              </>
            ) : (
              <p className="form-help">
                Your role does not have content editing permissions.
              </p>
            )}
          </Card>

          <Card
            eyebrow="Communications & Audience"
            title="Contacts & Subscribers"
          >
            <p>
              Inbound contact requests, triage queues, response statuses, and
              verified newsletter subscribers.
            </p>
            {hasInquiryAccess || hasSubscriberAccess ? (
              <>
                {hasInquiryAccess && (
                  <div className="admin-card__row">
                    <div>
                      <strong>Contacts Inbox</strong>
                      <p className="field-hint">
                        Client and candidate submissions
                      </p>
                    </div>
                    <Link
                      className="button-link button-link--secondary"
                      href="/admin/inquiries"
                    >
                      View Inbox →
                    </Link>
                  </div>
                )}

                {hasSubscriberAccess && (
                  <div className="admin-card__row">
                    <div>
                      <strong>Newsletter Subscribers</strong>
                      <p className="field-hint">
                        Double opt-in verified audience registry
                      </p>
                    </div>
                    <Link
                      className="button-link button-link--secondary"
                      href="/admin/subscribers"
                    >
                      View List →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="form-help">
                Your role does not have communications management permissions.
              </p>
            )}
          </Card>

          <Card eyebrow="Security & Access" title="Protected Workspace">
            <p>
              Your account, assigned administrator role (
              {profile.roleDisplayName}
              ), and active status have been validated server-side.
              {mfaRequired
                ? ' AAL2 multi-factor authentication is active.'
                : ' Authenticator verification is temporarily bypassed in development mode.'}
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
