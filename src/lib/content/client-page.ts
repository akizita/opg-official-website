import type { RichTextBlock } from '@/lib/content/page-documents'

export const CLIENT_PAGE_DEFAULTS = {
  title: 'Powering Global Teams for Industry Leaders.',
  summary:
    'We collaborate with high-growth technology scaleups, healthcare innovators, and multinational enterprises to deploy dedicated, rigorously vetted offshore pods that deliver immediate impact and sustainable ROI.',
  editorialTitle:
    'OPG’s Evolution: From Internal Engine to Global Talent Partner',
  editorialLead:
    'Built From the Inside Out: How Outsourced Pro Global evolved its internal talent engine into an embedded cross-border partner—delivering dedicated engineering, operations, and governance pods for high-growth teams worldwide.',
} as const

export function extractClientPageContent(
  content: RichTextBlock[] | null | undefined,
) {
  const blocks = Array.isArray(content) ? content : []
  const heading = blocks.find((block) => block.type === 'heading')
  const lead = blocks.find((block) => block.type === 'paragraph' && !block.key)

  return {
    editorialTitle:
      heading?.type === 'heading'
        ? heading.content
        : CLIENT_PAGE_DEFAULTS.editorialTitle,
    editorialLead:
      lead?.type === 'paragraph'
        ? lead.content
        : CLIENT_PAGE_DEFAULTS.editorialLead,
  }
}
