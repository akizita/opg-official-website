import {
  DEFAULT_OPG_FAQ_DOC_ID,
  FALLBACK_OPG_FAQ_TEXT,
} from '@/lib/faq-assistant/fallback-knowledge'
import type {
  FaqCategorySummary,
  FaqItemEntry,
  FaqKnowledgeSnapshot,
} from '@/lib/faq-assistant/types'

const LIVE_TTL_MS = 60_000
const GOOGLE_DOC_FETCH_TIMEOUT_MS = 6_000

const CATEGORY_ORDER = [
  'Services & Delivery',
  'Pricing & Guarantees',
  'Hiring Process & Coverage',
  'Payroll & Compliance',
  'For Candidates',
  'Company & Contact',
] as const

type CachedKnowledge = {
  expiresAt: number
  snapshot: FaqKnowledgeSnapshot
}

let cachedKnowledge: CachedKnowledge | null = null
let inFlightSync: Promise<FaqKnowledgeSnapshot> | null = null

export function extractGoogleDocId(input?: string | null): string {
  const trimmed = (input ?? '').trim()
  if (!trimmed) return DEFAULT_OPG_FAQ_DOC_ID

  const urlMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (urlMatch?.[1]) return urlMatch[1]

  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) return trimmed
  return DEFAULT_OPG_FAQ_DOC_ID
}

export function getGoogleDocUrls(docId: string) {
  return {
    editUrl: `https://docs.google.com/document/d/${docId}/edit`,
    exportTxtUrl: `https://docs.google.com/document/d/${docId}/export?format=txt`,
  }
}

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function categorizeFaqEntry(question: string, answer: string): string {
  const q = question.toLowerCase()
  const a = answer.toLowerCase()

  if (
    q.includes('contact') ||
    q.includes('located') ||
    q.includes('office') ||
    q.includes('address')
  ) {
    return 'Company & Contact'
  }

  if (
    q.includes('pricing') ||
    q.includes('payment') ||
    q.includes('cancellation') ||
    q.includes('guarantee') ||
    q.includes('cost')
  ) {
    return 'Pricing & Guarantees'
  }

  if (
    q.includes('job seeker') ||
    q.includes('apply') ||
    q.includes('resume') ||
    q.includes('not selected') ||
    q.includes('working directly') ||
    q.includes('prior experience') ||
    q.includes('more than one role') ||
    q.includes('assessments should i expect') ||
    q.includes('if i am hired') ||
    q.includes('what should i prepare')
  ) {
    return 'For Candidates'
  }

  if (
    q.includes('payroll') ||
    q.includes('compliance') ||
    q.includes('data security') ||
    q.includes('hr admin')
  ) {
    return 'Payroll & Compliance'
  }

  if (
    q.includes('how fast') ||
    q.includes('how quickly') ||
    q.includes('track record') ||
    q.includes('roles does') ||
    q.includes('regions') ||
    q.includes('remote or onsite') ||
    q.includes('high-volume') ||
    q.includes('relocation') ||
    q.includes('application and hiring process')
  ) {
    return 'Hiring Process & Coverage'
  }

  if (
    q.includes('what is') ||
    q.includes('different from traditional') ||
    a.includes('service')
  ) {
    return 'Services & Delivery'
  }

  return 'Company & Contact'
}

function isStandaloneQuestionLine(line: string): boolean {
  if (!line || !line.endsWith('?')) return false
  if (line.length < 8 || line.length > 240) return false
  if (/^([*\-•]|\d+[.)])\s+/.test(line)) return false
  if (/[.!]\s+/.test(line)) return false
  return true
}

export function parseGoogleDocFaqText(rawText: string): FaqItemEntry[] {
  const normalized = rawText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n')

  const entries: Array<{ question: string; lines: string[] }> = []
  let current: { question: string; lines: string[] } | null = null

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      if (
        current &&
        current.lines.length > 0 &&
        current.lines[current.lines.length - 1] !== ''
      ) {
        current.lines.push('')
      }
      continue
    }

    if (isStandaloneQuestionLine(trimmed)) {
      if (current) {
        entries.push(current)
      }
      current = { question: trimmed, lines: [] }
      continue
    }

    if (current) {
      current.lines.push(trimmed)
    }
  }

  if (current) {
    entries.push(current)
  }

  const seenQuestions = new Set<string>()
  const items: FaqItemEntry[] = []

  for (const entry of entries) {
    const answer = entry.lines.join('\n').trim()
    if (!answer) continue

    const dedupeKey = entry.question.toLowerCase()
    if (seenQuestions.has(dedupeKey)) continue
    seenQuestions.add(dedupeKey)

    const category = categorizeFaqEntry(entry.question, answer)
    items.push({
      id: `faq-${items.length + 1}`,
      category,
      categorySlug: slugifyCategory(category),
      question: entry.question,
      answer,
    })
  }

  return items
}

