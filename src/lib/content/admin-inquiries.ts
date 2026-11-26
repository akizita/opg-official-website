import { sanitizeAvatarUrl } from '@/lib/auth/avatar-utils'
import {
  buildGravatarUrl,
  resolveAuthAvatarsByEmail,
} from '@/lib/auth/user-avatars'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminInquiryStatus =
  | 'new'
  | 'read'
  | 'replied'
  | 'archived'
  | 'spam_suspected'

export type AdminInquiryRecord = {
  id: string
  full_name: string
  email: string
  subject: string
  message: string
  status: AdminInquiryStatus
  submitted_at: string
  retention_expires_at?: string
  ip_hash?: string
  avatar_url?: string | null
  gravatar_url?: string | null
}

/**
 * Fetches ordered contact inquiries and resolves sender photos (preferring the
 * snapshot captured on submission, then Auth account metadata & Gravatar).
 */
export async function loadAdminInquiries(supabase: SupabaseClient): Promise<{
  error: string | null
  inquiries: AdminInquiryRecord[]
}> {
  const selectWithAvatar =
    'id, full_name, email, avatar_url, subject, message, status, submitted_at, retention_expires_at, ip_hash'
  const selectLegacy =
    'id, full_name, email, subject, message, status, submitted_at, retention_expires_at, ip_hash'

  const firstQuery = await supabase
    .from('contact_inquiries')
    .select(selectWithAvatar)
    .order('submitted_at', { ascending: false })

  let rawInquiries: AdminInquiryRecord[] =
    (firstQuery.data as AdminInquiryRecord[] | null) ?? []
  let queryError = firstQuery.error

  if (queryError?.code === '42703') {
    const legacyQuery = await supabase
      .from('contact_inquiries')
      .select(selectLegacy)
      .order('submitted_at', { ascending: false })
    rawInquiries = (legacyQuery.data as AdminInquiryRecord[] | null) ?? []
    queryError = legacyQuery.error
  }

  if (queryError) {
    return { error: queryError.message, inquiries: [] }
  }
  const authAvatars = await resolveAuthAvatarsByEmail(
    rawInquiries.map((item) => item.email),
  )

  return {
    error: null,
    inquiries: rawInquiries.map((item) => ({
      ...item,
      avatar_url:
        sanitizeAvatarUrl(item.avatar_url) ??
        authAvatars.get(item.email.trim().toLowerCase()) ??
        null,
      gravatar_url: buildGravatarUrl(item.email),
    })),
  }
}

/**
 * Sends a lightweight best-effort Realtime broadcast so open Admin Contacts
 * tabs refresh immediately even if Postgres Changes replication is disabled.
 */
export async function broadcastAdminInquiriesChanged(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!url || !secretKey) return

  try {
    await fetch(`${url.replace(/\/$/, '')}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            topic: 'admin-inquiries-realtime',
            event: 'changed',
            payload: { ts: Date.now() },
          },
        ],
      }),
      signal: AbortSignal.timeout(2500),
    })
  } catch {
    // Non-fatal: polling & visibility sync act as automatic backup.
  }
}
