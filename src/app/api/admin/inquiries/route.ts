import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/auth/admin-session'
import { canViewInquiries } from '@/lib/auth/permissions'
import { loadAdminInquiries } from '@/lib/content/admin-inquiries'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { profile } = await requireAdminSession({ requireAal2: true })
  if (!canViewInquiries(profile.roleKey)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { error, inquiries } = await loadAdminInquiries(supabase)

  if (error) {
    return NextResponse.json(
      { error: 'Could not load contacts.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { inquiries },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
