import type { SupabaseClient } from '@supabase/supabase-js'

import type { RichTextBlock } from '@/lib/content/page-documents'
import type { Department } from '@/lib/content/team'
import { createClient } from '@/lib/supabase/server'

export type WorkArrangement = 'remote' | 'hybrid' | 'onsite'
export type EmploymentType = 'full_time' | 'part_time' | 'contract'

export type JobOpening = {
  id: string
  slug: string
  title: string
  department_id: number
  department?: Department | null
  location: string
  work_arrangement: WorkArrangement
  employment_type: EmploymentType
  summary: string | null
  description: RichTextBlock[]
  external_apply_url: string
  close_date: string | null
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at: string | null
}

export type JobOpeningInput = {
  title: string
  slug?: string
  department_id: number
  location?: string
  work_arrangement?: WorkArrangement
  employment_type?: EmploymentType
  summary?: string | null
  description?: RichTextBlock[]
  external_apply_url: string
  close_date?: string | null
  status?: JobOpening['status']
}

export function validateJobOpeningInput(input: unknown): {
  data: JobOpeningInput | null
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  if (!input || typeof input !== 'object') {
    return { data: null, errors: { form: 'Invalid job opening input' } }
  }

  const raw = input as Record<string, unknown>
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const externalApplyUrl =
    typeof raw.external_apply_url === 'string' ? raw.external_apply_url.trim() : ''
  const slug = typeof raw.slug === 'string' ? raw.slug.trim().toLowerCase() : undefined

  if (!title) {
    errors.title = 'Title is required'
  } else if (title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer'
  }

  if (slug !== undefined && slug !== '') {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and single hyphens'
    }
  }

  if (!externalApplyUrl) {
    errors.external_apply_url = 'External apply URL is required'
  } else if (!/^https?:\/\//i.test(externalApplyUrl)) {
    errors.external_apply_url = 'Apply URL must begin with http:// or https://'
  }

  const departmentId =
    typeof raw.department_id === 'number'
      ? raw.department_id
      : Number(raw.department_id)

  if (isNaN(departmentId) || departmentId <= 0) {
    errors.department_id = 'A valid department is required'
  }

  const validArrangements: WorkArrangement[] = ['remote', 'hybrid', 'onsite']
  const workArrangement =
    typeof raw.work_arrangement === 'string' &&
    validArrangements.includes(raw.work_arrangement as WorkArrangement)
      ? (raw.work_arrangement as WorkArrangement)
      : 'remote'

  const validTypes: EmploymentType[] = ['full_time', 'part_time', 'contract']
  const employmentType =
    typeof raw.employment_type === 'string' &&
    validTypes.includes(raw.employment_type as EmploymentType)
      ? (raw.employment_type as EmploymentType)
      : 'full_time'

  let description: RichTextBlock[] = []
  if (Array.isArray(raw.description)) {
    description = raw.description as RichTextBlock[]
  }

  return {
    data:
      Object.keys(errors).length === 0
        ? {
            title,
            slug,
            department_id: departmentId,
            location: typeof raw.location === 'string' ? raw.location.trim() : 'Remote',
            work_arrangement: workArrangement,
            employment_type: employmentType,
            summary: typeof raw.summary === 'string' ? raw.summary.trim() : null,
            description,
            external_apply_url: externalApplyUrl,
            close_date: typeof raw.close_date === 'string' ? raw.close_date : null,
            status: (typeof raw.status === 'string' ? raw.status : 'draft') as JobOpening['status'],
          }
        : null,
    errors,
  }
}

export async function getPublishedJobOpenings(options?: {
  departmentSlug?: string
  workArrangement?: WorkArrangement
  client?: SupabaseClient
}): Promise<JobOpening[]> {
  const supabase = options?.client ?? (await createClient())

  let query = supabase
    .from('job_openings')
    .select(`
      *,
      department:departments(*)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options?.workArrangement) {
    query = query.eq('work_arrangement', options.workArrangement)
  }

  const { data, error } = await query

  if (error || !data) return []

  let openings: JobOpening[] = data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    department_id: row.department_id,
    department: row.department || null,
    location: row.location,
    work_arrangement: row.work_arrangement as WorkArrangement,
    employment_type: row.employment_type as EmploymentType,
    summary: row.summary,
    description: (row.description as RichTextBlock[]) || [],
    external_apply_url: row.external_apply_url,
    close_date: row.close_date,
    status: row.status as JobOpening['status'],
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
  }))

  if (options?.departmentSlug) {
    openings = openings.filter((op) => op.department?.slug === options.departmentSlug)
  }

  return openings
}

export async function getJobOpeningBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<JobOpening | null> {
  const supabase = client ?? (await createClient())

  const { data, error } = await supabase
    .from('job_openings')
    .select(`
      *,
      department:departments(*)
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    department_id: data.department_id,
    department: data.department || null,
    location: data.location,
    work_arrangement: data.work_arrangement as WorkArrangement,
    employment_type: data.employment_type as EmploymentType,
    summary: data.summary,
    description: (data.description as RichTextBlock[]) || [],
    external_apply_url: data.external_apply_url,
    close_date: data.close_date,
    status: data.status as JobOpening['status'],
    created_at: data.created_at,
    updated_at: data.updated_at,
    published_at: data.published_at,
  }
}

