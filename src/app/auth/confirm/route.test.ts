import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'

import { GET } from './route'

describe('GET /auth/confirm', () => {
  const verifyOtp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: { verifyOtp },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  })

  it('sends a confirmed visitor to Contact Us', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=valid&type=signup&next=/contact',
      ),
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )
  })

  it('defaults a signup confirmation to Contact Us', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=valid&type=signup',
      ),
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )
  })

  it('preserves the admin invitation destination', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=valid&type=invite',
      ),
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/set-password',
    )
  })

  it('does not redirect to an external URL', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/auth/confirm?token_hash=valid&type=signup&next=https://attacker.example',
      ),
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/contact',
    )
  })
})
