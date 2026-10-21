import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DESIGNATED_SUPER_ADMIN_EMAIL,
  isAdminMfaRequired,
} from '@/lib/auth/config'

describe('admin auth configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the OPG recruitment mailbox as the designated Super Admin', () => {
    expect(DESIGNATED_SUPER_ADMIN_EMAIL).toBe('recruitment@opglobal.com.hk')
  })

  it('bypasses MFA during development by default', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ADMIN_MFA_REQUIRED', '')

    expect(isAdminMfaRequired()).toBe(false)
  })

  it('allows MFA to be tested during development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ADMIN_MFA_REQUIRED', 'true')

    expect(isAdminMfaRequired()).toBe(true)
  })

  it('always requires MFA outside development', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ADMIN_MFA_REQUIRED', 'false')

    expect(isAdminMfaRequired()).toBe(true)
  })
})
