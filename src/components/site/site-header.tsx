import Link from 'next/link'

import { siteConfig } from '@/lib/site-config'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link
          className="brand"
          href="/"
          aria-label="Outsourced Pro Global home"
        >
          <span aria-hidden="true">OPG</span>
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
      </div>
    </header>
  )
}
