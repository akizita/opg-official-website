import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

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

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (claimsError || !userId) return null

  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('id, display_name, role_id, is_active')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile || !profile.is_active) return null

  const [{ data: role, error: roleError }, { data: aal, error: aalError }] =
    await Promise.all([
      supabase
        .from('roles')
        .select('role_key, display_name, is_active')
        .eq('id', profile.role_id)
        .maybeSingle(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ])

  if (roleError || !role?.is_active || aalError) return null

  return {
    currentLevel: aal.currentLevel,
    nextLevel: aal.nextLevel,
    profile: {
      displayName: profile.display_name,
      email:
        typeof claimsData.claims.email === 'string'
          ? claimsData.claims.email
          : '',
      id: profile.id,
      isActive: profile.is_active,
      roleDisplayName: role.display_name,
      roleKey: role.role_key,
    },
  }
}

export function getAdminAuthDestination(session: AdminSession) {
  if (session.currentLevel === 'aal2') return '/admin'
  if (session.nextLevel === 'aal2') return '/admin/mfa/challenge'
  return '/admin/mfa/enroll'
}

export async function requireAdminSession(options?: { requireAal2?: boolean }) {
  const session = await getAdminSession()

  if (!session) redirect('/admin/sign-in')

  if (options?.requireAal2 && session.currentLevel !== 'aal2') {
    redirect(getAdminAuthDestination(session))
  }

  return session
}
