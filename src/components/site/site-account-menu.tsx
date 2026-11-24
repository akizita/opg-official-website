'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { visitorSignOutAction } from '@/app/account/actions'
import { ProfileIconSvg } from '@/components/ui/profile-icon-svg'
import { buildAvatarCandidates } from '@/lib/auth/avatar-utils'

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

  const candidates = useMemo(
    () => buildAvatarCandidates({ avatarUrl, email, gravatarUrl }),
    [avatarUrl, email, gravatarUrl],
  )

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
              onLoad={(event) => {
                if (event.currentTarget.naturalWidth === 0) {
                  setAttemptIndex((prev) => prev + 1)
                }
              }}
              referrerPolicy="no-referrer"
              src={activeSrc}
              unoptimized
              width={32}
            />
          ) : (
            <ProfileIconSvg size={18} />
          )}
        </span>
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
