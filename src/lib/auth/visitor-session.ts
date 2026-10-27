import { createClient } from '@/lib/supabase/server'

export async function getVisitorSession() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const id = data?.claims?.sub
  const email = data?.claims?.email

  if (error || !id || typeof email !== 'string' || !email.trim()) return null

  return { id, email: email.trim().toLowerCase() }
}
