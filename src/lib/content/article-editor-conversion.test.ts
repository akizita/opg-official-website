import { describe, expect, it } from 'vitest'

import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from './article-editor-conversion'

describe('Article Editor Markdown <-> HTML Conversion', () => {
  it('converts markdown headings to semantic HTML headings', () => {
    const md = '# Main Title\n\n## Sub Heading\n\n### Minor Section'
    const html = markdownToEditorHtml(md)
    expect(html).toContain('<h1>Main Title</h1>')
    expect(html).toContain('<h2>Sub Heading</h2>')
    expect(html).toContain('<h3>Minor Section</h3>')
  })

  it('converts lists and blockquotes properly', () => {
    const md = '> Leading insight\n\n- Point one\n- Point two'
    const html = markdownToEditorHtml(md)
    expect(html).toContain('<blockquote>Leading insight</blockquote>')
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
      '<h1>Main Title</h1><p>A paragraph with <strong>bold</strong> text.</p><blockquote>A quote</blockquote>'
    const md = editorHtmlToMarkdown(html)
    expect(md).toContain('# Main Title')
    expect(md).toContain('**bold**')
    expect(md).toContain('> A quote')
  })
})
