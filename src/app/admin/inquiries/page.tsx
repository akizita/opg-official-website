import type { Metadata } from 'next'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewInquiries } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Inquiries Inbox | OPG Admin',
}

type InquiryRow = {
  id: string
  full_name: string
  email: string
  subject: string
  status: 'new' | 'read' | 'replied' | 'archived' | 'spam_suspected'
  submitted_at: string
}

type InquiriesPageProps = {
  searchParams: Promise<{
    status?: string
  }>
}

export default async function AdminInquiriesPage({
  searchParams,
}: InquiriesPageProps) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewInquiries(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have permission to view inquiries.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const { status } = await searchParams
  const activeStatus = status || 'all'

  const supabase = await createClient()
  let query = supabase
    .from('contact_inquiries')
    .select('id, full_name, email, subject, status, submitted_at')
    .order('submitted_at', { ascending: false })

  if (activeStatus && activeStatus !== 'all') {
    query = query.eq('status', activeStatus)
  }

  const { data: inquiries } = await query
  const inquiryList = (inquiries as InquiryRow[]) || []

  const statusFilters = [
    { label: 'All Inquiries', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Read', value: 'read' },
    { label: 'Replied', value: 'replied' },
    { label: 'Archived', value: 'archived' },
  ]

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Inquiries</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Communications</p>
            <h1>Inquiries Inbox</h1>
            <p>
              Review and manage incoming submissions from institutional clients and talent candidates.
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin">
              ← Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="articles-filter-nav" style={{ marginTop: '1.5rem' }}>
          {statusFilters.map((filter) => {
            const isSelected = activeStatus === filter.value
            return (
              <Link
                className={`articles-filter-chip ${
                  isSelected ? 'articles-filter-chip--active' : ''
                }`}
                href={
                  filter.value === 'all'
                    ? '/admin/inquiries'
                    : `/admin/inquiries?status=${filter.value}`
                }
                key={filter.value}
              >
                {filter.label}
              </Link>
            )
          })}
        </div>

        <div style={{ marginTop: '2rem' }}>
          {inquiryList.length > 0 ? (
            <div className="card-grid">
              {inquiryList.map((inq) => {
                const refId = `OPG-${inq.id.slice(0, 8).toUpperCase()}`
                const submittedDate = new Date(inq.submitted_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <Card
                    eyebrow={`${refId} · ${submittedDate}`}
                    key={inq.id}
                    title={inq.subject}
                  >
                    <p style={{ fontWeight: 500 }}>
                      From: {inq.full_name} ({inq.email})
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--color-border)',
                      }}
                    >
                      <StatusBadge
                        status={
                          inq.status === 'new'
                            ? 'draft'
                            : inq.status === 'read'
                              ? 'in_review'
                              : inq.status === 'replied'
                                ? 'published'
                                : 'archived'
                        }
                      />
                      <Link
                        className="button-link button-link--secondary"
                        href={`/admin/inquiries/${inq.id}`}
                      >
                        View Details →
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              description="No inquiries match the selected filter."
              title="Inbox Empty"
            />
          )}
        </div>
      </div>
    </section>
  )
}
