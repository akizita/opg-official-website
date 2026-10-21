import type { RichTextBlock } from '@/lib/content/page-documents'

export const CLIENT_PAGE_DEFAULTS = {
  title: 'Powering Global Teams for Industry Leaders.',
  summary:
    'We collaborate with high-growth technology scaleups, healthcare innovators, and multinational enterprises to deploy dedicated, rigorously vetted offshore pods that deliver immediate impact and sustainable ROI.',
  editorialTitle:
    'How OPG Handles Client Partnerships: Inside Our High-Touch Pod Governance & Client Archetypes',
  editorialLead:
    'In the ever-evolving distributed economy, ambitious organizations must move beyond transactional staffing to captivate markets and drive sustainable growth. At the heart of this transformation lies the power of dedicated, high-retention offshore talent pods.',
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
