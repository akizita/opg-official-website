import { sanitizeAvatarUrl } from '@/lib/auth/avatar-utils'
import {
  buildGravatarUrl,
  resolveAuthAvatarsByEmail,
} from '@/lib/auth/user-avatars'
import {
  getApprovedCandidateTestimonials,
  type CandidateTestimonial,
} from '@/lib/content/candidate-testimonials'
import { createPrivilegedClient } from '@/lib/supabase/server'

export type HomeCandidateTestimonial = CandidateTestimonial & {
  avatarUrl?: string | null
  gravatarUrl?: string | null
}

type CandidatePhotoLookupRow = {
  avatar_url?: string | null
  email: string
  id: string
  profile_photo_data?: string | null
  profile_photo_path?: string | null
}

/**
 * Loads approved candidate testimonials for the Home page in the same order
 * shown on `/testimonials`, enriching each card with non-sensitive avatar URLs
 * without ever exposing candidate email addresses in public props.
 */
export async function getHomeCandidateTestimonials(
  limit = 4,
): Promise<HomeCandidateTestimonial[]> {
  const approved = await getApprovedCandidateTestimonials()
  const selected = approved.slice(0, Math.max(0, limit))
  if (selected.length === 0) return []

  const privileged = createPrivilegedClient()
  if (!privileged) {
    return selected.map((story) => ({
      ...story,
      avatarUrl: null,
      gravatarUrl: null,
    }))
  }

  try {
    const ids = selected.map((story) => story.id)
    const runPhotoLookup = (columns: string) =>
      privileged
        .from('candidate_testimonials')
        .select(columns)
        .eq('status', 'approved')
        .in('id', ids)

    let { data, error } = await runPhotoLookup(
      'id, email, avatar_url, profile_photo_data, profile_photo_path',
    )

    if (error?.code === '42703') {
      ;({ data, error } = await runPhotoLookup(
        'id, email, profile_photo_data, profile_photo_path',
      ))
    }

    if (error?.code === '42703') {
      ;({ data, error } = await runPhotoLookup('id, email, profile_photo_path'))
    }

    if (error?.code === '42703') {
      ;({ data, error } = await runPhotoLookup('id, email'))
    }

    if (error || !data) {
      return selected.map((story) => ({
        ...story,
        avatarUrl: null,
        gravatarUrl: null,
      }))
    }

    const rows = data as unknown as CandidatePhotoLookupRow[]
    const rowById = new Map(rows.map((row) => [row.id, row]))
    const storagePaths = rows.flatMap((row) =>
      row.profile_photo_path ? [row.profile_photo_path] : [],
    )

    const [signedUrls, authAvatars] = await Promise.all([
      (async () => {
        const map = new Map<string, string>()
        if (storagePaths.length > 0) {
          const { data: signed } = await privileged.storage
            .from('candidate-profile-photos')
            .createSignedUrls(storagePaths, 3600)
          signed?.forEach((entry, index) => {
            if (entry.signedUrl) map.set(storagePaths[index], entry.signedUrl)
          })
        }
        return map
      })(),
      resolveAuthAvatarsByEmail(rows.map((row) => row.email)),
    ])

    return selected.map((story) => {
      const lookup = rowById.get(story.id)
      if (!lookup) {
        return { ...story, avatarUrl: null, gravatarUrl: null }
      }

      const normalizedEmail = lookup.email?.trim().toLowerCase() || ''
      const avatarUrl =
        (lookup.profile_photo_path
          ? signedUrls.get(lookup.profile_photo_path)
          : null) ??
        (lookup.profile_photo_data
          ? `data:image/webp;base64,${lookup.profile_photo_data}`
          : null) ??
        sanitizeAvatarUrl(lookup.avatar_url) ??
        (normalizedEmail ? authAvatars.get(normalizedEmail) : null) ??
        null

      return {
        ...story,
        avatarUrl,
        gravatarUrl: buildGravatarUrl(lookup.email),
      }
    })
  } catch {
    return selected.map((story) => ({
      ...story,
      avatarUrl: null,
      gravatarUrl: null,
    }))
  }
}
