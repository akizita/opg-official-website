import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  className?: string
  description?: string
  icon?: ReactNode
  title: string
}

export function EmptyState({
  action,
  className = '',
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${className}`.trim()}
      role="region"
      aria-label={title}
    >
      {icon ? (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="empty-state__title">{title}</h3>
      {description ? (
        <p className="empty-state__description">{description}</p>
      ) : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
