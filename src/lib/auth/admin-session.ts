import { redirect } from 'next/navigation'

import {
  DESIGNATED_SUPER_ADMIN_EMAIL,
  isAdminMfaRequired,
} from '@/lib/auth/config'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export type AdminProfile = {
  displayName: string
  email: string
  id: string
  isActive: boolean
  roleDisplayName: string
  roleKey: string
}

export type AdminSession = {
  currentLevel: 'aal1' | 'aal2' | null
  nextLevel: 'aal1' | 'aal2' | null
  profile: AdminProfile
}

async function provisionDesignatedSuperAdmin(
  userId: string,
  email: string,
) {
  if (email !== DESIGNATED_SUPER_ADMIN_EMAIL) return false

  const privilegedClient = createPrivilegedClient()
  if (!privilegedClient) return false

  const { data: role, error: roleError } = await privilegedClient
    .from('roles')
    .select('id')
    .eq('role_key', 'super_admin')
    .eq('is_active', true)
    .maybeSingle()

  if (roleError || !role) return false

  const { error: profileError } = await privilegedClient
    .from('admin_profiles')
    .upsert(
      {
        id: userId,
        display_name: 'OPG',
        role_id: role.id,
        is_active: true,
      },
      { onConflict: 'id' },
    )

  return !profileError
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) return null

  const email =
    typeof claimsData.claims.email === 'string'
      ? claimsData.claims.email.trim().toLowerCase()
      : ''

  let { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('id, display_name, role_id, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (
    (!profile || !profile.is_active) &&
    email === DESIGNATED_SUPER_ADMIN_EMAIL
  ) {
    const provisioned = await provisionDesignatedSuperAdmin(userId, email)

    if (provisioned) {
      const response = await supabase
        .from('admin_profiles')
        .select('id, display_name, role_id, is_active')
        .eq('id', userId)
        .maybeSingle()

      profile = response.data
      profileError = response.error
    }
  }

  if (profileError || !profile || !profile.is_active) return null

  const [{ data: role, error: roleError }, aalResponse] = await Promise.all([
    supabase
      .from('roles')
      .select('role_key, display_name, is_active')
      .eq('id', profile.role_id)
      .maybeSingle(),
    isAdminMfaRequired()
      ? supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      : Promise.resolve({
          data: { currentLevel: 'aal1', nextLevel: 'aal1' },
          error: null,
        }),
  ])

  if (roleError || !role?.is_active || aalResponse.error) return null

  return {
    currentLevel: aalResponse.data.currentLevel as 'aal1' | 'aal2' | null,
    nextLevel: aalResponse.data.nextLevel as 'aal1' | 'aal2' | null,
    profile: {
      displayName: profile.display_name,
      email,
      id: profile.id,
      isActive: profile.is_active,
      roleDisplayName: role.display_name,
      roleKey: role.role_key,
    },
  }
}

export function getAdminAuthDestination(session: AdminSession) {
  if (!isAdminMfaRequired()) return '/admin'
  if (session.currentLevel === 'aal2') return '/admin'
  if (session.nextLevel === 'aal2') return '/admin/mfa/challenge'
  return '/admin/mfa/enroll'
}

export async function requireAdminSession(options?: { requireAal2?: boolean }) {
  const session = await getAdminSession()

  if (!session) redirect('/admin/sign-in')

  if (
    options?.requireAal2 &&
    isAdminMfaRequired() &&
    session.currentLevel !== 'aal2'
  ) {
    redirect(getAdminAuthDestination(session))
  }

  return session
}
