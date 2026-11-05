import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { getCareersFeed } from '@/lib/jazzhr/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    revalidatePath('/careers')
    revalidatePath('/careers/[slug]', 'page')
    const feed = await getCareersFeed()
    return NextResponse.json({
      count: feed.jobs.length,
      jobs: feed.jobs.map((job) => ({ id: job.id, title: job.title })),
      revalidated: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to revalidate jobs',
        revalidated: false,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return POST()
}
