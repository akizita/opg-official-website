'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { uploadProfileAvatarFile } from '@/lib/auth/avatar-upload'
import { getVisitorSession } from '@/lib/auth/visitor-session'
import { createClient } from '@/lib/supabase/server'

export type VisitorProfileFormState = {
  status: 'idle' | 'error' | 'success'
  message: string
}

export async function updateVisitorProfileAction(
  _previousState: VisitorProfileFormState,
  formData: FormData,
): Promise<VisitorProfileFormState> {
  const session = await getVisitorSession()
  if (!session) {
    return {
      status: 'error',
      message: 'Sign in again before updating your profile.',
    }
  }

  const rawName = formData.get('fullName')
  const fullName =
    typeof rawName === 'string' ? rawName.trim().slice(0, 80) : ''
  const avatarFile = formData.get('avatar')

  const nextMetadata: Record<string, unknown> = {
    full_name: fullName || null,
  }

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const uploadResult = await uploadProfileAvatarFile(avatarFile, session.id)
    if (!uploadResult.ok) {
      return { status: 'error', message: uploadResult.error }
    }
    nextMetadata.avatar_url = uploadResult.avatarUrl
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ data: nextMetadata })
  if (error) {
    return {
      status: 'error',
      message: 'Could not update your profile right now. Please try again.',
    }
  }

  revalidatePath('/')
  revalidatePath('/account')

  return {
    status: 'success',
    message: 'Profile saved.',
  }
}

export async function visitorSignOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
