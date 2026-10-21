import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { getSupabaseBrowserEnv } from '@/lib/supabase/env'

export async function createClient() {
  const cookieStore = await cookies()
  const { publishableKey, url } = getSupabaseBrowserEnv()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes
          // the session and writes refreshed cookies to the response.
        }
      },
    },
  })
}

export function createStaticClient() {
  const { publishableKey, url } = getSupabaseBrowserEnv()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export function createPrivilegedClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!secretKey) return null

  const { url } = getSupabaseBrowserEnv()

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
