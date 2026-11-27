'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canEditDraft } from '@/lib/auth/permissions'
import {
  slugifyTeamText,
  syncTeamMemberToAuthor,
  TEAM_SEEDED_SETTING_KEY,
} from '@/lib/content/team'
import { createClient } from '@/lib/supabase/server'

export type TeamActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
  memberId?: string
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MAX_TEAM_PHOTO_BYTES = 5 * 1024 * 1024 // Matches public-media bucket limit (5 MB)
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

function revalidateTeamSurfaces() {
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/admin/team')
  revalidatePath('/admin/articles')
  revalidatePath('/admin')
  revalidatePath('/articles')
}

export async function saveTeamMemberAction(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    return {
      status: 'error',
      message: 'You do not have permission to manage team members.',
    }
  }

  const rawId = (formData.get('id') as string | null)?.trim() || ''
  const fullName = (formData.get('full_name') as string | null)?.trim() || ''
  const position = (formData.get('position') as string | null)?.trim() || ''
  const bio = (formData.get('bio') as string | null)?.trim() || null
  const departmentIdRaw =
    (formData.get('department_id') as string | null)?.trim() || ''
  const newDepartmentName =
    (formData.get('new_department_name') as string | null)?.trim() || ''
  const displayOrderRaw =
    (formData.get('display_order') as string | null)?.trim() || '0'
  const removePhoto = formData.get('remove_photo') === 'true'
  const photoUrlInput =
    (formData.get('photo_url') as string | null)?.trim() || null
  const isActive =
    formData.get('is_active') === 'true' || formData.get('is_active') === 'on'
  const uploadedPhoto = formData.get('photo_file')

  const errors: Record<string, string> = {}

  if (!fullName) {
    errors.full_name = 'Full name is required.'
  } else if (fullName.length > 120) {
    errors.full_name = 'Full name must be 120 characters or fewer.'
  }

  if (!position) {
    errors.position = 'Position / title is required.'
  } else if (position.length > 160) {
    errors.position = 'Position must be 160 characters or fewer.'
  }

  if (bio && bio.length > 800) {
    errors.bio = 'Bio must be 800 characters or fewer.'
  }

  const parsedOrder = Number.parseInt(displayOrderRaw, 10)
  const displayOrder = Number.isFinite(parsedOrder)
    ? Math.max(0, Math.min(9999, parsedOrder))
    : 0

  let photoFile: File | null = null
  if (uploadedPhoto instanceof File && uploadedPhoto.size > 0) {
    if (uploadedPhoto.size > MAX_TEAM_PHOTO_BYTES) {
      errors.photo = 'Photo must be 5 MB or smaller.'
    } else {
      const mime = uploadedPhoto.type.toLowerCase()
      const ext = uploadedPhoto.name.split('.').pop()?.toLowerCase() || ''
      const allowedExt = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'])
      if (!ALLOWED_IMAGE_MIME_TYPES.has(mime) && !allowedExt.has(ext)) {
        errors.photo = 'Upload a PNG, JPG, WEBP, AVIF, or SVG photo.'
      } else {
        photoFile = uploadedPhoto
      }
    }
  }

  const parsedDeptId = Number.parseInt(departmentIdRaw, 10)
  if (!newDepartmentName && (!Number.isInteger(parsedDeptId) || parsedDeptId <= 0)) {
    errors.department = 'Select a department or enter a new department name.'
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      errors,
      message: 'Please fix the highlighted team member details.',
    }
  }

  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  // Resolve or create Department
  let resolvedDepartmentId =
    Number.isInteger(parsedDeptId) && parsedDeptId > 0 ? parsedDeptId : 0

  if (newDepartmentName) {
    const deptSlug = slugifyTeamText(newDepartmentName) || 'team-department'
    const { data: existingDept } = await supabase
      .from('departments')
      .select('id')
      .eq('slug', deptSlug)
      .maybeSingle()

    if (existingDept?.id) {
      resolvedDepartmentId = existingDept.id
    } else {
      const { data: createdDept, error: deptError } = await supabase
        .from('departments')
        .insert({
          name: newDepartmentName,
          slug: deptSlug,
          display_order: 100,
          is_active: true,
        })
        .select('id')
        .single()

      if (deptError || !createdDept?.id) {
        return {
          status: 'error',
          message: `Failed to create department: ${deptError?.message || 'Unknown error'}`,
        }
      }
      resolvedDepartmentId = createdDept.id
    }
  }

  // Upload Photo to Supabase Storage public-media/team when a new File is selected
  let finalPhotoUrl = removePhoto ? null : photoUrlInput

  if (photoFile && !removePhoto) {
    const ext =
      EXTENSION_BY_MIME[photoFile.type.toLowerCase()] ||
      photoFile.name.split('.').pop()?.toLowerCase() ||
      'png'
    const objectPath = `team/${slugifyTeamText(fullName) || 'member'}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await photoFile.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('public-media')
      .upload(objectPath, buffer, {
        contentType: photoFile.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return {
        status: 'error',
        message: `Failed to upload photo: ${uploadError.message}`,
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from('public-media')
      .getPublicUrl(objectPath)
    finalPhotoUrl = publicUrlData.publicUrl
  }

  let savedMemberId = UUID_REGEX.test(rawId) ? rawId : ''
  let previousFullName: string | null = null

  if (savedMemberId) {
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('full_name')
      .eq('id', savedMemberId)
      .maybeSingle()
    previousFullName = existingMember?.full_name ?? null

    const { error: updateError } = await supabase
      .from('team_members')
      .update({
        department_id: resolvedDepartmentId,
        full_name: fullName,
        position,
        bio,
        photo_url: finalPhotoUrl,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: nowIso,
      })
      .eq('id', savedMemberId)

    if (updateError) {
      return {
        status: 'error',
        message: `Failed to update team member: ${updateError.message}`,
      }
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('team_members')
      .insert({
        department_id: resolvedDepartmentId,
        full_name: fullName,
        position,
        bio,
        photo_url: finalPhotoUrl,
        display_order: displayOrder,
        is_active: isActive,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select('id')
      .single()

    if (insertError || !inserted?.id) {
      return {
        status: 'error',
        message: `Failed to add team member: ${insertError?.message || 'Unknown error'}`,
      }
    }
    savedMemberId = inserted.id
  }

  // Mark roster seeded so deleting/updating doesn't restore defaults unexpectedly
  try {
    await supabase.from('site_settings').upsert(
      {
        setting_key: TEAM_SEEDED_SETTING_KEY,
        setting_value: true,
        updated_at: nowIso,
        updated_by: profile.id,
      },
      { onConflict: 'setting_key' },
    )
  } catch {
    // Non-fatal under editor/publisher roles
  }

  await syncTeamMemberToAuthor(supabase, {
    previousFullName,
    fullName,
    photoUrl: finalPhotoUrl,
    isActive,
  })

  revalidateTeamSurfaces()

  return {
    status: 'success',
    memberId: savedMemberId,
    message: rawId
      ? `${fullName} updated across the website in real time.`
      : `${fullName} added to the team roster.`,
  }
}

export async function deleteTeamMemberAction(formData: FormData) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to delete team members.')
  }

  const memberId = (formData.get('memberId') as string | null)?.trim() || ''
  if (!UUID_REGEX.test(memberId)) {
    throw new Error('Valid team member ID is required.')
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('team_members')
    .select('full_name, photo_url')
    .eq('id', memberId)
    .maybeSingle()

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    throw new Error(`Failed to delete team member: ${error.message}`)
  }

  if (existing?.full_name) {
    await syncTeamMemberToAuthor(supabase, {
      fullName: existing.full_name,
      photoUrl: existing.photo_url,
      isActive: false,
    })
  }

  revalidateTeamSurfaces()
  return { success: true }
}

export async function toggleTeamMemberVisibilityAction(
  memberId: string,
  nextActive: boolean,
) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to update team member visibility.')
  }

  if (!UUID_REGEX.test(memberId)) {
    throw new Error('Valid team member ID is required.')
  }

  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('team_members')
    .update({
      is_active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .select('full_name, photo_url')
    .single()

  if (error) {
    throw new Error(`Failed to update visibility: ${error.message}`)
  }

  if (updated?.full_name) {
    await syncTeamMemberToAuthor(supabase, {
      fullName: updated.full_name,
      photoUrl: updated.photo_url,
      isActive: nextActive,
    })
  }

  revalidateTeamSurfaces()
  return { success: true }
}

function validateMemberIds(memberIds: string[]): string[] {
  const uniqueIds = Array.from(
    new Set(memberIds.map((id) => id.trim()).filter((id) => UUID_REGEX.test(id))),
  )
  if (uniqueIds.length === 0) {
    throw new Error('Select at least one valid team member.')
  }
  return uniqueIds
}

export async function bulkSetTeamMembersVisibilityAction(
  memberIds: string[],
  isActive: boolean,
): Promise<{ success: boolean; count: number }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to update team member visibility.')
  }

  const validIds = validateMemberIds(memberIds)
  const supabase = await createClient()

  const { data: updatedRows, error } = await supabase
    .from('team_members')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .in('id', validIds)
    .select('id, full_name, photo_url')

  if (error) {
    throw new Error(`Failed to update visibility: ${error.message}`)
  }

  for (const row of updatedRows || []) {
    if (row.full_name) {
      await syncTeamMemberToAuthor(supabase, {
        fullName: row.full_name,
        photoUrl: row.photo_url,
        isActive,
      })
    }
  }

  revalidateTeamSurfaces()
  return { success: true, count: updatedRows?.length ?? validIds.length }
}

export async function bulkDeleteTeamMembersAction(
  memberIds: string[],
): Promise<{ success: boolean; count: number }> {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canEditDraft(profile.roleKey)) {
    throw new Error('Unauthorized to delete team members.')
  }

  const validIds = validateMemberIds(memberIds)
  const supabase = await createClient()

  const { data: existingRows } = await supabase
    .from('team_members')
    .select('id, full_name, photo_url')
    .in('id', validIds)

  const { error } = await supabase
    .from('team_members')
    .delete()
    .in('id', validIds)

  if (error) {
    throw new Error(`Failed to delete team members: ${error.message}`)
  }

  for (const row of existingRows || []) {
    if (row.full_name) {
      await syncTeamMemberToAuthor(supabase, {
        fullName: row.full_name,
        photoUrl: row.photo_url,
        isActive: false,
      })
    }
  }

  revalidateTeamSurfaces()
  return { success: true, count: existingRows?.length ?? validIds.length }
}
