export type ContentStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'published'
  | 'unpublished'
  | 'archived'
  | 'active'
  | 'inactive'

type StatusBadgeProps = {
  className?: string
  label?: string
  status: ContentStatus
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  changes_requested: 'Changes Requested',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived',
  active: 'Active',
  inactive: 'Inactive',
}

export function StatusBadge({
  className = '',
  label,
  status,
}: StatusBadgeProps) {
  const displayLabel = label ?? STATUS_LABELS[status] ?? status

  return (
    <span
      className={`status-badge status-badge--${status} ${className}`.trim()}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__text">{displayLabel}</span>
    </span>
  )
}
