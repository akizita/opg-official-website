export type AdminRoleKey =
  'editor' | 'publisher' | 'inquiry_manager' | 'super_admin'

export type AdminPermissionKey =
  | 'content.view'
  | 'content.draft.write'
  | 'content.review.submit'
  | 'content.review.request_changes'
  | 'content.publish'
  | 'content.archive'
  | 'media.draft.write'
  | 'inquiries.view'
  | 'inquiries.manage'
  | 'subscribers.view'
  | 'users.invite'
  | 'users.roles.manage'
  | 'settings.manage'
  | 'audit.view'

export const ROLE_PERMISSIONS: Record<
  AdminRoleKey,
  readonly AdminPermissionKey[]
> = {
  editor: [
    'content.view',
    'content.draft.write',
    'content.review.submit',
    'media.draft.write',
  ],
  publisher: [
    'content.view',
    'content.draft.write',
    'content.review.submit',
    'content.review.request_changes',
    'content.publish',
    'content.archive',
    'media.draft.write',
  ],
  inquiry_manager: ['inquiries.view', 'inquiries.manage', 'subscribers.view'],
  super_admin: [
    'content.view',
    'content.draft.write',
    'content.review.submit',
    'content.review.request_changes',
    'content.publish',
    'content.archive',
    'media.draft.write',
    'inquiries.view',
    'inquiries.manage',
    'subscribers.view',
    'users.invite',
    'users.roles.manage',
    'settings.manage',
    'audit.view',
  ],
} as const

export function hasRolePermission(
  roleKey: string,
  permission: AdminPermissionKey,
): boolean {
  const permissions = ROLE_PERMISSIONS[roleKey as AdminRoleKey]
  if (!permissions) return false
  return permissions.includes(permission)
}

export function canViewContent(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'content.view')
}

export function canEditDraft(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'content.draft.write')
}

export function canSubmitReview(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'content.review.submit')
}

export function canRequestChanges(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'content.review.request_changes')
}

export function canPublish(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'content.publish')
}

export function canArchive(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'content.archive')
}

export function canViewInquiries(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'inquiries.view')
}

export function canManageInquiries(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'inquiries.manage')
}

export function canViewSubscribers(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'subscribers.view')
}

export function canManageSettings(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'settings.manage')
}

export function canViewAudit(roleKey: string): boolean {
  return hasRolePermission(roleKey, 'audit.view')
}
