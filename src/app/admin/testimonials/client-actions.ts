'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canArchive, canPublish } from '@/lib/auth/permissions'
import { validateTestimonialInput } from '@/lib/content/clients'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type ClientTestimonialActionResult = {
  success: boolean
  error?: string
  id?: string
}

export type ClientTestimonialFormData = {
  id?: string
  client_id?: string | null
  headline?: string | null
  quote: string
  author_name: string
  author_role: string
  author_company?: string | null
  photo_url?: string | null
  rating?: number
  status?: 'draft' | 'in_review' | 'published' | 'archived'
  display_order?: number
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function createClientTestimonialAction(
  rawInput: unknown,
): Promise<ClientTestimonialActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to create client testimonials.',
    }
  }

  const validation = validateTestimonialInput(rawInput)
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.message || 'Invalid testimonial input.',
    }
  }

  const input = validation.data
  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  let resolvedCompany = input.author_company || null
  if (input.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('name')
      .eq('id', input.client_id)
      .maybeSingle()
    if (clientData?.name) {
      resolvedCompany = clientData.name
    }
  }

  const payload: Record<string, unknown> = {
    quote: input.quote,
    author_name: input.author_name,
    author_role: input.author_role,
    author_company: resolvedCompany,
    client_id: input.client_id || null,
    headline: input.headline || null,
    photo_url: input.photo_url || null,
    rating: input.rating ?? 5,
    status: input.status || 'published',
    display_order: input.display_order ?? 0,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('testimonials')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('Could not insert client testimonial:', error.message)
    return {
      success: false,
      error: 'Could not create client testimonial. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id: (data as { id: string } | null)?.id }
}

export async function updateClientTestimonialAction(
  id: string,
  rawInput: unknown,
): Promise<ClientTestimonialActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to update client testimonials.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid testimonial ID.' }
  }

  const validation = validateTestimonialInput(rawInput)
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.message || 'Invalid testimonial input.',
    }
  }

  const input = validation.data
  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  let resolvedCompany = input.author_company || null
  if (input.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('name')
      .eq('id', input.client_id)
      .maybeSingle()
    if (clientData?.name) {
      resolvedCompany = clientData.name
    }
  }

  const payload: Record<string, unknown> = {
    quote: input.quote,
    author_name: input.author_name,
    author_role: input.author_role,
    author_company: resolvedCompany,
    client_id: input.client_id || null,
    headline: input.headline || null,
    photo_url: input.photo_url || null,
    rating: input.rating ?? 5,
    status: input.status || 'published',
    display_order: input.display_order ?? 0,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('testimonials')
    .update(payload)
    .eq('id', id)

  if (error) {
    console.error('Could not update client testimonial:', error.message)
    return {
      success: false,
      error: 'Could not update client testimonial. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id }
}

export async function deleteClientTestimonialAction(
  id: string,
): Promise<ClientTestimonialActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canArchive(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to delete client testimonials.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid testimonial ID.' }
  }

  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  const { error } = await supabase.from('testimonials').delete().eq('id', id)

  if (error) {
    console.error('Could not delete client testimonial:', error.message)
    return {
      success: false,
      error: 'Could not delete client testimonial. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id }
}
