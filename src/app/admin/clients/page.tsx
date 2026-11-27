import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent } from '@/lib/auth/permissions'
import { getAllClients } from '@/lib/content/clients'

import { ClientsManager } from './clients-manager'

export const metadata: Metadata = {
  title: 'Clients Management | OPG Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page">
        <div className="container">
          <p className="form-help">
            Your current role ({profile.roleDisplayName}) does not have
            permission to manage client partners.
          </p>
          <Link className="button button--secondary" href="/admin">
            ← Return to Dashboard
          </Link>
        </div>
      </section>
    )
  }

  const clients = await getAllClients()

  return <ClientsManager clients={clients} roleKey={profile.roleKey} />
}
