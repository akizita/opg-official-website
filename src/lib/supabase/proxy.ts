import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseBrowserEnv } from '@/lib/supabase/env'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { publishableKey, url } = getSupabaseBrowserEnv()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options)
        })

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value)
        })
      },
    },
  })

  // Keep this immediately after client creation. It verifies the access token
  // and refreshes expired credentials before a protected route renders.
  await supabase.auth.getClaims()

  return response
}
