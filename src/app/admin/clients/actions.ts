'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canEditDraft } from '@/lib/auth/permissions'
import { normalizeOptionalHttpUrl } from '@/lib/content/client-logo'
import { CLIENTS_SEEDED_SETTING_KEY } from '@/lib/content/clients'
import { createClient } from '@/lib/supabase/server'

export type ClientActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
  clientId?: string
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_CLIENT_LOGO_BYTES = 5 * 1024 * 1024 // Matches public-media bucket limit (5 MB)
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
])

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

function slugifyClientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function revalidateClientSurfaces() {
  revalidatePath('/clients')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/testimonials')
  revalidatePath('/admin')
}

export async function saveClientAction(
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return {
      status: 'error',
      message: 'You do not have permission to manage clients.',
    }
  }

  const rawId = (formData.get('id') as string | null)?.trim() || ''
  const name = (formData.get('name') as string | null)?.trim() || ''
  const typeOfCompany =
    (formData.get('type_of_company') as string | null)?.trim() || ''
  const tagline = (formData.get('tagline') as string | null)?.trim() || ''
  const description =
    (formData.get('description') as string | null)?.trim() || ''
  const operationalBase =
    (formData.get('operational_base') as string | null)?.trim() || ''
  const dedicatedCapability =
    (formData.get('dedicated_capability') as string | null)?.trim() || ''
  const logoUrlRaw = (formData.get('logo_url') as string | null)?.trim() || ''
  const removeLogo = formData.get('remove_logo') === 'true'
  const isVisible =
    formData.get('is_visible') === 'true' ||
    formData.get('is_visible') === 'on'
  const uploadedLogo = formData.get('logo_file')

  const errors: Record<string, string> = {}

  if (!name) {
    errors.name = 'Client name is required.'
  } else if (name.length > 120) {
    errors.name = 'Client name must be 120 characters or fewer.'
  }

  if (!typeOfCompany) {
    errors.type_of_company = 'Industry / company badge is required.'
  } else if (typeOfCompany.length > 100) {
    errors.type_of_company = 'Company badge must be 100 characters or fewer.'
  }

  if (!tagline) {
    errors.tagline = 'Partner tagline is required.'
  } else if (tagline.length > 200) {
    errors.tagline = 'Tagline must be 200 characters or fewer.'
  }

  if (!description) {
    errors.description = 'Partner description is required.'
  } else if (description.length > 1000) {
    errors.description = 'Description must be 1000 characters or fewer.'
  }

  if (!operationalBase) {
    errors.operational_base = 'Operational base is required.'
  } else if (operationalBase.length > 140) {
    errors.operational_base =
      'Operational base must be 140 characters or fewer.'
  }

  if (!dedicatedCapability) {
    errors.dedicated_capability = 'Dedicated capability is required.'
  } else if (dedicatedCapability.length > 160) {
    errors.dedicated_capability =
      'Dedicated capability must be 160 characters or fewer.'
  }

  let logoFile: File | null = null
  if (uploadedLogo instanceof File && uploadedLogo.size > 0) {
    if (uploadedLogo.size > MAX_CLIENT_LOGO_BYTES) {
      errors.logo = 'Logo must be 5 MB or smaller.'
    } else {
      const mime = uploadedLogo.type.toLowerCase()
      const ext = uploadedLogo.name.split('.').pop()?.toLowerCase() || ''
      const allowedExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'])
      if (!ALLOWED_IMAGE_MIME_TYPES.has(mime) && !allowedExt.has(ext)) {
        errors.logo = 'Upload a PNG, JPG, WEBP, AVIF, or SVG logo.'
      } else {
        logoFile = uploadedLogo
      }
    }
  }

  const normalizedLogoUrl = removeLogo
    ? { value: null }
    : normalizeOptionalHttpUrl(logoUrlRaw, 'Logo URL')
  if (normalizedLogoUrl.error) {
    errors.logo = normalizedLogoUrl.error
  }

  if (!logoFile && !normalizedLogoUrl.value) {
    errors.logo = 'Upload a partner logo or enter a logo URL.'
  }

  const websiteRes = normalizeOptionalHttpUrl(
    formData.get('website_url') as string | null,
    'Website URL',
  )
  if (websiteRes.error) errors.website_url = websiteRes.error

  const linkedinRes = normalizeOptionalHttpUrl(
    formData.get('linkedin_url') as string | null,
    'LinkedIn URL',
  )
  if (linkedinRes.error) errors.linkedin_url = linkedinRes.error

  const facebookRes = normalizeOptionalHttpUrl(
    formData.get('facebook_url') as string | null,
    'Facebook URL',
  )
  if (facebookRes.error) errors.facebook_url = facebookRes.error

  const instagramRes = normalizeOptionalHttpUrl(
    formData.get('instagram_url') as string | null,
    'Instagram URL',
  )
  if (instagramRes.error) errors.instagram_url = instagramRes.error

  const xRes = normalizeOptionalHttpUrl(
    formData.get('x_url') as string | null,
    'X (Twitter) URL',
  )
  if (xRes.error) errors.x_url = xRes.error

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      errors,
      message: 'Please fix the highlighted client profile fields.',
    }
  }

  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  let finalLogoUrl = normalizedLogoUrl.value || ''

  if (logoFile) {
    const ext =
      EXTENSION_BY_MIME[logoFile.type.toLowerCase()] ||
      logoFile.name.split('.').pop()?.toLowerCase() ||
      'png'
    const objectPath = `clients/${slugifyClientName(name) || 'partner'}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await logoFile.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('public-media')
      .upload(objectPath, buffer, {
        contentType: logoFile.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return {
        status: 'error',
        message: `Failed to upload logo: ${uploadError.message}`,
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from('public-media')
      .getPublicUrl(objectPath)
    finalLogoUrl = publicUrlData.publicUrl
  }

  if (!finalLogoUrl) {
    return {
      status: 'error',
      errors: { logo: 'Upload a partner logo or enter a logo URL.' },
      message: 'A client logo is required.',
    }
  }

  const payload = {
    name,
    logo_url: finalLogoUrl,
    type_of_company: typeOfCompany,
    hero_domain: typeOfCompany,
    tagline,
    description,
    operational_base: operationalBase,
    dedicated_capability: dedicatedCapability,
    website_url: websiteRes.value,
    linkedin_url: linkedinRes.value,
    facebook_url: facebookRes.value,
    instagram_url: instagramRes.value,
    x_url: xRes.value,
    display_permission: true,
    is_visible: isVisible,
    updated_at: nowIso,
  }

  let savedClientId = UUID_REGEX.test(rawId) ? rawId : ''

  if (savedClientId) {
    const { error: updateError } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', savedClientId)

    if (updateError) {
      return {
        status: 'error',
        message: `Failed to update client: ${updateError.message}`,
      }
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('clients')
      .insert({
        ...payload,
        display_order: 0,
        created_at: nowIso,
      })
      .select('id')
      .single()

    if (insertError || !inserted?.id) {
      return {
        status: 'error',
        message: `Failed to add client: ${insertError?.message || 'Unknown error'}`,
      }
    }
    savedClientId = inserted.id
  }

  try {
    await supabase.from('site_settings').upsert(
      {
        setting_key: CLIENTS_SEEDED_SETTING_KEY,
        setting_value: true,
        updated_at: nowIso,
        updated_by: profile.id,
      },
      { onConflict: 'setting_key' },
    )
  } catch {
    // Non-fatal under restricted roles
  }

  revalidateClientSurfaces()

  return {
    status: 'success',
    clientId: savedClientId,
    message: rawId
      ? `${name} updated on the Partner Profile showcase.`
      : `${name} added to Client Partners.`,
  }
}

export async function deleteClientAction(formData: FormData) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to delete client partners.')
  }

  const clientId = (formData.get('clientId') as string | null)?.trim() || ''
  if (!UUID_REGEX.test(clientId)) {
    throw new Error('Valid client ID is required.')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', clientId)

  if (error) {
    throw new Error(`Failed to delete client: ${error.message}`)
  }

  revalidateClientSurfaces()
  return { success: true }
}

export async function toggleClientVisibilityAction(
  clientId: string,
  nextVisible: boolean,
) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to update client visibility.')
  }

  if (!UUID_REGEX.test(clientId)) {
    throw new Error('Valid client ID is required.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({
      is_visible: nextVisible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to update visibility: ${error.message}`)
  }

  revalidateClientSurfaces()
  return { success: true }
}

