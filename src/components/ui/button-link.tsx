import Link from 'next/link'
import type { ReactNode } from 'react'

type ButtonLinkProps = {
  children: ReactNode
  className?: string
  href: string
  rel?: string
  target?: string
  variant?: 'primary' | 'secondary'
}

export function ButtonLink({
  children,
  className = '',
  href,
  rel,
  target,
  variant = 'primary',
}: ButtonLinkProps) {
  return (
    <Link
      className={`button-link button-link--${variant} ${className}`.trim()}
      href={href}
      rel={rel}
      target={target}
    >
      {children}
    </Link>
  )
}
