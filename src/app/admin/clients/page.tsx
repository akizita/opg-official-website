import type { Metadata } from 'next'
import Link from 'next/link'

import { ClientsManager } from '@/app/admin/clients/clients-manager'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canArchive, canPublish, canViewContent } from '@/lib/auth/permissions'
import { getAllClients } from '@/lib/content/clients'

export const metadata: Metadata = {
  title: 'Client Partners Management | OPG Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have permission to view client partners.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const clients = await getAllClients()

  return (
    <section className="admin-page">
      <div className="container">
        <ClientsManager
          canDelete={canArchive(profile.roleKey)}
          canManage={canPublish(profile.roleKey)}
          clients={clients}
        />
      </div>
    </section>
  )
}
