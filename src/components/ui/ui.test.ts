import { describe, expect, it } from 'vitest'

import type { RichTextBlock } from './rich-text'
import type { ContentStatus } from './status-badge'

describe('UI Base Components contracts', () => {
  it('validates supported content statuses', () => {
    const statuses: ContentStatus[] = [
      'draft',
      'in_review',
      'changes_requested',
      'published',
      'unpublished',
      'archived',
      'active',
      'inactive',
    ]
    expect(statuses).toHaveLength(8)
  })

  it('validates structured rich text block formats', () => {
    const blocks: RichTextBlock[] = [
      { type: 'paragraph', content: 'Intro text' },
      { type: 'heading', level: 2, content: 'Section title' },
      { type: 'list', ordered: false, items: ['Item 1', 'Item 2'] },
      { type: 'blockquote', content: 'Quote text', citation: 'Author' },
      { type: 'callout', variant: 'info', content: 'Important note' },
    ]
    expect(blocks).toHaveLength(5)
    expect(blocks[0].type).toBe('paragraph')
  })
})
