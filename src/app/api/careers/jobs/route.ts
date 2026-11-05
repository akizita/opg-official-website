import { NextResponse } from 'next/server'

import { getCareersFeed } from '@/lib/jazzhr/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const feed = await getCareersFeed()
    return NextResponse.json(feed, {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch careers',
        fetchedAt: null,
        jobs: [],
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
        status: 500,
      },
    )
  }
}
