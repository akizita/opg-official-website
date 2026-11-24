import { createHash } from 'node:crypto'
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

  const emailHash = createHash('sha256')
    .update(session.email.trim().toLowerCase())
    .digest('hex')
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=96&d=404`

  return NextResponse.json(
    {
      avatarUrl: session.avatarUrl,
      displayName: session.displayName,
      email: session.email,
      gravatarUrl,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
