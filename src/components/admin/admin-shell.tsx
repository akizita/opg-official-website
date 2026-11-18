import Image from 'next/image'
import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'

import { AdminNavigation } from '@/components/admin/admin-navigation'
import { AdminPageTransition } from '@/components/admin/admin-page-transition'
import { AdminProfileMenu } from '@/components/admin/admin-profile-menu'
import type { AdminProfile } from '@/lib/auth/admin-session'
import './admin-shell.css'

const ADMIN_LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/logo-1789740351319.png'

type AdminShellProps = {
  children: ReactNode
  profile: AdminProfile
}

export function AdminShell({ children, profile }: AdminShellProps) {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__header">
          <Link
            aria-label="OutPro Global admin overview"
            className="admin-shell__brand"
            data-label="OutPro Global"
            href="/admin"
          >
            <Image
              alt="OutPro Global"
              aria-hidden="true"
              className="admin-shell__brand-logo"
              height={150}
              priority
              src={ADMIN_LOGO_URL}
              width={150}
            />
          </Link>
        </div>

        <Suspense fallback={null}>
          <AdminNavigation roleKey={profile.roleKey} />
        </Suspense>

        <AdminProfileMenu profile={profile} />
      </aside>

      <div className="admin-shell__main">
        <Suspense fallback={<div className="admin-shell__workspace">{children}</div>}>
          <AdminPageTransition className="admin-shell__workspace">
            {children}
          </AdminPageTransition>
        </Suspense>
      </div>
    </div>
  )
}
