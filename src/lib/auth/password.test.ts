import { describe, expect, it } from 'vitest'

import {
  MIN_ADMIN_PASSWORD_LENGTH,
  validateAdminPassword,
} from '@/lib/auth/password'

describe('validateAdminPassword', () => {
  it('accepts a sufficiently long mixed password', () => {
    expect(validateAdminPassword('Strong-password-2048')).toBeNull()
  })

  it('rejects short passwords', () => {
    expect(validateAdminPassword('Short1A')).toContain(
      `${MIN_ADMIN_PASSWORD_LENGTH}`,
    )
  })

  it('requires mixed case and a number', () => {
    expect(validateAdminPassword('all-lowercase-password1')).toContain(
      'uppercase',
    )
    expect(validateAdminPassword('NoNumbersInThisPassword')).toContain(
      'number',
    )
  })
})
