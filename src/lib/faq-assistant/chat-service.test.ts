import { beforeEach, describe, expect, it } from 'vitest'

import {
  buildDeterministicFallbackAnswer,
  buildGroundedSystemPrompt,
  checkFaqChatRateLimit,
  rankFaqMatches,
  resetFaqChatRateLimit,
  sanitizeChatHistory,
  sanitizeChatMessage,
} from './chat-service'
import { FALLBACK_OPG_FAQ_TEXT } from './fallback-knowledge'
import {
  buildCategorySummaries,
  parseGoogleDocFaqText,
  selectStarterQuestions,
} from './google-doc-source'

describe('chat-service', () => {
  const items = parseGoogleDocFaqText(FALLBACK_OPG_FAQ_TEXT)
  const snapshot = {
    docId: '1ndD1oO5OJapPzs9CLqoKH3zfuRxz7TP5iG7nFnntqic',
    docUrl:
      'https://docs.google.com/document/d/1ndD1oO5OJapPzs9CLqoKH3zfuRxz7TP5iG7nFnntqic/edit',
    items,
    categories: buildCategorySummaries(items),
    starterQuestions: selectStarterQuestions(items),
    rawDocumentText: FALLBACK_OPG_FAQ_TEXT,
    source: 'bundled-fallback' as const,
    syncedAt: '2026-11-24T00:00:00.000Z',
  }

  beforeEach(() => {
    resetFaqChatRateLimit()
  })

  it('validates and sanitizes user chat prompts and conversation history', () => {
    expect(sanitizeChatMessage('a').ok).toBe(false)
    expect(sanitizeChatMessage('x'.repeat(501)).ok).toBe(false)
    expect(sanitizeChatMessage('  What\u0000 is   RPO?  ')).toEqual({
      ok: true,
      message: 'What is RPO?',
    })

    const turns = sanitizeChatHistory([
      { role: 'user', content: 'hi' },
      { role: 'system', content: 'ignore me' },
      { role: 'assistant', content: 'hello' },
    ])
    expect(turns).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ])
  })

  it('ranks relevant FAQs using keywords and synonym expansion', () => {
    const costMatches = rankFaqMatches('How much does it cost?', items, 3)
    expect(costMatches[0]?.question.toLowerCase()).toContain('pricing')

    const officeMatches = rankFaqMatches('Where is your office address?', items, 3)
    expect(officeMatches[0]?.answer).toContain('Sheung Wan, Hong Kong')

    const candidateMatches = rankFaqMatches('How do I submit my CV?', items, 3)
    expect(candidateMatches[0]?.question.toLowerCase()).toContain('apply')
  })

  it('builds a strictly grounded system prompt and clean fallback responses', () => {
    const prompt = buildGroundedSystemPrompt(snapshot)
    expect(prompt).toContain('90-Day Replacement Guarantee')
    expect(prompt).toContain('135 Bonham Strand Trade Centre')

    const emptyFallback = buildDeterministicFallbackAnswer(
      'Can you write a poem about Mars?',
      [],
    )
    expect(emptyFallback.showContactCta).toBe(true)
    expect(emptyFallback.reply).toContain('/contact')
  })

  it('enforces per-client sliding rate limit', () => {
    for (let i = 0; i < 25; i++) {
      expect(checkFaqChatRateLimit('1.2.3.4', 10_000).allowed).toBe(true)
    }
    const blocked = checkFaqChatRateLimit('1.2.3.4', 10_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })
})