export function buildCategorySummaries(
  items: FaqItemEntry[],
): FaqCategorySummary[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
  }

  const ordered: FaqCategorySummary[] = []
  for (const cat of CATEGORY_ORDER) {
    const count = counts.get(cat)
    if (count) {
      ordered.push({ slug: slugifyCategory(cat), name: cat, count })
      counts.delete(cat)
    }
  }

  for (const [name, count] of counts) {
    ordered.push({ slug: slugifyCategory(name), name, count })
  }

  return ordered
}

/**
 * Auto-generates up to 4 starter question chips directly from the parsed FAQ
 * document, prioritizing broad coverage across categories and concise labels.
 */
export function selectStarterQuestions(items: FaqItemEntry[]): string[] {
  if (items.length === 0) return []

  const preferredCategories = [
    'Services & Delivery',
    'Pricing & Guarantees',
    'Hiring Process & Coverage',
    'For Candidates',
  ]

  const picked: string[] = []
  const usedQuestions = new Set<string>()

  for (const cat of preferredCategories) {
    const candidates = items
      .filter(
        (item) => item.category === cat && !usedQuestions.has(item.question),
      )
      .sort((a, b) => a.question.length - b.question.length)

    const concise =
      candidates.find(
        (c) => c.question.length >= 22 && c.question.length <= 72,
      ) ?? candidates[0]

    if (concise) {
      picked.push(concise.question)
      usedQuestions.add(concise.question)
    }
  }

  for (const item of items) {
    if (picked.length >= 4) break
    if (!usedQuestions.has(item.question)) {
      picked.push(item.question)
      usedQuestions.add(item.question)
    }
  }

  return picked.slice(0, 4)
}

function buildSnapshot(
  docId: string,
  rawDocumentText: string,
  source: FaqKnowledgeSnapshot['source'],
): FaqKnowledgeSnapshot {
  const { editUrl } = getGoogleDocUrls(docId)
  const items = parseGoogleDocFaqText(rawDocumentText)
  return {
    docId,
    docUrl: editUrl,
    items,
    categories: buildCategorySummaries(items),
    starterQuestions: selectStarterQuestions(items),
    rawDocumentText: rawDocumentText.replace(/^\uFEFF/, '').trim(),
    source,
    syncedAt: new Date().toISOString(),
  }
}

export function resetFaqKnowledgeCache() {
  cachedKnowledge = null
  inFlightSync = null
}

/**
 * Fetches and parses OPG's FAQ Google Doc in real time (60s TTL cache with
 * automatic fallback to stale cache or bundled snapshot if Google Docs fails).
 */
export async function loadFaqKnowledge(options?: {
  forceRefresh?: boolean
}): Promise<FaqKnowledgeSnapshot> {
  const docId = extractGoogleDocId(
    process.env.FAQ_GOOGLE_DOC_ID || process.env.FAQ_GOOGLE_DOC_URL,
  )
  const forceRefresh = Boolean(options?.forceRefresh)
  const now = Date.now()

  if (
    !forceRefresh &&
    cachedKnowledge &&
    cachedKnowledge.snapshot.docId === docId &&
    cachedKnowledge.expiresAt > now
  ) {
    return cachedKnowledge.snapshot
  }

  if (inFlightSync && !forceRefresh) {
    return inFlightSync
  }

  let syncPromise: Promise<FaqKnowledgeSnapshot> | null = null
  syncPromise = (async (): Promise<FaqKnowledgeSnapshot> => {
    const { exportTxtUrl } = getGoogleDocUrls(docId)
    try {
      const response = await fetch(exportTxtUrl, {
        cache: forceRefresh ? 'no-store' : 'default',
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(GOOGLE_DOC_FETCH_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new Error(`Google Doc fetch failed with status ${response.status}`)
      }

      const text = await response.text()
      const parsed = parseGoogleDocFaqText(text)
      if (parsed.length === 0) {
        throw new Error('Google Doc export returned no parseable FAQ entries')
      }

      const snapshot = buildSnapshot(docId, text, 'google-docs-live')
      cachedKnowledge = {
        expiresAt: Date.now() + LIVE_TTL_MS,
        snapshot,
      }
      return snapshot
    } catch {
      if (cachedKnowledge && cachedKnowledge.snapshot.docId === docId) {
        return {
          ...cachedKnowledge.snapshot,
          source: 'google-docs-stale',
        }
      }

      const fallbackSnapshot = buildSnapshot(
        docId,
        FALLBACK_OPG_FAQ_TEXT,
        'bundled-fallback',
      )
      cachedKnowledge = {
        expiresAt: Date.now() + 15_000,
        snapshot: fallbackSnapshot,
      }
      return fallbackSnapshot
    } finally {
      if (syncPromise && inFlightSync === syncPromise) {
        inFlightSync = null
      }
    }
  })()

  inFlightSync = syncPromise
  return syncPromise
}
