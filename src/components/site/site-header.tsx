'use client'

import { Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
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
  const mobileButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileOpen(false)
  }
  const [auth, setAuth] = useState<{
    pathname: string
    email: string | null
  } | null>(null)

  useEffect(() => {
    if (!mobileOpen) return

    const navigation = mobileNavRef.current
    const focusable = navigation?.querySelectorAll<HTMLElement>('a[href]')
    const first = focusable?.[0]
    const last = focusable?.[focusable.length - 1]
    const focusFrame = window.requestAnimationFrame(() => first?.focus())

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        !mobileNavRef.current?.contains(event.target as Node) &&
        !mobileButtonRef.current?.contains(event.target as Node)
      ) {
        setMobileOpen(false)
      }
    }

    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        mobileButtonRef.current?.focus()
        return
      }

      if (event.key !== 'Tab' || !first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', handleKeyboard)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', handleKeyboard)
    }
  }, [mobileOpen])

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

  if (
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname.startsWith('/sign-in/') ||
    pathname.startsWith('/sign-up/')
  ) {
    return null
  }

  const currentAuth = auth?.pathname === pathname ? auth : null
  const isCareersRoute = pathname.startsWith('/careers')

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <div className="site-header-wrapper">
      <header
        className={`site-header site-header--pill ${isCareersRoute ? 'site-header--careers' : ''}`.trim()}
      >
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
            <Link
              aria-current={isActive(item.href) ? 'page' : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link
            aria-current={isActive('/contact') ? 'page' : undefined}
            href="/contact"
          >
            Contact us
          </Link>
        </nav>

        {currentAuth?.email ? (
          <SiteAccountMenu email={currentAuth.email} />
        ) : currentAuth ? (
          <div
            className={`site-header__auth ${isCareersRoute ? 'site-header__auth--quiet' : ''}`.trim()}
          >
            <Link className="site-header__signup" href="/sign-in">
              Sign-in
            </Link>
          </div>
        ) : (
          <div
            aria-label="Checking account"
            className="site-header__auth-loading"
            role="status"
          />
        )}

        <div className="mobile-nav">
          <button
            aria-controls="mobile-navigation-panel"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="mobile-nav__trigger"
            onClick={() => setMobileOpen((open) => !open)}
            ref={mobileButtonRef}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={mobileOpen ? Cancel01Icon : Menu01Icon}
              size={22}
            />
          </button>
          <nav
            aria-label="Mobile navigation"
            aria-hidden={!mobileOpen}
            className={`mobile-nav__panel ${mobileOpen ? 'mobile-nav__panel--open' : ''}`.trim()}
            id="mobile-navigation-panel"
            ref={mobileNavRef}
          >
            {siteConfig.navigation.map((item) => (
              <Link
                aria-current={isActive(item.href) ? 'page' : undefined}
                href={item.href}
                key={item.href}
                onClick={() => setMobileOpen(false)}
                tabIndex={mobileOpen ? undefined : -1}
              >
                {item.label}
              </Link>
            ))}
            <Link
              aria-current={isActive('/contact') ? 'page' : undefined}
              href="/contact"
              onClick={() => setMobileOpen(false)}
              tabIndex={mobileOpen ? undefined : -1}
            >
              Contact us
            </Link>
            {currentAuth && !currentAuth.email && (
              <div className="mobile-nav__auth">
                <Link
                  className="site-header__signup"
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  tabIndex={mobileOpen ? undefined : -1}
                >
                  Sign-in
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </div>
  )
}
