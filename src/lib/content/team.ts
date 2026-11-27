import type { SupabaseClient } from '@supabase/supabase-js'

import { OPG_TEAM_MEMBERS } from '@/lib/content/team-media'
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

export type AdminTeamMemberItem = TeamMember & {
  department_name: string
}

export type PublicTeamMember = {
  id: string
  departmentId: number | null
  department: string
  name: string
  role: string
  headline: string
  bio: string
  image: string
  alt: string
  linkedin: string
  masonryHeight: number
  displayOrder: number
  isActive: boolean
}

export const TEAM_SEEDED_SETTING_KEY = 'team_seeded_v1'
export const CANONICAL_TEAM_DEPARTMENTS = [
  'Talent Acquisition',
  'Marketing',
  'Automation',
] as const

const CANONICAL_DEPARTMENT_SLUGS = new Map<string, number>([
  ['talent-acquisition', 1],
  ['marketing', 2],
  ['automation', 3],
])

const DEFAULT_COMPANY_LINKEDIN =
  'https://www.linkedin.com/company/outsourced-pro-global'
const DEFAULT_MASONRY_HEIGHTS = [
  156, 165, 156, 184, 168, 154, 170, 184, 156, 162, 154,
] as const

export function slugifyTeamText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resolveCanonicalDepartmentName(
  rawDepartment: string,
): (typeof CANONICAL_TEAM_DEPARTMENTS)[number] {
  const normalized = rawDepartment.toLowerCase().trim()
  if (normalized.includes('marketing') || normalized.includes('brand')) {
    return 'Marketing'
  }
  if (normalized.includes('automation')) {
    return 'Automation'
  }
  return 'Talent Acquisition'
}

