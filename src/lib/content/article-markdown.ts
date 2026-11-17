import type { RichTextBlock } from '@/lib/content/page-documents'

/**
 * Parses markdown into structured RichTextBlocks (headings, quotes, lists, paragraphs).
 */
export function markdownToRichTextBlocks(text: string): RichTextBlock[] {
  if (!text || !text.trim()) return []
  const blocks: RichTextBlock[] = []
  const rawSections = text.split(/\n\n+/)

  for (const raw of rawSections) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    // Headings: ## or ### or ####
    const headingMatch = trimmed.match(/^(#{2,4})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length as 2 | 3 | 4
      blocks.push({
        type: 'heading',
        level,
        content: headingMatch[2].trim(),
      })
      continue
    }

    // Blockquote: > ...
    if (trimmed.startsWith('>')) {
      const quoteLines = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ')
        .trim()
      blocks.push({
        type: 'blockquote',
        content: quoteLines,
      })
      continue
    }

    // Bullet lists
    const lines = trimmed.split('\n')
    if (lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      blocks.push({
        type: 'list',
        ordered: false,
        items: lines.map((l) => l.replace(/^\s*[-*]\s+/, '').trim()),
      })
      continue
    }

    // Numbered lists
    if (lines.length > 0 && lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      blocks.push({
        type: 'list',
        ordered: true,
        items: lines.map((l) => l.replace(/^\s*\d+\.\s+/, '').trim()),
      })
      continue
    }

    // Paragraph
    blocks.push({
      type: 'paragraph',
      content: trimmed.replace(/\n/g, ' '),
    })
  }

  return blocks
}

/**
 * Converts RichTextBlocks back to markdown text for the editor.
 */
export function richTextBlocksToMarkdown(blocks: RichTextBlock[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ''
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `${'#'.repeat(b.level)} ${b.content}`
        case 'blockquote':
          return `> ${b.content}`
        case 'list':
          return (b.items || [])
            .map((item, i) => (b.ordered ? `${i + 1}. ${item}` : `- ${item}`))
            .join('\n')
        case 'callout':
          return `> **Note**: ${b.content}`
        case 'paragraph':
        default:
          return b.content
      }
    })
    .join('\n\n')
}
