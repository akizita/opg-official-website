'use server'

import { revalidatePath } from 'next/cache'

import {
  SUBSCRIBER_EMAIL_REGEX,
  type SubscriberStatus,
} from '@/app/admin/subscribers/subscriber-utils'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canManageSubscribers } from '@/lib/auth/permissions'
import { generateToken, hashToken } from '@/lib/content/newsletter'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type SubscriberActionResult = {
  success: boolean
  error?: string
  id?: string
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALLOWED_STATUSES: readonly SubscriberStatus[] = [
  'pending_confirmation',
  'confirmed',
  'unsubscribed',
]

function revalidateSubscriberPaths() {
  revalidatePath('/admin/subscribers')
  revalidatePath('/admin')
}

async function getAdminMutationClient() {
  return createPrivilegedClient() || (await createClient())
}

async function queueConfirmationNotification(
  supabase: Awaited<ReturnType<typeof getAdminMutationClient>>,
  emailNormalized: string,
  token: string,
) {
  await supabase.from('notification_outbox').insert({
    idempotency_key: `newsletter-confirm-${emailNormalized}-${Date.now()}`,
    recipient: emailNormalized,
    template: 'newsletter_confirmation',
    payload: {
      email: emailNormalized,
      token,
      confirmUrl: `/newsletter/confirm?token=${token}&email=${encodeURIComponent(emailNormalized)}`,
    },
    status: 'queued',
  })
}

export async function addSubscriberAction(input: {
  email: string
  source?: string
  status?: 'confirmed' | 'pending_confirmation'
}): Promise<SubscriberActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageSubscribers(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to add subscribers.',
    }
  }

  const normalizedEmail = (input.email || '').trim().toLowerCase()
  if (!normalizedEmail || !SUBSCRIBER_EMAIL_REGEX.test(normalizedEmail)) {
    return {
      success: false,
      error: 'Please enter a valid subscriber email address.',
    }
  }

  const targetStatus: 'confirmed' | 'pending_confirmation' =
    input.status === 'pending_confirmation'
      ? 'pending_confirmation'
      : 'confirmed'
  const consentSource =
    (input.source || 'admin_manual')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 48) || 'admin_manual'

  const supabase = await getAdminMutationClient()

  const { data: existing, error: existingError } = await supabase
    .from('newsletter_subscriptions')
    .select('id, status')
    .eq('email_normalized', normalizedEmail)
    .maybeSingle()

  if (existingError) {
    console.error('Could not check existing subscriber:', existingError.message)
    return {
      success: false,
      error: 'Unable to check existing subscriber records. Try again.',
    }
  }

  if (existing) {
    return {
      success: false,
      error: `${normalizedEmail} is already registered in the subscriber list.`,
    }
  }

  const nowIso = new Date().toISOString()
  const token =
    targetStatus === 'pending_confirmation' ? generateToken() : null
  const tokenHash = token ? hashToken(token) : null

  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .insert({
      email_normalized: normalizedEmail,
      status: targetStatus,
      confirmation_token_hash: tokenHash,
      confirmation_sent_at: nowIso,
      confirmed_at: targetStatus === 'confirmed' ? nowIso : null,
      unsubscribed_at: null,
      consent_version: '1.0',
      consent_source: consentSource,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Could not add subscriber:', error.message)
    return {
      success: false,
      error: 'Could not add subscriber. Please try again.',
    }
  }

  if (token) {
    await queueConfirmationNotification(supabase, normalizedEmail, token)
  }

  revalidateSubscriberPaths()
  return { success: true, id: (data as { id: string } | null)?.id }
}

export async function updateSubscriberStatusAction(
  id: string,
  newStatus: SubscriberStatus,
): Promise<SubscriberActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageSubscribers(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to update subscribers.',
    }
  }

  if (!UUID_PATTERN.test(id) || !ALLOWED_STATUSES.includes(newStatus)) {
    return { success: false, error: 'Invalid subscriber status request.' }
  }

  const supabase = await getAdminMutationClient()

  const { data: existing, error: fetchError } = await supabase
    .from('newsletter_subscriptions')
    .select('id, email_normalized')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Subscriber record not found.' }
  }

  const nowIso = new Date().toISOString()
  const token = newStatus === 'pending_confirmation' ? generateToken() : null

  const updatePayload =
    newStatus === 'confirmed'
      ? {
          status: 'confirmed',
          confirmed_at: nowIso,
          unsubscribed_at: null,
          confirmation_token_hash: null,
        }
      : newStatus === 'unsubscribed'
        ? {
            status: 'unsubscribed',
            unsubscribed_at: nowIso,
            confirmation_token_hash: null,
          }
        : {
            status: 'pending_confirmation',
            confirmation_token_hash: token ? hashToken(token) : null,
            confirmation_sent_at: nowIso,
            confirmed_at: null,
            unsubscribed_at: null,
          }

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('Could not update subscriber status:', error.message)
    return {
      success: false,
      error: 'Failed to update subscriber status. Try again.',
    }
  }

  if (token) {
    await queueConfirmationNotification(
      supabase,
      (existing as { email_normalized: string }).email_normalized,
      token,
    )
  }

  revalidateSubscriberPaths()
  return { success: true, id }
}

export async function resendSubscriberConfirmationAction(
  id: string,
): Promise<SubscriberActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageSubscribers(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to resend confirmations.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid subscriber ID.' }
  }

  const supabase = await getAdminMutationClient()

  const { data: existing, error: fetchError } = await supabase
    .from('newsletter_subscriptions')
    .select('id, email_normalized, status')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Subscriber record not found.' }
  }

  const subscriber = existing as {
    id: string
    email_normalized: string
    status: SubscriberStatus
  }

  if (subscriber.status !== 'pending_confirmation') {
    return {
      success: false,
      error: 'Confirmation links can only be resent to pending subscribers.',
    }
  }

  const token = generateToken()
  const nowIso = new Date().toISOString()

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .update({
      confirmation_token_hash: hashToken(token),
      confirmation_sent_at: nowIso,
    })
    .eq('id', id)

  if (error) {
    console.error('Could not refresh confirmation token:', error.message)
    return {
      success: false,
      error: 'Could not queue confirmation email. Try again.',
    }
  }

  await queueConfirmationNotification(
    supabase,
    subscriber.email_normalized,
    token,
  )

  revalidateSubscriberPaths()
  return { success: true, id }
}

export async function deleteSubscriberAction(
  id: string,
): Promise<SubscriberActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canManageSubscribers(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to delete subscribers.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid subscriber ID.' }
  }

  const supabase = await getAdminMutationClient()

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Could not delete subscriber:', error.message)
    return {
      success: false,
      error: 'Could not delete subscriber. Try again.',
    }
  }

  revalidateSubscriberPaths()
  return { success: true, id }
}