function compareTeamNamesAlphabetically(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

function sortDepartmentsCanonically(departments: Department[]): Department[] {
  return [...departments].sort((a, b) => {
    const orderA = CANONICAL_DEPARTMENT_SLUGS.get(a.slug) ?? 99
    const orderB = CANONICAL_DEPARTMENT_SLUGS.get(b.slug) ?? 99
    if (orderA !== orderB) return orderA - orderB
    return compareTeamNamesAlphabetically(a.name, b.name)
  })
}

function mapFallbackMembers(): PublicTeamMember[] {
  const sorted = [...OPG_TEAM_MEMBERS].sort((a, b) =>
    compareTeamNamesAlphabetically(a.name, b.name),
  )
  return sorted.map((member, index) => ({
    id: member.id,
    departmentId: null,
    department: resolveCanonicalDepartmentName(member.department),
    name: member.name,
    role: member.role,
    headline: member.headline,
    bio: member.bio,
    image: member.image,
    alt: member.alt,
    linkedin: member.linkedin,
    masonryHeight: DEFAULT_MASONRY_HEIGHTS[index] ?? 162,
    displayOrder: index + 1,
    isActive: true,
  }))
}

/** Keeps an author profile in public.authors aligned with team member edits. */
export async function syncTeamMemberToAuthor(
  db: SupabaseClient,
  input: {
    previousFullName?: string | null
    fullName: string
    photoUrl: string | null
    isActive: boolean
  },
): Promise<void> {
  const fullName = input.fullName.trim()
  if (!fullName) return

  const slug = slugifyTeamText(fullName) || 'team-member'
  const previousSlug = input.previousFullName
    ? slugifyTeamText(input.previousFullName)
    : null

  try {
    let existingId: string | null = null

    if (previousSlug && previousSlug !== slug) {
      const { data: byPrevSlug } = await db
        .from('authors')
        .select('id')
        .eq('slug', previousSlug)
        .maybeSingle()
      if (byPrevSlug?.id) existingId = byPrevSlug.id
    }

    if (!existingId) {
      const { data: bySlug } = await db
        .from('authors')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (bySlug?.id) existingId = bySlug.id
    }

    if (existingId) {
      await db
        .from('authors')
        .update({
          slug,
          full_name: fullName,
          avatar_url: input.photoUrl || null,
          is_active: input.isActive,
        })
        .eq('id', existingId)
    } else if (input.isActive) {
      await db.from('authors').insert({
        slug,
        full_name: fullName,
        avatar_url: input.photoUrl || null,
        is_active: true,
      })
    }
  } catch {
    // Non-fatal: author sync should not block team management operations.
  }
}

/**
 * Ensures the 3 canonical team departments (Talent Acquisition, Marketing, Automation)
 * exist in public.departments and consolidates any legacy sub-departments cleanly.
 */
async function ensureCanonicalTeamDepartments(
  supabase: SupabaseClient,
): Promise<Department[]> {
  const { data: existingDepts, error } = await supabase
    .from('departments')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return []
  }

  const currentDepts = (existingDepts as Department[]) || []
  const deptBySlug = new Map<string, Department>()
  for (const dept of currentDepts) {
    deptBySlug.set(dept.slug, dept)
  }

  const hasMissingCanonical = CANONICAL_TEAM_DEPARTMENTS.some(
    (name) => !deptBySlug.has(slugifyTeamText(name)),
  )
  const legacyDepts = currentDepts.filter(
    (dept) => !CANONICAL_DEPARTMENT_SLUGS.has(dept.slug),
  )

  if (!hasMissingCanonical && legacyDepts.length === 0) {
    return sortDepartmentsCanonically(currentDepts)
  }

  try {
    for (let i = 0; i < CANONICAL_TEAM_DEPARTMENTS.length; i++) {
      const canonicalName = CANONICAL_TEAM_DEPARTMENTS[i]
      const canonicalSlug = slugifyTeamText(canonicalName)
      const existing = deptBySlug.get(canonicalSlug)

      if (!existing) {
        const { data: inserted } = await supabase
          .from('departments')
          .insert({
            name: canonicalName,
            slug: canonicalSlug,
            display_order: i + 1,
            is_active: true,
          })
          .select('*')
          .maybeSingle()

        if (inserted) {
          deptBySlug.set(canonicalSlug, inserted as Department)
        }
      } else if (
        existing.name !== canonicalName ||
        !existing.is_active ||
        existing.display_order !== i + 1
      ) {
        const { data: updated } = await supabase
          .from('departments')
          .update({
            name: canonicalName,
            display_order: i + 1,
            is_active: true,
          })
          .eq('id', existing.id)
          .select('*')
          .maybeSingle()

        if (updated) {
          deptBySlug.set(canonicalSlug, updated as Department)
        }
      }
    }

    for (const legacyDept of legacyDepts) {
      const canonicalName = resolveCanonicalDepartmentName(legacyDept.name)
      const targetDept = deptBySlug.get(slugifyTeamText(canonicalName))
      if (!targetDept || targetDept.id === legacyDept.id) continue

      await supabase
        .from('team_members')
        .update({ department_id: targetDept.id })
        .eq('department_id', legacyDept.id)

      await supabase.from('departments').delete().eq('id', legacyDept.id)
    }

    const canonicalList = CANONICAL_TEAM_DEPARTMENTS.map((name) =>
      deptBySlug.get(slugifyTeamText(name)),
    ).filter((dept): dept is Department => Boolean(dept))

    if (canonicalList.length > 0) {
      return sortDepartmentsCanonically(canonicalList)
    }
  } catch {
    // Non-fatal under read-only/restricted RLS or minimal mocks
  }

  return sortDepartmentsCanonically(currentDepts)
}

/**
 * Seeds the 11 baseline team specialists into Supabase on first admin visit when
 * team_members is empty and has not previously been initialized.
 */
