import type { Metadata } from 'next'

import { signOutAction } from '@/app/admin/actions'
import { Card } from '@/components/ui/card'
import { requireAdminSession } from '@/lib/auth/admin-session'

export const metadata: Metadata = {
  title: 'Administration',
}

export default async function AdminPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

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
          <Card eyebrow="Authentication" title="Protected and ready">
            <p>
              Your account, assigned administrator role, active status, and
              authenticator verification have all been validated server-side.
            </p>
          </Card>
          <Card eyebrow="Next build slice" title="Content workspace">
            <p>
              Article drafting, review, publishing, and role-aware navigation
              will be added in the next vertical slice.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
