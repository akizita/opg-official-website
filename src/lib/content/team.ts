import { createClient } from '@/lib/supabase/server'

export type Department = {
  created_at: string
  display_order: number
  id: number
  is_active: boolean
  name: string
  slug: string
  updated_at: string
}

export type TeamMember = {
  bio: string | null
  created_at: string
  department_id: number
  display_order: number
  full_name: string
  id: string
  is_active: boolean
  photo_url: string | null
  position: string
  updated_at: string
}

export type DepartmentWithMembers = Department & {
  members: TeamMember[]
}

export async function getActiveDepartmentsWithMembers(): Promise<
  DepartmentWithMembers[]
> {
  const supabase = await createClient()

  const [departmentsRes, membersRes] = await Promise.all([
    supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ])

  if (departmentsRes.error || !departmentsRes.data) {
    return []
  }

  const departments = departmentsRes.data as Department[]
  const members = (membersRes.data as TeamMember[]) || []

  return departments.map((dept) => ({
    ...dept,
    members: members.filter((m) => m.department_id === dept.id),
  }))
}

