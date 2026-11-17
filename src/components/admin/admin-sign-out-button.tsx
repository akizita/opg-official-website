'use client'

import { useState } from 'react'

import { signOutAction } from '@/app/admin/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import { OpgIconSignOut } from '@/components/icons/opg-icons'

export function AdminSignOutButton({
  className,
  variant = 'icon',
}: {
  className?: string
  variant?: 'icon' | 'button'
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {variant === 'icon' ? (
        <button
          aria-label="Sign out of the OPG administration workspace"
          className={className || 'admin-shell__sign-out'}
          data-tooltip="Sign out"
          onClick={() => setIsOpen(true)}
          title="Sign out"
          type="button"
        >
          <OpgIconSignOut size={18} />
        </button>
      ) : (
        <button
          className={className || 'button button--secondary'}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Sign out
        </button>
      )}

      <AdminConfirmDialog
        cancelText="Stay signed in"
        confirmText="Sign Out"
        description="Are you sure you want to sign out of the OutPro Global Administration workspace? Any unsaved changes in active forms will be lost."
        formAction={signOutAction}
        icon={<OpgIconSignOut size={24} />}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Sign Out"
        tone="warning"
      />
    </>
  )
}
