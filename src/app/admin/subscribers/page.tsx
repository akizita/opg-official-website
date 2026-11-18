import type { Metadata } from 'next'
import Link from 'next/link'

import { type SubscriberItem } from '@/app/admin/subscribers/subscriber-utils'
import { SubscribersManager } from '@/app/admin/subscribers/subscribers-manager'
import styles from '@/app/admin/subscribers/subscribers.module.css'
import { requireAdminSession } from '@/lib/auth/admin-session'
import {
  canManageSubscribers,
  canViewSubscribers,
} from '@/lib/auth/permissions'
import { resolveAuthProfilesByEmail } from '@/lib/auth/user-avatars'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Newsletter Subscribers | OPG Admin',
}

export const dynamic = 'force-dynamic'

type AdminSubscribersPageProps = {
  searchParams: Promise<{
    status?: string
  }>
}

export default async function AdminSubscribersPage({
  searchParams,
}: AdminSubscribersPageProps) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewSubscribers(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to view subscribers.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const { status } = await searchParams
  const supabase = await createClient()
  const { data: subscribers, error: subscribersError } = await supabase
    .from('newsletter_subscriptions')
    .select(
      'id, email_normalized, status, confirmation_sent_at, confirmed_at, unsubscribed_at, consent_version, consent_source, created_at',
    )
    .order('created_at', { ascending: false })

  const rawSubscribers = (subscribers as SubscriberItem[]) || []
  const authProfiles = await resolveAuthProfilesByEmail(
    rawSubscribers.map((sub) => sub.email_normalized),
  )

  const subscriberList: SubscriberItem[] = rawSubscribers.map((sub) => {
    const matched = authProfiles.get(sub.email_normalized.trim().toLowerCase())
    return {
      ...sub,
      avatar_url: matched?.avatarUrl ?? null,
      display_name: matched?.displayName ?? null,
    }
  })

  return (
    <section className="admin-page">
      <div className="container">
        {subscribersError ? (
          <div className={styles.pageWrap}>
            <header className={styles.headerSection}>
              <h1 className={styles.headerTitle}>Newsletter Subscribers</h1>
              <p className={styles.headerSubtitle}>
                Manage OPG Insights audience subscriptions, double opt-in
                verification statuses, consent provenance, and mailing list
                exports.
              </p>
            </header>
            <div className="alert-banner alert-banner--error" role="alert">
              <p>Subscribers could not be loaded. Please try again.</p>
              <Link className="button-link" href="/admin/subscribers">
                Retry loading subscribers
              </Link>
            </div>
          </div>
        ) : (
          <SubscribersManager
            canManage={canManageSubscribers(profile.roleKey)}
            initialStatus={status || 'all'}
            initialSubscribers={subscriberList}
          />
        )}
      </div>
    </section>
  )
}
