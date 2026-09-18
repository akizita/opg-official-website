import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  className?: string
  description?: string
  message?: string
  icon?: ReactNode
  title: string
}

export function EmptyState({
  action,
  className = '',
  description,
  message,
  icon,
  title,
}: EmptyStateProps) {
  const displayDescription = description ?? message

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
      {displayDescription ? (
        <p className="empty-state__description">{displayDescription}</p>
      ) : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
