import Link from 'next/link'

import { ButtonLink } from '@/components/ui/button-link'

export default function NotFoundPage() {
  return (
    <main className="container status-page not-found-page">
      <p className="eyebrow">404 · Page Not Found</p>
      <h1>We couldn’t find that page</h1>
      <p>
        The page you are looking for may have been moved, renamed, or is no
        longer available.
      </p>

      <div className="not-found-links">
        <p className="not-found-links__title">Helpful destinations:</p>
        <ul className="not-found-links__list">
          <li>
            <Link href="/about">About OPG</Link>
          </li>
          <li>
            <Link href="/mission-and-vision">Mission & Vision</Link>
          </li>
          <li>
            <Link href="/services">Our Services</Link>
          </li>
          <li>
            <Link href="/clients">Clients & Testimonials</Link>
          </li>
          <li>
            <Link href="/contact">Contact Support</Link>
          </li>
        </ul>
      </div>

      <div className="button-row">
        <ButtonLink href="/" variant="primary">
          Return to Homepage
        </ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact Us
        </ButtonLink>
      </div>
    </main>
  )
}
