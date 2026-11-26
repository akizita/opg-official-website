'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { visitorSignOutAction } from '@/app/account/actions'
import { UserAvatar } from '@/components/ui/user-avatar'

import styles from './site-account-menu.module.css'

export function SiteAccountMenu({
  avatarUrl,
  displayName,
  email,
  gravatarUrl,
}: {
  avatarUrl?: string | null
  displayName?: string | null
  email: string
  gravatarUrl?: string | null
}) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        menuRef.current?.removeAttribute('open')
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !menuRef.current?.open) return
      menuRef.current.open = false
      menuRef.current.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const resolvedName = displayName?.trim() || email

  return (
    <details className="site-account-menu" ref={menuRef}>
      <summary aria-label={`Profile menu for ${resolvedName}`}>
        <UserAvatar
          className={`site-account-menu__avatar ${styles.avatar}`}
          email={email}
          fallbackSrc={gravatarUrl}
          imgClassName={styles.avatarImg}
          initialsClassName={styles.initialsFallback}
          name={resolvedName}
          size={32}
          src={avatarUrl}
        />
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
