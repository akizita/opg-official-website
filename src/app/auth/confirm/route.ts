import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { getSafeAdminPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

const emailOtpTypes = new Set<EmailOtpType>([
  'email',
  'email_change',
  'invite',
  'magiclink',
  'recovery',
  'signup',
])

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && emailOtpTypes.has(value as EmailOtpType)
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const defaultNext =
    type === 'invite' || type === 'recovery'
      ? '/admin/set-password'
      : '/admin'
  const next = getSafeAdminPath(
    request.nextUrl.searchParams.get('next'),
    defaultNext,
  )

  if (tokenHash && isEmailOtpType(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(
    new URL('/admin/sign-in?notice=invalid-link', request.url),
  )
}
