'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { siteConfig } from '@/lib/site-config'
import { createClient } from '@/lib/supabase/client'

import { SiteAccountMenu } from './site-account-menu'

const LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/opg-square-logo-1789740365405.png'

export function SiteHeader() {
  const pathname = usePathname()
  const mobileNavRef = useRef<HTMLDetailsElement>(null)
  const [auth, setAuth] = useState<{
    pathname: string
    email: string | null
  } | null>(null)

  useEffect(() => {
    mobileNavRef.current?.removeAttribute('open')
  }, [pathname])

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!mobileNavRef.current?.contains(event.target as Node)) {
        mobileNavRef.current?.removeAttribute('open')
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !mobileNavRef.current?.open) return
      mobileNavRef.current.open = false
      mobileNavRef.current.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  useEffect(() => {
    let active = true
    const supabase = createClient()

    void supabase.auth
      .getClaims()
      .then(({ data, error }) => {
        if (!active) return
        const email = data?.claims?.email
        setAuth({
          pathname,
          email:
            !error && typeof email === 'string' && email.trim()
              ? email.trim().toLowerCase()
              : null,
        })
      })
      .catch(() => {
        if (active) setAuth({ pathname, email: null })
      })

    return () => {
      active = false
    }
  }, [pathname])

  const currentAuth = auth?.pathname === pathname ? auth : null

  return (
    <div className="site-header-wrapper">
      <header className="site-header site-header--pill">
        <Link
          className="brand site-header__brand"
          href="/"
          aria-label="Outsourced Pro Global home"
        >
          <Image
            alt="Outsourced Pro Global"
            className="site-header__logo"
            height={150}
            priority
            src={LOGO_URL}
            width={150}
          />
          <span className="sr-only">Outsourced Pro Global</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {siteConfig.navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/contact">Contact us</Link>
        </nav>

        {currentAuth?.email ? (
          <SiteAccountMenu email={currentAuth.email} />
        ) : currentAuth ? (
          <div className="site-header__auth">
            <Link className="site-header__login" href="/sign-in">
              Log in
            </Link>
            <Link className="site-header__signup" href="/sign-up">
              Sign up
            </Link>
          </div>
        ) : (
          <div
            aria-label="Checking account"
            className="site-header__auth-loading"
            role="status"
          />
        )}

        <details className="mobile-nav" ref={mobileNavRef}>
          <summary>Menu</summary>
          <nav
            aria-label="Mobile navigation"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) {
                mobileNavRef.current?.removeAttribute('open')
              }
            }}
          >
            {siteConfig.navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact">Contact us</Link>
            {currentAuth && !currentAuth.email && (
              <div className="mobile-nav__auth">
                <Link className="site-header__login" href="/sign-in">
                  Log in
                </Link>
                <Link className="site-header__signup" href="/sign-up">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </details>
      </header>
    </div>
  )
}
