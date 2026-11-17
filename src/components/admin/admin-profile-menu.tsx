'use client'

import { useEffect, useRef, useState } from 'react'

import { signOutAction } from '@/app/admin/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconChevron,
  OpgIconSignOut,
} from '@/components/icons/opg-icons'
import type { AdminProfile } from '@/lib/auth/admin-session'

export function AdminProfileMenu({ profile }: { profile: AdminProfile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const nameParts = profile.displayName.trim().split(/\s+/).filter(Boolean)
  const initials = (
    nameParts.length === 1
      ? nameParts[0].slice(0, 2).split('')
      : nameParts.map((part) => part[0])
  )
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="admin-profile-menu" ref={rootRef}>
      {/* Profile Trigger Button */}
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Admin account options for ${profile.displayName}`}
        className="admin-profile-menu__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <span aria-hidden="true" className="admin-shell__avatar">
          {initials || 'OPG'}
        </span>
        <span className="admin-shell__account-copy">
          <strong>{profile.displayName}</strong>
          <small>{profile.roleDisplayName}</small>
        </span>
        <span
          aria-hidden="true"
          className={`admin-profile-menu__chevron ${isOpen ? 'admin-profile-menu__chevron--open' : ''}`}
        >
          <OpgIconChevron size={14} />
        </span>
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div
          className="admin-profile-menu__popover"
          role="menu"
          aria-label="Account menu"
        >
          <div className="admin-profile-menu__header">
            <span aria-hidden="true" className="admin-profile-menu__popover-avatar">
              {initials || 'OPG'}
            </span>
            <div className="admin-profile-menu__details">
              <span className="admin-profile-menu__name">{profile.displayName}</span>
              <span className="admin-profile-menu__email">{profile.email}</span>
              <span className="admin-profile-menu__badge">{profile.roleDisplayName}</span>
            </div>
          </div>

          <div className="admin-profile-menu__divider" />

          <button
            className="admin-profile-menu__signout-btn"
            onClick={() => {
              setIsOpen(false)
              setShowConfirmSignOut(true)
            }}
            role="menuitem"
            type="button"
          >
            <OpgIconSignOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Sign Out Confirmation Dialog */}
      <AdminConfirmDialog
        cancelText="Stay signed in"
        confirmText="Sign Out"
        description="Are you sure you want to sign out of the OutPro Global Administration workspace? Any unsaved changes in active forms will be lost."
        formAction={signOutAction}
        icon={<OpgIconSignOut size={24} />}
        isOpen={showConfirmSignOut}
        onClose={() => setShowConfirmSignOut(false)}
        title="Confirm Sign Out"
        tone="warning"
      />
    </div>
  )
}
