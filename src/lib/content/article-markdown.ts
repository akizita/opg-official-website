import type { RichTextBlock } from '@/lib/content/page-documents'

const BLOCK_BOUNDARY_LINE_PATTERN =
  /^(?:#{1,4}\s+|>\s?|[-*]\s+|\d+\.\s+|([-*_]){3,}$)/

/**
 * Splits normalized markdown into logical blocks even when single newlines
 * separate headings, blockquotes, lists, dividers, or paragraphs (such as after CRLF normalization).
 */
export function splitMarkdownBlocks(rawText: string): string[] {
  const normalized = rawText.replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n')
  const blocks: string[] = []
  let buffer: string[] = []

  const flush = () => {
    if (buffer.length > 0) {
      const joined = buffer.join('\n').trim()
      if (joined) blocks.push(joined)
      buffer = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }

    if (/^([-*_]){3,}$/.test(trimmed)) {
      flush()
      blocks.push(trimmed)
      continue
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      flush()
      blocks.push(trimmed)
      continue
    }

    if (trimmed.startsWith('>')) {
      const lastInBuffer = buffer[buffer.length - 1]?.trim() || ''
      if (!lastInBuffer.startsWith('>')) {
        flush()
      }
      buffer.push(trimmed)
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const lastInBuffer = buffer[buffer.length - 1]?.trim() || ''
      if (!/^[-*]\s+/.test(lastInBuffer)) {
        flush()
      }
      buffer.push(trimmed)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const lastInBuffer = buffer[buffer.length - 1]?.trim() || ''
      if (!/^\d+\.\s+/.test(lastInBuffer)) {
        flush()
      }
      buffer.push(trimmed)
      continue
    }

    const lastInBuffer = buffer[buffer.length - 1]?.trim() || ''
    if (BLOCK_BOUNDARY_LINE_PATTERN.test(lastInBuffer)) {
      flush()
    }
    buffer.push(line)
  }

  flush()
  return blocks
}

/**
 * Parses markdown into structured RichTextBlocks (headings, quotes, lists, paragraphs).
 */
export function markdownToRichTextBlocks(text: string): RichTextBlock[] {
  if (!text || !text.trim()) return []
  const blocks: RichTextBlock[] = []
  const rawSections = splitMarkdownBlocks(text)

  for (const raw of rawSections) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    // Headings: # / ## / ### / #### (# maps cleanly to level 2 article subheading)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      const hashCount = headingMatch[1].length
      const level = (hashCount === 1 ? 2 : hashCount) as 2 | 3 | 4
      blocks.push({
        type: 'heading',
        level,
        content: headingMatch[2].trim(),
      })
      continue
    }

    // Blockquote: > ... (supports optional trailing `— Citation` line)
    if (trimmed.startsWith('>')) {
      const quoteLines = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, '').trim())
        .filter(Boolean)

      let citation: string | undefined
      if (quoteLines.length > 1) {
        const lastLine = quoteLines[quoteLines.length - 1]
        const citeMatch = lastLine.match(/^(?:—|--)\s*(.+)$/)
        if (citeMatch) {
          citation = citeMatch[1].trim()
          quoteLines.pop()
        }
      }

      const content = quoteLines.join(' ').trim()
      if (content) {
        blocks.push({
          type: 'blockquote',
          content,
          ...(citation ? { citation } : {}),
        })
      }
      continue
    }

    // Horizontal dividers
    if (/^([-*_]){3,}$/.test(trimmed)) {
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
      content: trimmed
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' '),
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
          return b.citation
            ? `> ${b.content}\n> — ${b.citation}`
            : `> ${b.content}`
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
