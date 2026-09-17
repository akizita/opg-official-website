import type { ReactNode } from 'react'

type AuthPanelProps = {
  children: ReactNode
  description: string
  eyebrow: string
  title: string
}

export function AuthPanel({
  children,
  description,
  eyebrow,
  title,
}: AuthPanelProps) {
  return (
    <section className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-panel__summary">{description}</p>
        {children}
      </div>
    </section>
  )
}
