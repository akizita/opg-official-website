import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Manage Careers & Openings | OPG Admin',
}

type JobRow = {
  id: string
  slug: string
  title: string
  department?: { name: string } | null
  employment_type: string
  location: string
  is_remote: boolean
  status: 'draft' | 'published' | 'archived'
  application_url: string
  created_at: string
}

export default async function AdminCareersPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have permission to view job openings.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('job_openings')
    .select(`
      id,
      slug,
      title,
      department:departments(name),
      employment_type,
      location,
      is_remote,
      status,
      application_url,
      created_at
    `)
    .order('created_at', { ascending: false })

  const jobList = (jobs as unknown as JobRow[]) || []

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
            <h1>Job Openings & Careers</h1>
            <p>
              Manage active positions, external ATS application mappings, and employment profiles.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        <div className="admin-services-list" style={{ marginTop: '2rem' }}>
          {jobList.length > 0 ? (
            <div className="card-grid">
              {jobList.map((job) => (
                <Card
                  eyebrow={`${job.department?.name || 'General'} · ${job.employment_type} · ${job.is_remote ? 'Remote' : job.location}`}
                  key={job.id}
                  title={job.title}
                >
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                    Application ATS: {job.application_url}
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
                    <StatusBadge status={job.status} />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {job.status === 'published' && (
                        <Link
                          className="button-link button-link--secondary"
                          href={`/careers/${job.slug}`}
                          target="_blank"
                        >
                          View Live ↗
                        </Link>
                      )}
                      <a
                        className="button-link button-link--secondary"
                        href={job.application_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        ATS Link ↗
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              description="No job openings have been configured yet."
              title="No Job Openings Found"
            />
          )}
        </div>
      </div>
    </section>
  )
}

