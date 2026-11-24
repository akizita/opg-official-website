import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_OPG_FAQ_DOC_ID,
  FALLBACK_OPG_FAQ_TEXT,
} from './fallback-knowledge'
import {
  buildCategorySummaries,
  extractGoogleDocId,
  loadFaqKnowledge,
  parseGoogleDocFaqText,
  resetFaqKnowledgeCache,
  selectStarterQuestions,
} from './google-doc-source'

describe('google-doc-source', () => {
  beforeEach(() => {
    resetFaqKnowledgeCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.FAQ_GOOGLE_DOC_ID
    delete process.env.FAQ_GOOGLE_DOC_URL
  })

  it('extracts Google Doc ID from sharing URLs or raw IDs', () => {
    expect(
      extractGoogleDocId(
        'https://docs.google.com/document/d/1ndD1oO5OJapPzs9CLqoKH3zfuRxz7TP5iG7nFnntqic/edit?usp=sharing',
      ),
    ).toBe('1ndD1oO5OJapPzs9CLqoKH3zfuRxz7TP5iG7nFnntqic')
    expect(extractGoogleDocId('custom_doc_id_12345')).toBe(
      'custom_doc_id_12345',
    )
    expect(extractGoogleDocId('')).toBe(DEFAULT_OPG_FAQ_DOC_ID)
  })

  it('parses the OPG FAQ document into categorized Q&A items with lists intact', () => {
    const items = parseGoogleDocFaqText(`\uFEFF${FALLBACK_OPG_FAQ_TEXT}`)
    expect(items.length).toBeGreaterThanOrEqual(20)

    const pricing = items.find((item) =>
      item.question.toLowerCase().includes('pricing model'),
    )
    expect(pricing).toBeDefined()
    expect(pricing?.category).toBe('Pricing & Guarantees')
    expect(pricing?.answer).toContain('15%')
    expect(pricing?.answer).toContain('13%')

    const categories = buildCategorySummaries(items)
    expect(categories.some((c) => c.name === 'Services & Delivery')).toBe(true)
    expect(categories.some((c) => c.name === 'For Candidates')).toBe(true)
  })

  it('auto-generates up to 4 starter question chips across categories', () => {
    const items = parseGoogleDocFaqText(FALLBACK_OPG_FAQ_TEXT)
    const starters = selectStarterQuestions(items)
    expect(starters).toHaveLength(4)
    expect(new Set(starters).size).toBe(4)
  })

  it('loads live Google Doc updates and falls back cleanly on network error', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        'What is live sync?\r\nReal-time sync reads directly from Google Docs.\r\n\r\nHow much does it cost?\r\nPricing is 15% for Tier 1.',
    })
    vi.stubGlobal('fetch', fetchMock)

    const live = await loadFaqKnowledge({ forceRefresh: true })
    expect(live.source).toBe('google-docs-live')
    expect(live.items).toHaveLength(2)
    expect(live.starterQuestions).toEqual([
      'What is live sync?',
      'How much does it cost?',
    ])

    resetFaqKnowledgeCache()
    fetchMock.mockRejectedValueOnce(new Error('Network down'))

    const fallback = await loadFaqKnowledge({ forceRefresh: true })
    expect(fallback.source).toBe('bundled-fallback')
    expect(fallback.items.length).toBeGreaterThanOrEqual(20)
  })
})
