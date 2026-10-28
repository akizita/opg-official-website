'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { visitorSignOutAction } from '@/app/account/actions'

function getInitials(email: string) {
  const nameParts = email
    .split('@')[0]
    .split(/[._+-]+/)
    .filter(Boolean)
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
  }
  return (nameParts[0] || '?').slice(0, 2).toUpperCase()
}

export function SiteAccountMenu({ email }: { email: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null)

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
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <details className="site-account-menu" ref={menuRef}>
      <summary aria-label={`Profile menu for ${email}`}>
        <span className="site-account-menu__avatar" aria-hidden="true">
          {getInitials(email)}
        </span>
        <span className="site-account-menu__label">Profile</span>
        <span aria-hidden="true" className="site-account-menu__chevron" />
      </summary>
      <div className="site-account-menu__panel">
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
