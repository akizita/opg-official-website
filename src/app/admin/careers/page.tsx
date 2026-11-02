import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { Notice } from '@/components/ui/notice'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { getCareersFeed, JazzHrApiError } from '@/lib/jazzhr/client'
import type { CareersFeed } from '@/lib/jazzhr/types'

export const metadata: Metadata = {
  title: 'Careers Integration | OPG Admin',
}

export default async function AdminCareersPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to view job openings.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  let feed: CareersFeed | null = null
  let integrationError: string | null = null
  try {
    feed = await getCareersFeed()
  } catch (error) {
    integrationError =
      error instanceof JazzHrApiError
        ? error.message
        : 'The JazzHR integration could not be checked.'
  }

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Careers</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Talent Operations</p>
            <h1>JazzHR Careers Integration</h1>
            <p>
              JazzHR is the source of truth for public roles and candidate
              applications. This workspace is read-only.
            </p>
          </div>
          <div className="button-row">
            <Link className="button button--secondary" href="/admin">
              ← Dashboard
            </Link>
          </div>
        </div>

        {integrationError ? (
          <Notice title="JazzHR check failed" variant="error">
            {integrationError} Verify the server-side API key and JazzHR service
            status, then reload this page.
          </Notice>
        ) : !feed?.configured ? (
          <Notice title="JazzHR API key is not configured" variant="warning">
            Add `JAZZHR_API_KEY` to the server environment and restart or
            redeploy the application. Never expose it as a `NEXT_PUBLIC_`
            variable.
          </Notice>
        ) : (
          <div className="admin-careers-status" role="status">
            <div>
              <span className="admin-careers-status__dot" />
              <strong>Connected</strong>
            </div>
            <p>
              {feed.jobs.length} public open{' '}
              {feed.jobs.length === 1 ? 'role' : 'roles'} received from JazzHR.
            </p>
          </div>
        )}

        {feed?.configured && feed.jobs.length > 0 ? (
          <div className="admin-services-list" style={{ marginTop: '2rem' }}>
            <div className="card-grid">
              {feed.jobs.map((job) => (
                <Card
                  eyebrow={`${job.department || 'General'} · ${job.employmentTypeLabel} · ${job.location}`}
                  key={job.id}
                  title={job.title}
                >
                  <div className="admin-careers-card__actions">
                    <Link
                      className="button-link button-link--secondary"
                      href={`/careers/${job.slug}`}
                      target="_blank"
                    >
                      View website ↗
                    </Link>
                    <Link
                      className="button-link button-link--secondary"
                      href={job.applyPath}
                      target="_blank"
                    >
                      Test application ↗
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
