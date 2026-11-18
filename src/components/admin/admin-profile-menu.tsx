'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from 'react'

import { signOutAction, uploadAdminAvatarAction } from '@/app/admin/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconChevron,
  OpgIconSignOut,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import type { AdminProfile } from '@/lib/auth/admin-session'

function AdminAccountAvatar({
  avatarUrl,
  className,
  email,
  initials,
  size,
}: {
  avatarUrl?: string | null
  className: string
  email: string
  initials: string
  size: number
}) {
  const candidates = useMemo(() => {
    const list: string[] = []
    const trimmedUrl = avatarUrl?.trim()
    if (trimmedUrl) {
      list.push(trimmedUrl)
    }
    const cleanEmail = email.trim().toLowerCase()
    if (cleanEmail && cleanEmail.includes('@')) {
      const gravatarUrl = `https://unavatar.io/gravatar/${encodeURIComponent(cleanEmail)}?fallback=false`
      if (!list.includes(gravatarUrl)) {
        list.push(gravatarUrl)
      }
    }
    return list
  }, [avatarUrl, email])

  const candidateKey = candidates.join('|')
  const [prevKey, setPrevKey] = useState(candidateKey)
  const [attemptIndex, setAttemptIndex] = useState(0)

  if (prevKey !== candidateKey) {
    setPrevKey(candidateKey)
    setAttemptIndex(0)
  }

  const activeSrc = candidates[attemptIndex] ?? null

  return (
    <span aria-hidden="true" className={className}>
      {activeSrc ? (
        <Image
          alt=""
          className="admin-shell__avatar-img"
          height={size}
          onError={() => setAttemptIndex((prev) => prev + 1)}
          referrerPolicy="no-referrer"
          src={activeSrc}
          unoptimized
          width={size}
        />
      ) : (
        initials || 'OPG'
      )}
    </span>
  )
}

export function AdminProfileMenu({ profile }: { profile: AdminProfile }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(
    null,
  )
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isUploading, startUploadTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const shouldReduceMotion = Boolean(useReducedMotion())

  const resolvedAvatarUrl = uploadedAvatarUrl ?? profile.avatarUrl

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setAvatarError(null)
    const formData = new FormData()
    formData.set('avatar', file)

    startUploadTransition(async () => {
      const result = await uploadAdminAvatarAction(formData)
      if (!result.ok) {
        setAvatarError(result.error)
        return
      }
      setUploadedAvatarUrl(result.avatarUrl)
      router.refresh()
    })
  }

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
      <motion.button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Admin account options for ${profile.displayName}`}
        className="admin-profile-menu__trigger"
        onBlur={() => setIsHovered(false)}
        onClick={() => {
          setIsHovered(false)
          setIsOpen((prev) => !prev)
        }}
        onFocus={() => setIsHovered(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        type="button"
        whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
      >
        <AdminAccountAvatar
          avatarUrl={resolvedAvatarUrl}
          className="admin-shell__avatar"
          email={profile.email}
          initials={initials}
          size={38}
        />
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
      </motion.button>

      {/* Hover Tooltip when Menu is Closed */}
      <div className="admin-shell__dock-label-wrap" aria-hidden="true">
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="admin-shell__dock-label"
              exit={{ opacity: 0, x: -6, scale: 0.94 }}
              initial={{ opacity: 0, x: -6, scale: 0.94 }}
              role="tooltip"
              transition={
                shouldReduceMotion
                  ? { duration: 0.01 }
                  : { duration: 0.14, ease: [0.16, 1, 0.3, 1] }
              }
            >
              {profile.displayName}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1, x: 0, scale: 1 }}
            aria-label="Account menu"
            className="admin-profile-menu__popover"
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            role="menu"
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }
            }
          >
            <div className="admin-profile-menu__header">
              <div className="admin-profile-menu__avatar-wrap">
                <AdminAccountAvatar
                  avatarUrl={resolvedAvatarUrl}
                  className="admin-profile-menu__popover-avatar"
                  email={profile.email}
                  initials={initials}
                  size={40}
                />
                <input
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  aria-label="Upload profile photo"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={handleAvatarFileChange}
                  type="file"
                />
                <button
                  aria-label="Change profile photo"
                  className="admin-profile-menu__avatar-edit"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Update account photo"
                  type="button"
                >
                  <OpgIconUpload size={11} />
                </button>
              </div>
              <div className="admin-profile-menu__details">
                <span className="admin-profile-menu__name">
                  {profile.displayName}
                </span>
                <span className="admin-profile-menu__email">
                  {profile.email}
                </span>
                <span className="admin-profile-menu__badge">
                  {profile.roleDisplayName}
                </span>
              </div>
            </div>

            {avatarError && (
              <p className="admin-profile-menu__error" role="alert">
                {avatarError}
              </p>
            )}

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
              <span>Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Dialog */}
      <AdminConfirmDialog
        cancelText="Stay signed in"
        confirmText="Log Out"
        description="Are you sure you want to log out of the OutPro Global Administration workspace? Any unsaved changes in active forms will be lost."
        formAction={signOutAction}
        icon={<OpgIconSignOut size={24} />}
        isOpen={showConfirmSignOut}
        onClose={() => setShowConfirmSignOut(false)}
        title="Confirm Log Out"
        tone="warning"
      />
    </div>
  )
}