export async function ensureInitialTeamRosterSeeded(
  supabase: SupabaseClient,
): Promise<void> {
  try {
    const [{ count }, { data: seededFlag }] = await Promise.all([
      supabase.from('team_members').select('id', { count: 'exact', head: true }),
      supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', TEAM_SEEDED_SETTING_KEY)
        .maybeSingle(),
    ])

    if ((count ?? 0) > 0 || seededFlag) {
      return
    }

    const canonicalDepts = await ensureCanonicalTeamDepartments(supabase)
    const deptIdBySlug = new Map<string, number>(
      canonicalDepts.map((dept) => [dept.slug, dept.id]),
    )

    const sortedSeedMembers = [...OPG_TEAM_MEMBERS].sort((a, b) =>
      compareTeamNamesAlphabetically(a.name, b.name),
    )

    const memberRows = sortedSeedMembers
      .map((member, index) => {
        const canonicalName = resolveCanonicalDepartmentName(member.department)
        const deptSlug = slugifyTeamText(canonicalName)
        const departmentId = deptIdBySlug.get(deptSlug)
        if (!departmentId) return null
        return {
          department_id: departmentId,
          full_name: member.name,
          position: member.role,
          bio: member.bio,
          photo_url: member.image,
          display_order: index + 1,
          is_active: true,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (memberRows.length > 0) {
      await supabase.from('team_members').insert(memberRows)
      for (const member of sortedSeedMembers) {
        await syncTeamMemberToAuthor(supabase, {
          fullName: member.name,
          photoUrl: member.image,
          isActive: true,
        })
      }
    }

    await supabase.from('site_settings').upsert(
      {
        setting_key: TEAM_SEEDED_SETTING_KEY,
        setting_value: true,
        description: 'Marks initial team_members baseline seeding completed',
      },
      { onConflict: 'setting_key' },
    )
  } catch {
    // Gracefully allow manual creation if seeding fails under restricted roles
  }
}

export async function getAdminTeamData(client?: SupabaseClient): Promise<{
  departments: Department[]
  members: AdminTeamMemberItem[]
}> {
  const supabase = client ?? (await createClient())
  await ensureInitialTeamRosterSeeded(supabase)
  const departments = await ensureCanonicalTeamDepartments(supabase)

  const membersRes = await supabase
    .from('team_members')
    .select('*')
    .order('full_name', { ascending: true })

  const deptNameMap = new Map<number, string>(
    departments.map((d) => [d.id, d.name]),
  )

  const members: AdminTeamMemberItem[] = (
    (membersRes.data as TeamMember[]) || []
  )
    .map((member) => ({
      ...member,
      department_name:
        deptNameMap.get(member.department_id) || CANONICAL_TEAM_DEPARTMENTS[0],
    }))
    .sort((a, b) => compareTeamNamesAlphabetically(a.full_name, b.full_name))

  return { departments, members }
}

export async function getPublicTeamMembers(
  client?: SupabaseClient,
): Promise<PublicTeamMember[]> {
  try {
    const supabase = client ?? (await createClient())

    const [departmentsRes, membersRes, seededRes] = await Promise.all([
      supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true }),
      supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', TEAM_SEEDED_SETTING_KEY)
        .maybeSingle(),
    ])

    if (departmentsRes.error || membersRes.error) {
      return mapFallbackMembers()
    }

    const dbMembers = ((membersRes.data as TeamMember[]) || []).sort((a, b) =>
      compareTeamNamesAlphabetically(a.full_name, b.full_name),
    )
    const isSeeded = Boolean(seededRes.data?.setting_value)

    if (dbMembers.length === 0) {
      return isSeeded ? [] : mapFallbackMembers()
    }

    const departments = (departmentsRes.data as Department[]) || []
    const deptNameMap = new Map<number, string>(
      departments.map((d) => [d.id, resolveCanonicalDepartmentName(d.name)]),
    )
    const fallbackBySlug = new Map(
      OPG_TEAM_MEMBERS.map((m) => [slugifyTeamText(m.name), m]),
    )

    return dbMembers.map((member, index) => {
      const seedMatch = fallbackBySlug.get(slugifyTeamText(member.full_name))
      const departmentName =
        deptNameMap.get(member.department_id) ||
        resolveCanonicalDepartmentName(seedMatch?.department || '')
      const bio =
        member.bio?.trim() ||
        seedMatch?.bio ||
        `${member.full_name} serves as ${member.position} at Outsourced Pro Global.`
      const headline =
        seedMatch?.headline ||
        bio.split(/[.!?]/)[0]?.trim() ||
        member.position

      return {
        id: member.id,
        departmentId: member.department_id,
        department: departmentName,
        name: member.full_name,
        role: member.position,
        headline,
        bio,
        image: member.photo_url || seedMatch?.image || '',
        alt: `${member.full_name}, ${member.position} at Outsourced Pro Global`,
        linkedin: seedMatch?.linkedin || DEFAULT_COMPANY_LINKEDIN,
        masonryHeight:
          DEFAULT_MASONRY_HEIGHTS[index % DEFAULT_MASONRY_HEIGHTS.length] ??
          162,
        displayOrder: member.display_order,
        isActive: member.is_active,
      }
    })
  } catch {
    return mapFallbackMembers()
  }
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
  const members = ((membersRes.data as TeamMember[]) || []).sort((a, b) =>
    compareTeamNamesAlphabetically(a.full_name, b.full_name),
  )

  return departments.map((dept) => ({
    ...dept,
    members: members.filter((m) => m.department_id === dept.id),
  }))
}
