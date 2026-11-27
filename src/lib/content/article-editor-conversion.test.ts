import { describe, expect, it } from 'vitest'

import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from './article-editor-conversion'
import {
  markdownToRichTextBlocks,
  richTextBlocksToMarkdown,
} from './article-markdown'

describe('Article Editor Markdown <-> HTML Conversion', () => {
  it('converts markdown headings to semantic HTML headings', () => {
    const md = '# Main Title\n\n## Sub Heading\n\n### Minor Section'
    const html = markdownToEditorHtml(md)
    expect(html).toContain('<h1>Main Title</h1>')
    expect(html).toContain('<h2>Sub Heading</h2>')
    expect(html).toContain('<h3>Minor Section</h3>')
  })

  it('converts lists and blockquotes properly', () => {
    const md = '> Leading insight\n> — Team Lead\n\n- Point one\n- Point two'
    const html = markdownToEditorHtml(md)
    expect(html).toContain(
      '<blockquote><p>Leading insight</p><cite>Team Lead</cite></blockquote>',
    )
    expect(html).toContain('<ul><li>Point one</li><li>Point two</li></ul>')
  })

  it('converts inline bold, italic, and strikethrough', () => {
    const md = 'This is **bold**, *italic*, and ~~struck~~.'
    const html = markdownToEditorHtml(md)
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<del>struck</del>')
  })

  it('converts HTML back to markdown', () => {
    const html =
      '<h1>Main Title</h1><p>A paragraph with <strong>bold</strong> text.</p><blockquote><p>A quote</p><cite>Joy</cite></blockquote>'
    const md = editorHtmlToMarkdown(html)
    expect(md).toContain('# Main Title')
    expect(md).toContain('**bold**')
    expect(md).toContain('> A quote\n> — Joy')
  })

  it('preserves headings and quotes when form submissions normalize line endings to CRLF', () => {
    const crlfMarkdown =
      'Opening lead paragraph.\r\n\r\n### Section Heading\r\nSecond paragraph text.\r\n> Memorable quote\r\n> — Speaker'
    const blocks = markdownToRichTextBlocks(crlfMarkdown)
    expect(blocks).toEqual([
      { type: 'paragraph', content: 'Opening lead paragraph.' },
      { type: 'heading', level: 3, content: 'Section Heading' },
      { type: 'paragraph', content: 'Second paragraph text.' },
      { type: 'blockquote', content: 'Memorable quote', citation: 'Speaker' },
    ])

    const roundTripped = richTextBlocksToMarkdown(blocks)
    expect(roundTripped).toBe(
      'Opening lead paragraph.\n\n### Section Heading\n\nSecond paragraph text.\n\n> Memorable quote\n> — Speaker',
    )
  })
})
