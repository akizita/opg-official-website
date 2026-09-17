import type { ReactNode } from 'react'

export type NoticeVariant = 'info' | 'success' | 'warning' | 'error'

type NoticeProps = {
  children: ReactNode
  className?: string
  id?: string
  title?: string
  variant?: NoticeVariant
}

export function Notice({
  children,
  className = '',
  id,
  title,
  variant = 'info',
}: NoticeProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'

  return (
    <aside
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`notice notice--${variant} ${className}`.trim()}
      id={id}
      role={role}
    >
      <div className="notice__icon" aria-hidden="true">
        {variant === 'info' && 'ℹ️'}
        {variant === 'success' && '✓'}
        {variant === 'warning' && '⚠️'}
        {variant === 'error' && '✕'}
      </div>
      <div className="notice__content">
        {title ? <strong className="notice__title">{title}</strong> : null}
        <div className="notice__body">{children}</div>
      </div>
    </aside>
  )
}
