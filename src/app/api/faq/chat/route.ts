import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import {
  buildDeterministicFallbackAnswer,
  buildGroundedSystemPrompt,
  checkFaqChatRateLimit,
  rankFaqMatches,
  sanitizeChatHistory,
  sanitizeChatMessage,
  shouldSuggestContact,
  type FaqSourceCitation,
} from '@/lib/faq-assistant/chat-service'
import { loadFaqKnowledge } from '@/lib/faq-assistant/google-doc-source'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0]?.trim() || realIp?.trim() || 'local-client'
}

function encodeSseEvent(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`)
}

function createSseStreamResponse(
  produce: (send: (payload: Record<string, unknown>) => void) => Promise<void>,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encodeSseEvent(payload))
      }
      try {
        await produce(send)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
    },
  })
}

export async function POST(request: NextRequest) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body.' },
      { status: 400 },
    )
  }

  const body =
    rawBody && typeof rawBody === 'object'
      ? (rawBody as Record<string, unknown>)
      : {}

  const messageValidation = sanitizeChatMessage(body.message)
  if (!messageValidation.ok) {
    return NextResponse.json(
      { error: messageValidation.error },
      { status: 400 },
    )
  }

  const clientIp = getClientIdentifier(request)
  const rateLimit = checkFaqChatRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          'You have sent several questions in a short time. Please wait a moment and try again.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    )
  }

  const userMessage = messageValidation.message
  const history = sanitizeChatHistory(body.history)
  const knowledge = await loadFaqKnowledge()

  const recentUserContext = [
    ...history.filter((turn) => turn.role === 'user').slice(-1).map((t) => t.content),
    userMessage,
  ].join(' ')

  const matchedItems = rankFaqMatches(userMessage, knowledge.items, 3)
  const contextMatches =
    matchedItems.length > 0
      ? matchedItems
      : rankFaqMatches(recentUserContext, knowledge.items, 3)

  const sources: FaqSourceCitation[] = contextMatches.map((item) => ({
    id: item.id,
    question: item.question,
    category: item.category,
  }))

  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    const fallback = buildDeterministicFallbackAnswer(userMessage, contextMatches)
    return createSseStreamResponse(async (send) => {
      send({ type: 'delta', text: fallback.reply })
      send({
        type: 'done',
        showContactCta: fallback.showContactCta,
        sources,
        usedFallback: true,
      })
    })
  }

  const model = process.env.OPENAI_FAQ_MODEL?.trim() || 'gpt-4.1-mini'
  const systemPrompt = buildGroundedSystemPrompt(knowledge)
  const client = new OpenAI({ apiKey })

  return createSseStreamResponse(async (send) => {
    let fullReply = ''
    try {
      const stream = await client.chat.completions.create({
        model,
        stream: true,
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((turn) => ({
            role: turn.role,
            content: turn.content,
          })),
          { role: 'user', content: userMessage },
        ],
      })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          fullReply += delta
          send({ type: 'delta', text: delta })
        }
      }

      if (!fullReply.trim()) {
        throw new Error('OpenAI stream completed with empty text')
      }

      send({
        type: 'done',
        showContactCta: shouldSuggestContact(userMessage, fullReply),
        sources,
        usedFallback: false,
      })
    } catch (error) {
      logger.error('FAQ OpenAI chat failed; falling back to deterministic FAQ answer', error)
      if (!fullReply.trim()) {
        const fallback = buildDeterministicFallbackAnswer(
          userMessage,
          contextMatches,
        )
        send({ type: 'delta', text: fallback.reply })
        send({
          type: 'done',
          showContactCta: fallback.showContactCta,
          sources,
          usedFallback: true,
        })
      } else {
        send({
          type: 'done',
          showContactCta: shouldSuggestContact(userMessage, fullReply),
          sources,
          usedFallback: false,
        })
      }
    }
  })
}
