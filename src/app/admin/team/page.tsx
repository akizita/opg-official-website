import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { getAdminTeamData } from '@/lib/content/team'

import { TeamManager } from './team-manager'

export const metadata: Metadata = {
  title: 'Team Management | OPG Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to manage the team roster.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const { departments, members } = await getAdminTeamData()

  return (
    <TeamManager
      departments={departments}
      members={members}
      roleKey={profile.roleKey}
    />
  )
}
