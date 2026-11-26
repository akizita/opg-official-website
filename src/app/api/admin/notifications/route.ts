import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewContent, canViewInquiries } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export type PendingTestimonialAlert = {
  id: string
  author_name: string
  role_title: string | null
  submitted_at: string
}

export async function GET() {
  const { profile } = await requireAdminSession({ requireAal2: true })
  const canCheckInquiries = canViewInquiries(profile.roleKey)
  const canCheckTestimonials = canViewContent(profile.roleKey)

  if (!canCheckInquiries && !canCheckTestimonials) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let pendingTestimonials: PendingTestimonialAlert[] = []

  if (canCheckTestimonials) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('candidate_testimonials')
      .select('id, author_name, role_title, submitted_at')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
      .limit(20)

    if (!error && Array.isArray(data)) {
      pendingTestimonials = data as PendingTestimonialAlert[]
    }
  }

  return NextResponse.json(
    {
      canViewTestimonials: canCheckTestimonials,
      pendingTestimonials,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
