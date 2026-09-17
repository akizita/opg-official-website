import Link from 'next/link'
import type { ReactNode } from 'react'

type ButtonLinkProps = {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary'
}

export function ButtonLink({
  children,
  href,
  variant = 'primary',
}: ButtonLinkProps) {
  return (
    <Link className={`button-link button-link--${variant}`} href={href}>
      {children}
    </Link>
  )
}
