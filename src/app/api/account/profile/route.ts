import { NextResponse } from 'next/server'

import { getVisitorSession } from '@/lib/auth/visitor-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getVisitorSession()
  if (!session) {
    return NextResponse.json(
      { avatarUrl: null, displayName: null, email: null, gravatarUrl: null },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    {
      avatarUrl: session.avatarUrl,
      displayName: session.displayName,
      email: session.email,
      gravatarUrl: null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
