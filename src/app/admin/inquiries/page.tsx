import type { Metadata } from 'next'
import Link from 'next/link'

import { InquiriesInbox, type InquiryItem } from '@/app/admin/inquiries/inquiries-inbox'
import './inquiries.css'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canManageInquiries, canViewInquiries } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Inquiries Inbox | OPG Admin',
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
            Your current role ({profile.roleDisplayName}) does not have
            permission to view inquiries.
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
  const { data: inquiries, error: inquiriesError } = await supabase
    .from('contact_inquiries')
    .select(
      'id, full_name, email, subject, message, status, submitted_at, retention_expires_at, ip_hash',
    )
    .order('submitted_at', { ascending: false })

  const inquiryList = (inquiries as InquiryItem[]) || []
  const canManage = canManageInquiries(profile.roleKey)

  return (
    <section className="admin-page">
      <div className="container">
        {inquiriesError ? (
          <div>
            <div className="inquiries-header-content">
              <h1 className="inquiries-header-title">Inquiries Inbox</h1>
              <p className="inquiries-header-subtitle">
                Review and triage incoming inquiries from institutional clients and
                talent candidates. Track response times, update triage statuses,
                and coordinate direct follow-ups.
              </p>
            </div>
            <div
              className="alert-banner alert-banner--error"
              role="alert"
              style={{ marginTop: '1.5rem' }}
            >
              <p>Inquiries could not be loaded. Please try again.</p>
              <Link className="button-link" href="/admin/inquiries">
                Retry loading inquiries
              </Link>
            </div>
          </div>
        ) : (
          <InquiriesInbox
            canManage={canManage}
            initialInquiries={inquiryList}
            initialStatus={activeStatus}
          />
        )}
      </div>
    </section>
  )
}
