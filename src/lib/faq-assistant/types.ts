export type FaqItemEntry = {
  id: string
  category: string
  categorySlug: string
  question: string
  answer: string
}

export type FaqCategorySummary = {
  slug: string
  name: string
  count: number
}

export type FaqKnowledgeSnapshot = {
  docId: string
  docUrl: string
  items: FaqItemEntry[]
  categories: FaqCategorySummary[]
  starterQuestions: string[]
  rawDocumentText: string
  source: 'google-docs-live' | 'google-docs-stale' | 'bundled-fallback'
  syncedAt: string
}
