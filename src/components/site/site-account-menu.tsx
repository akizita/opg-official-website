'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { visitorSignOutAction } from '@/app/account/actions'

import styles from './site-account-menu.module.css'

function getInitials(email: string, displayName?: string | null) {
  const source = displayName?.trim()
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  const nameParts = email
    .split('@')[0]
    .split(/[._+-]+/)
    .filter(Boolean)
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
  }
  return (nameParts[0] || '?').slice(0, 2).toUpperCase()
}

export function SiteAccountMenu({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl?: string | null
  displayName?: string | null
  email: string
}) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  const candidates = useMemo(() => {
    const list: string[] = []
    if (avatarUrl?.trim()) {
      list.push(avatarUrl.trim())
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

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        menuRef.current?.removeAttribute('open')
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !menuRef.current?.open) return
      menuRef.current.open = false
      menuRef.current.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', handleEscape)
    function handleEscape(event: KeyboardEvent) {
      closeOnEscape(event)
    }
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <details className="site-account-menu" ref={menuRef}>
      <summary aria-label={`Profile menu for ${displayName || email}`}>
        <span
          className={`site-account-menu__avatar ${styles.avatar}`}
          aria-hidden="true"
        >
          {activeSrc ? (
            <Image
              alt=""
              className={styles.avatarImg}
              height={32}
              onError={() => setAttemptIndex((prev) => prev + 1)}
              referrerPolicy="no-referrer"
              src={activeSrc}
              unoptimized
              width={32}
            />
          ) : (
            getInitials(email, displayName)
          )}
        </span>
        <span className="site-account-menu__label">Profile</span>
        <span aria-hidden="true" className="site-account-menu__chevron" />
      </summary>
      <div className="site-account-menu__panel">
        {displayName && <p className={styles.displayName}>{displayName}</p>}
        <p className="site-account-menu__email">{email}</p>
        <Link
          href="/account"
          onClick={() => menuRef.current?.removeAttribute('open')}
        >
          Your account
        </Link>
        <form action={visitorSignOutAction}>
          <button type="submit">Log out</button>
        </form>
      </div>
    </details>
  )
}
