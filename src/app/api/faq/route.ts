import { NextRequest, NextResponse } from 'next/server'

import { loadFaqKnowledge } from '@/lib/faq-assistant/google-doc-source'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1'
  const knowledge = await loadFaqKnowledge({ forceRefresh })

  return NextResponse.json(
    {
      categories: knowledge.categories,
      faqs: knowledge.items,
      starterQuestions: knowledge.starterQuestions,
      source: knowledge.source,
      syncedAt: knowledge.syncedAt,
    },
    {
      headers: {
        'Cache-Control': forceRefresh
          ? 'no-store'
          : 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
}
