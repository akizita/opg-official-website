import { createHash, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

export type NewsletterSubscription = {
  id: string
  email_normalized: string
  status: 'pending_confirmation' | 'confirmed' | 'unsubscribed'
  consent_version: string
  consent_source: string
  created_at: string
  confirmed_at: string | null
  unsubscribed_at: string | null
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex')
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function subscribeToNewsletter(
  email: string,
  options?: {
    source?: string
    client?: SupabaseClient
  },
): Promise<{
  success: boolean
  message: string
  error?: string
  token?: string
}> {
  const normalized = email.trim().toLowerCase()
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

  if (!normalized || !emailRegex.test(normalized)) {
    return {
      success: false,
      message: '',
      error: 'Please enter a valid email address.',
    }
  }

  const token = generateToken()
  const tokenHash = hashToken(token)
  const source = options?.source || 'footer_form'
  const supabase = options?.client ?? (await createClient())

  const { error } = await supabase.from('newsletter_subscriptions').upsert(
    {
      email_normalized: normalized,
      status: 'pending_confirmation',
      confirmation_token_hash: tokenHash,
      confirmation_sent_at: new Date().toISOString(),
      consent_version: '1.0',
      consent_source: source,
    },
    { onConflict: 'email_normalized' },
  )

  if (error) {
    return {
      success: false,
      message: '',
      error: 'Unable to process subscription. Please try again later.',
    }
  }

  // Atomically queue notification to send confirmation email
  await supabase.from('notification_outbox').insert({
    idempotency_key: `newsletter-confirm-${normalized}`,
    recipient: normalized,
    template: 'newsletter_confirmation',
    payload: {
      email: normalized,
      token,
      confirmUrl: `/newsletter/confirm?token=${token}&email=${encodeURIComponent(normalized)}`,
    },
    status: 'queued',
  })

  return {
    success: true,
    message: 'Please check your email inbox to confirm your subscription.',
    token,
  }
}

export async function confirmNewsletterSubscription(
  token: string,
  email: string,
  client?: SupabaseClient,
): Promise<{ success: boolean; message: string }> {
  if (!token || !email) {
    return { success: false, message: 'Invalid or missing confirmation link.' }
  }

  const normalized = email.trim().toLowerCase()
  const tokenHash = hashToken(token)
  const supabase = client ?? (await createClient())

  const { data: sub, error } = await supabase
    .from('newsletter_subscriptions')
    .select('id, status, confirmation_token_hash')
    .eq('email_normalized', normalized)
    .single()

  if (error || !sub) {
    return { success: false, message: 'Subscription record not found.' }
  }

  if (sub.status === 'confirmed') {
    return {
      success: true,
      message: 'Your subscription is already confirmed. Thank you!',
    }
  }

  if (sub.confirmation_token_hash !== tokenHash) {
    return { success: false, message: 'Invalid or expired confirmation link.' }
  }

  const { error: updateError } = await supabase
    .from('newsletter_subscriptions')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmation_token_hash: null,
    })
    .eq('id', sub.id)

  if (updateError) {
    return {
      success: false,
      message: 'Could not complete confirmation. Please try again.',
    }
  }

  return {
    success: true,
    message: 'Your subscription is confirmed! Welcome to OPG Insights.',
  }
}

export async function unsubscribeFromNewsletter(
  token: string,
  email: string,
  client?: SupabaseClient,
): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: 'Email is required to unsubscribe.' }
  }

  const normalized = email.trim().toLowerCase()
  const supabase = client ?? (await createClient())

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('email_normalized', normalized)

  if (error) {
    return { success: false, message: 'Unable to process unsubscribe request.' }
  }

  return {
    success: true,
    message: 'You have been successfully unsubscribed from OPG Insights.',
  }
}
