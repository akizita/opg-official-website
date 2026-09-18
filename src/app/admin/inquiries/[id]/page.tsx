import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InquiryStatusControl } from '@/app/admin/inquiries/[id]/inquiry-status-control'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewInquiries } from '@/lib/auth/permissions'
import type { ContactInquiry } from '@/lib/content/inquiries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Inquiry Detail | OPG Admin',
}

type InquiryDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function AdminInquiryDetailPage({
  params,
}: InquiryDetailPageProps) {
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

  const { id } = await params
  const supabase = await createClient()

  const { data: inquiry } = await supabase
    .from('contact_inquiries')
    .select('*')
    .eq('id', id)
    .maybeSingle<ContactInquiry>()

  if (!inquiry) {
    notFound()
  }

  const refId = `OPG-${inquiry.id.slice(0, 8).toUpperCase()}`
  const submittedDate = new Date(inquiry.submitted_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <section className="admin-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/admin/inquiries">Inquiries</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{refId}</li>
          </ol>
        </nav>

        <div className="admin-heading">
          <div>
            <p className="eyebrow">Reference: {refId}</p>
            <h1>{inquiry.subject}</h1>
            <p>
              Submitted on {submittedDate} by {inquiry.full_name}
            </p>
          </div>
          <div>
            <Link className="button button--secondary" href="/admin/inquiries">
              ← Return to Inbox
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: '800px', marginTop: '2rem' }}>
          <Card eyebrow="Inquiry Details" title="Submission Content">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                  Sender Name
                </strong>
                <p>{inquiry.full_name}</p>
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                  Email Address
                </strong>
                <p>
                  <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                </p>
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                  Current Status
                </strong>
                <div style={{ marginTop: '0.25rem' }}>
                  <StatusBadge
                    status={
                      inquiry.status === 'new'
                        ? 'draft'
                        : inquiry.status === 'read'
                          ? 'in_review'
                          : inquiry.status === 'replied'
                            ? 'published'
                            : 'archived'
                    }
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>
                Message Body
              </strong>
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                }}
              >
                {inquiry.message}
              </div>
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-subtle)',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1rem',
              }}
            >
              <p>
                <strong>Security Audit & Retention:</strong> Client IP Hash: <code>{inquiry.ip_hash}</code> ·
                Data Retention Expiry: <code>{new Date(inquiry.retention_expires_at).toLocaleDateString()}</code>
              </p>
            </div>

            <InquiryStatusControl
              currentStatus={inquiry.status === 'spam_suspected' ? 'archived' : inquiry.status}
              inquiryId={inquiry.id}
            />
          </Card>
        </div>
      </div>
    </section>
  )
}
