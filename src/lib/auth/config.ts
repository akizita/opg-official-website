export const DESIGNATED_SUPER_ADMIN_EMAIL = 'recruitment@opglobal.com.hk'

/**
 * MFA is bypassed only while running `next dev` unless explicitly re-enabled.
 * Production and test builds always retain the AAL2 requirement.
 */
export function isAdminMfaRequired(): boolean {
  return (
    process.env.NODE_ENV !== 'development' ||
    process.env.ADMIN_MFA_REQUIRED === 'true'
  )
}
