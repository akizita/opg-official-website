import Image from 'next/image'
import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'

import { signOutAction } from '@/app/admin/actions'
import { AdminNavigation } from '@/components/admin/admin-navigation'
import { AdminSidebarToggle } from '@/components/admin/admin-sidebar-toggle'
import type { AdminProfile } from '@/lib/auth/admin-session'

const ADMIN_LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/logo-1789740351319.png'

type AdminShellProps = {
  children: ReactNode
  profile: AdminProfile
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10M14 8l4 4-4 4M9 12h9" />
    </svg>
  )
}

export function AdminShell({ children, profile }: AdminShellProps) {
  const nameParts = profile.displayName.trim().split(/\s+/).filter(Boolean)
  const initials = (
    nameParts.length === 1
      ? nameParts[0].slice(0, 2).split('')
      : nameParts.map((part) => part[0])
  )
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__header">
          <Link
            aria-label="OutPro Global admin overview"
            className="admin-shell__brand"
            href="/admin"
          >
            <Image
              alt=""
              aria-hidden="true"
              className="admin-shell__brand-logo"
              height={150}
              priority
              src={ADMIN_LOGO_URL}
              width={150}
            />
            <span className="admin-shell__brand-copy">
              <strong>OutPro Global</strong>
              <small>Website CMS</small>
            </span>
          </Link>
          <AdminSidebarToggle />
        </div>

        <Suspense fallback={null}>
          <AdminNavigation roleKey={profile.roleKey} />
        </Suspense>

        <div className="admin-shell__account">
          <span className="admin-shell__avatar" aria-hidden="true">
            {initials || 'OPG'}
          </span>
          <span className="admin-shell__account-copy">
            <strong>{profile.displayName}</strong>
            <small>{profile.roleDisplayName}</small>
          </span>
          <form action={signOutAction}>
            <button
              className="admin-shell__sign-out"
              type="submit"
              aria-label="Sign out of the OPG administration workspace"
              data-tooltip="Sign out"
              title="Sign out"
            >
              <SignOutIcon />
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-shell__main">
        <div className="admin-shell__workspace">{children}</div>
      </div>
    </div>
  )
}
