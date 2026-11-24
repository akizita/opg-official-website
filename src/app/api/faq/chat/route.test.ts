import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetFaqChatRateLimit } from '@/lib/faq-assistant/chat-service'
import { FALLBACK_OPG_FAQ_TEXT } from '@/lib/faq-assistant/fallback-knowledge'
import { resetFaqKnowledgeCache } from '@/lib/faq-assistant/google-doc-source'

const createCompletionMock = vi.fn()

vi.mock('openai', () => {
  return {
    default: class OpenAIMock {
      chat = {
        completions: {
          create: createCompletionMock,
        },
      }
    },
  }
})

import { POST } from './route'

function makeRequest(body: unknown, ip = '10.0.0.1'): NextRequest {
  return new NextRequest('http://localhost:3000/api/faq/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

async function readSseText(response: Response): Promise<string> {
  const raw = await response.text()
  return raw
}

describe('POST /api/faq/chat', () => {
  beforeEach(() => {
    resetFaqChatRateLimit()
    resetFaqKnowledgeCache()
    createCompletionMock.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => FALLBACK_OPG_FAQ_TEXT,
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.OPENAI_API_KEY
  })

  it('rejects empty or invalid messages with 400', async () => {
    const res = await POST(makeRequest({ message: 'x' }))
    expect(res.status).toBe(400)
  })

  it('falls back deterministically over SSE when OPENAI_API_KEY is unset', async () => {
    delete process.env.OPENAI_API_KEY
    const res = await POST(
      makeRequest({ message: 'Do you offer a replacement guarantee?' }),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const sse = await readSseText(res)
    expect(sse).toContain('90-Day Replacement Guarantee')
    expect(sse).toContain('"usedFallback":true')
  })

  it('streams OpenAI grounded answers when OPENAI_API_KEY is configured', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    createCompletionMock.mockResolvedValueOnce(
      (async function* () {
        yield {
          choices: [{ delta: { content: 'OPG provides a ' } }],
        }
        yield {
          choices: [{ delta: { content: '90-Day Replacement Guarantee.' } }],
        }
      })(),
    )

    const res = await POST(
      makeRequest({ message: 'What is your replacement guarantee?' }),
    )
    expect(res.status).toBe(200)
    const sse = await readSseText(res)
    expect(sse).toContain('OPG provides a ')
    expect(sse).toContain('90-Day Replacement Guarantee.')
    expect(sse).toContain('"usedFallback":false')
  })
})
