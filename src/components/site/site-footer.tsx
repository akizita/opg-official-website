'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const footerGroups = [
  {
    title: 'For organizations',
    links: [
      { href: '/about', label: 'About' },
      { href: '/clients', label: 'Clients' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'For talent',
    links: [
      { href: '/careers', label: 'Careers' },
      { href: '/testimonials', label: 'Testimonials' },
      { href: '/articles', label: 'Articles' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/terms', label: 'Terms' },
    ],
  },
] as const

export function SiteFooter() {
  const pathname = usePathname()

  if (
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname?.startsWith('/sign-in/') ||
    pathname?.startsWith('/sign-up/')
  ) {
    return null
  }
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Link
            aria-label="Return to Outsource Pro Global home"
            className="brand site-footer__brand"
            href="/"
          >
            <Image
              alt="Outsource Pro Global"
              className="site-footer__logo"
              height={150}
              src="/images/opg-logo-white-text.png"
              width={150}
            />
          </Link>
          <p className="site-footer__summary">
            Global talent solutions with a human point of view.
          </p>
        </div>
        {footerGroups.map((group) => (
          <nav aria-label={group.title} key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="container site-footer__bottom">
        <small>© {new Date().getFullYear()} Outsourced Pro Global.</small>
      </div>
    </footer>
  )
}
