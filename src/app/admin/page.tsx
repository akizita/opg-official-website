import type { Metadata } from 'next'
import Link from 'next/link'

import { signOutAction } from '@/app/admin/actions'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Administration',
}

export default async function AdminPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  const supabase = await createClient()
  const { data: mvDoc } = await supabase
    .from('page_documents')
    .select('status, version, updated_at')
    .eq('slug', 'mission-and-vision')
    .maybeSingle<PageDocument>()

  const hasContentAccess = canViewContent(profile.roleKey)

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
          <form action={signOutAction}>
            <button className="button button--secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <div className="admin-grid">
          <Card eyebrow="Content Workspace" title="Pages & Documents">
            <p>
              Managed institutional pages and content declarations for the
              official website.
            </p>
            {hasContentAccess ? (
              <div className="admin-card__row">
                <div>
                  <strong>Mission & Vision</strong>
                  <div className="admin-card__meta">
                    <StatusBadge status={mvDoc?.status ?? 'draft'} />
                    <span>v{mvDoc?.version ?? 1}</span>
                  </div>
                </div>
                <Link
                  className="button-link button-link--secondary"
                  href="/admin/pages/mission-and-vision"
                >
                  Edit Page →
                </Link>
              </div>
            ) : (
              <p className="form-help">
                Your role does not have content editing permissions.
              </p>
            )}
          </Card>
          <Card eyebrow="Authentication" title="Protected and ready">
            <p>
              Your account, assigned administrator role (
              {profile.roleDisplayName}
              ), active status, and authenticator verification have all been
              validated server-side.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
