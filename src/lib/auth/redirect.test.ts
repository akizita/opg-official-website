import { describe, expect, it } from 'vitest'

import {
  getSafeAdminPath,
  getSafePublicPath,
  isPublicAuthPath,
} from '@/lib/auth/redirect'

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

describe('public auth redirects', () => {
  it.each(['/contact', '/account', '/reset-password'])(
    'allows the public destination %s',
    (path) => {
      expect(isPublicAuthPath(path)).toBe(true)
      expect(getSafePublicPath(path)).toBe(path)
    },
  )

  it.each([
    'https://attacker.example',
    '//attacker.example',
    '/admin',
    '/contact/../admin',
  ])('rejects unsafe destination %s', (path) => {
    expect(isPublicAuthPath(path)).toBe(false)
    expect(getSafePublicPath(path)).toBe('/contact')
  })
})
