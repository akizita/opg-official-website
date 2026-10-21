import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSession } from '@/lib/auth/admin-session'
import { isAdminMfaRequired } from '@/lib/auth/config'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getAdminSession()
  const canEnterWorkspace =
    session && (!isAdminMfaRequired() || session.currentLevel === 'aal2')

  if (!canEnterWorkspace) return children

  return <AdminShell profile={session.profile}>{children}</AdminShell>
}
