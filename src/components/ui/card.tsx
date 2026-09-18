import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  eyebrow?: string
  title: string
}

export function Card({ children, className = '', eyebrow, title }: CardProps) {
  return (
    <article className={`card ${className}`.trim()}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <div className="card__content">{children}</div>
    </article>
  )
}
