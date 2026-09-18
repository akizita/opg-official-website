import Image from 'next/image'
import Link from 'next/link'

import { siteConfig } from '@/lib/site-config'

const LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/opg-square-logo-1789740365405.png'

export function SiteHeader() {
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
            height={38}
            priority
            src={LOGO_URL}
            width={120}
          />
          <span className="sr-only">Outsourced Pro Global</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {siteConfig.navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/search">Search</Link>
        </nav>

        <Link className="header-cta" href="/contact">
          Contact us
        </Link>

        <details className="mobile-nav">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {siteConfig.navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/search">Search</Link>
            <Link href="/contact">Contact us</Link>
          </nav>
        </details>
      </header>
    </div>
  )
}
