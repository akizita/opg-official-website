'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canArchive, canPublish } from '@/lib/auth/permissions'
import { validateClientInput } from '@/lib/content/clients'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type ClientActionResult = {
  success: boolean
  error?: string
  id?: string
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function createClientPartnerAction(
  rawInput: unknown,
): Promise<ClientActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to create client partners.',
    }
  }

  const validation = validateClientInput(rawInput)
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.message || 'Invalid client data.',
    }
  }

  const input = validation.data
  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  const payload = {
    name: input.name,
    logo_url: input.logo_url,
    website_url: input.website_url || null,
    type_of_company: input.type_of_company || null,
    hero_domain: input.hero_domain || null,
    tagline: input.tagline || null,
    description: input.description || null,
    operational_base: input.operational_base || null,
    dedicated_capability: input.dedicated_capability || null,
    linkedin_url: input.linkedin_url || null,
    facebook_url: input.facebook_url || null,
    instagram_url: input.instagram_url || null,
    x_url: input.x_url || null,
    social_links: input.social_links || null,
    display_permission: input.display_permission !== false,
    display_order: input.display_order ?? 0,
    is_visible: input.is_visible !== false,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('Could not create client partner:', error.message)
    return {
      success: false,
      error: 'Could not create client partner. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id: (data as { id: string } | null)?.id }
}

export async function updateClientPartnerAction(
  id: string,
  rawInput: unknown,
): Promise<ClientActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to update client partners.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid client ID.' }
  }

  const validation = validateClientInput(rawInput)
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: validation.message || 'Invalid client data.',
    }
  }

  const input = validation.data
  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  const payload = {
    name: input.name,
    logo_url: input.logo_url,
    website_url: input.website_url || null,
    type_of_company: input.type_of_company || null,
    hero_domain: input.hero_domain || null,
    tagline: input.tagline || null,
    description: input.description || null,
    operational_base: input.operational_base || null,
    dedicated_capability: input.dedicated_capability || null,
    linkedin_url: input.linkedin_url || null,
    facebook_url: input.facebook_url || null,
    instagram_url: input.instagram_url || null,
    x_url: input.x_url || null,
    social_links: input.social_links || null,
    display_permission: input.display_permission !== false,
    display_order: input.display_order ?? 0,
    is_visible: input.is_visible !== false,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)

  if (error) {
    console.error('Could not update client partner:', error.message)
    return {
      success: false,
      error: 'Could not update client partner. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id }
}

export async function deleteClientPartnerAction(
  id: string,
): Promise<ClientActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canArchive(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to delete client partners.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid client ID.' }
  }

  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) {
    console.error('Could not delete client partner:', error.message)
    return {
      success: false,
      error: 'Could not delete client partner. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id }
}

export async function toggleClientVisibilityAction(
  id: string,
  isVisible: boolean,
): Promise<ClientActionResult> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canPublish(profile.roleKey)) {
    return {
      success: false,
      error: 'You do not have permission to change client visibility.',
    }
  }

  if (!UUID_PATTERN.test(id)) {
    return { success: false, error: 'Invalid client ID.' }
  }

  const privileged = createPrivilegedClient()
  const supabase = privileged || (await createClient())

  const { error } = await supabase
    .from('clients')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Could not toggle client visibility:', error.message)
    return {
      success: false,
      error: 'Could not toggle client visibility. Try again.',
    }
  }

  revalidatePath('/clients')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')

  return { success: true, id }
}
