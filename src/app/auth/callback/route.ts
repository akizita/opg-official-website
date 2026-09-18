import { NextResponse, type NextRequest } from 'next/server'

import {
  getAdminAuthDestination,
  getAdminSession,
} from '@/lib/auth/admin-session'
import { getSafeAdminPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    const errorCode = requestUrl.searchParams.get('error_code')
    const notice =
      errorCode === 'signup_disabled' ? 'signup-disabled' : 'oauth-error'
    return NextResponse.redirect(
      new URL(`/admin/sign-in?notice=${notice}`, requestUrl.origin),
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        new URL('/admin/sign-in?notice=oauth-error', requestUrl.origin),
      )
    }

    const session = await getAdminSession()

    if (!session) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/admin/sign-in?notice=unauthorized', requestUrl.origin),
      )
    }

    const destination =
      session.currentLevel === 'aal2'
        ? getSafeAdminPath(next, '/admin')
        : getAdminAuthDestination(session)

    return NextResponse.redirect(new URL(destination, requestUrl.origin))
  }

  return NextResponse.redirect(
    new URL('/admin/sign-in?notice=invalid-link', requestUrl.origin),
  )
}
