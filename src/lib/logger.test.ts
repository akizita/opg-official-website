import { describe, expect, it } from 'vitest'

import { redactSensitiveData } from './logger'

describe('logger and redaction', () => {
  it('redacts sensitive keys in objects', () => {
    const sensitive = {
      user: 'test_user',
      password: 'super_secret_password',
      token: 'jwt.token.here',
      nested: {
        apiKey: '123456',
        publicField: 'safe',
      },
    }

    const result = redactSensitiveData(sensitive) as Record<string, unknown>
    expect(result.password).toBe('[REDACTED]')
    expect(result.token).toBe('[REDACTED]')
    expect(result.user).toBe('test_user')

    const nested = result.nested as Record<string, unknown>
    expect(nested.apiKey).toBe('[REDACTED]')
    expect(nested.publicField).toBe('safe')
  })

  it('redacts Bearer authorization headers in strings', () => {
    const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz'
    const result = redactSensitiveData(authHeader)
    expect(result).toBe('Bearer [REDACTED]')
  })

  it('passes non-sensitive data through unharmed', () => {
    const safeData = { title: 'Hello world', count: 42, tags: ['a', 'b'] }
    expect(redactSensitiveData(safeData)).toEqual(safeData)
  })
})