function validateClientIds(clientIds: string[]): string[] {
  const uniqueIds = Array.from(
    new Set(
      clientIds.map((id) => id.trim()).filter((id) => UUID_REGEX.test(id)),
    ),
  )
  if (uniqueIds.length === 0) {
    throw new Error('Select at least one valid client partner.')
  }
  return uniqueIds
}

export async function bulkSetClientsVisibilityAction(
  clientIds: string[],
  isVisible: boolean,
): Promise<{ success: boolean; count: number }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to update client visibility.')
  }

  const validIds = validateClientIds(clientIds)
  const supabase = await createClient()

  const { data: updatedRows, error } = await supabase
    .from('clients')
    .update({
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    })
    .in('id', validIds)
    .select('id')

  if (error) {
    throw new Error(`Failed to update visibility: ${error.message}`)
  }

  revalidateClientSurfaces()
  return { success: true, count: updatedRows?.length ?? validIds.length }
}

export async function bulkDeleteClientsAction(
  clientIds: string[],
): Promise<{ success: boolean; count: number }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to delete client partners.')
  }

  const validIds = validateClientIds(clientIds)
  const supabase = await createClient()

  const { error } = await supabase.from('clients').delete().in('id', validIds)

  if (error) {
    throw new Error(`Failed to delete selected clients: ${error.message}`)
  }

  revalidateClientSurfaces()
  return { success: true, count: validIds.length }
}
