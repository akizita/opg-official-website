import { describe, expect, it } from 'vitest'

import { getSafeAdminPath } from '@/lib/auth/redirect'

describe('getSafeAdminPath', () => {
  it('accepts local admin paths', () => {
    expect(getSafeAdminPath('/admin/articles?status=draft')).toBe(
      '/admin/articles?status=draft',
    )
  })

  it.each([
    null,
    '',
    'https://attacker.example/admin',
    '//attacker.example/admin',
    '/contact',
  ])('rejects unsafe or non-admin path %s', (value) => {
    expect(getSafeAdminPath(value)).toBe('/admin')
  })
})
