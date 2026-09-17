import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  eyebrow?: string
  title: string
}

export function Card({ children, eyebrow, title }: CardProps) {
  return (
    <article className="card">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <div className="card__content">{children}</div>
    </article>
  )
}
