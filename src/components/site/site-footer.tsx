import Link from 'next/link'

const footerGroups = [
  {
    title: 'For organizations',
    links: [
      { href: '/services', label: 'Services' },
      { href: '/clients', label: 'Clients' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'For talent',
    links: [
      { href: '/careers', label: 'Careers' },
      { href: '/articles', label: 'Articles' },
      { href: '/faqs', label: 'FAQs' },
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
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="brand brand--footer">OPG</p>
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
