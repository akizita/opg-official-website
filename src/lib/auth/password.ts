export const MIN_ADMIN_PASSWORD_LENGTH = 12

export function validateAdminPassword(password: string) {
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return 'Include both uppercase and lowercase letters.'
  }

  if (!/\d/.test(password)) {
    return 'Include at least one number.'
  }

  return null
}
