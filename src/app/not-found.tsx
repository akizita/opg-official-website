import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="container status-page">
      <p className="eyebrow">404</p>
      <h1>That page isn’t here.</h1>
      <p>
        The address may have changed, or the page may no longer be available.
      </p>
      <Link className="button-link button-link--primary" href="/">
        Return home
      </Link>
    </div>
  )
}
