/**
 * High-fidelity Markdown <-> WYSIWYG HTML Converter for Article Editor
 */

import { splitMarkdownBlocks } from './article-markdown'

/**
 * Converts stored Markdown text into semantic HTML for the contentEditable editor.
 */
export function markdownToEditorHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p><br></p>'
  }

  const sections = splitMarkdownBlocks(markdown)
  const htmlParts: string[] = []

  for (const raw of sections) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    // Heading 1: # Title
    const h1Match = trimmed.match(/^#\s+(.+)$/)
    if (h1Match) {
      htmlParts.push(`<h1>${formatInline(h1Match[1].trim())}</h1>`)
      continue
    }

    // Heading 2: ## Subtitle
    const h2Match = trimmed.match(/^##\s+(.+)$/)
    if (h2Match) {
      htmlParts.push(`<h2>${formatInline(h2Match[1].trim())}</h2>`)
      continue
    }

    // Heading 3 / Heading 4: ### or #### Section
    const h3Match = trimmed.match(/^#{3,4}\s+(.+)$/)
    if (h3Match) {
      htmlParts.push(`<h3>${formatInline(h3Match[1].trim())}</h3>`)
      continue
    }

    // Blockquote: > Quote (supports optional citation line)
    if (trimmed.startsWith('>')) {
      const quoteLines = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, '').trim())
        .filter(Boolean)

      let citeHtml = ''
      if (quoteLines.length > 1) {
        const lastLine = quoteLines[quoteLines.length - 1]
        const citeMatch = lastLine.match(/^(?:—|--)\s*(.+)$/)
        if (citeMatch) {
          citeHtml = `<cite>${formatInline(citeMatch[1].trim())}</cite>`
          quoteLines.pop()
        }
      }

      const quoteText = quoteLines.map((l) => formatInline(l)).join('<br>')
      htmlParts.push(
        `<blockquote><p>${quoteText}</p>${citeHtml}</blockquote>`,
      )
      continue
    }

    // Bullet List: - Item or * Item
    const lines = trimmed.split('\n')
    if (lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      const lis = lines
        .map((l) => `<li>${formatInline(l.replace(/^\s*[-*]\s+/, '').trim())}</li>`)
        .join('')
      htmlParts.push(`<ul>${lis}</ul>`)
      continue
    }

    // Numbered List: 1. Item
    if (lines.length > 0 && lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      const lis = lines
        .map((l) => `<li>${formatInline(l.replace(/^\s*\d+\.\s+/, '').trim())}</li>`)
        .join('')
      htmlParts.push(`<ol>${lis}</ol>`)
      continue
    }

    // Divider: --- or ***
    if (/^([-*_]){3,}$/.test(trimmed)) {
      htmlParts.push('<hr>')
      continue
    }

    // Standard Paragraph
    const paragraphText = trimmed
      .split('\n')
      .map((l) => formatInline(l.trim()))
      .join('<br>')
    htmlParts.push(`<p>${paragraphText}</p>`)
  }

  return htmlParts.length > 0 ? htmlParts.join('') : '<p><br></p>'
}

/**
 * Format inline Markdown syntax into HTML tags
 */
function formatInline(text: string): string {
  let result = text
  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic: *text*
  result = result.replace(/(^|[^*])\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3')
  // Strike: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // Inline code: `code`
  result = result.replace(/`([^`]+?)`/g, '<code>$1</code>')
  return result
}

/**
 * Converts editor HTML back to standard clean Markdown for storage & persistence.
 */
export function editorHtmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return ''

  // In Node / SSR environments where DOMParser is not available, perform regex-based conversion
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return cleanRegexHtmlToMarkdown(html)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  return domNodeToMarkdown(doc.body)
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Traverses DOM tree and produces standard Markdown
 */
function domNodeToMarkdown(node: Node): string {
  let md = ''

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]

    if (child.nodeType === Node.TEXT_NODE) {
      md += child.textContent || ''
      continue
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()

    switch (tag) {
      case 'h1': {
        const inner = domNodeToMarkdown(el).replace(/\s+/g, ' ').trim()
        if (inner) md += `\n\n# ${inner}\n\n`
        break
      }
      case 'h2': {
        const inner = domNodeToMarkdown(el).replace(/\s+/g, ' ').trim()
        if (inner) md += `\n\n## ${inner}\n\n`
        break
      }
      case 'h3':
      case 'h4': {
        const inner = domNodeToMarkdown(el).replace(/\s+/g, ' ').trim()
        if (inner) md += `\n\n### ${inner}\n\n`
        break
      }
      case 'p': {
        const inner = domNodeToMarkdown(el).trim()
        if (inner) {
          md += `\n\n${inner}\n\n`
        }
        break
      }
      case 'blockquote': {
        const citeEl = el.querySelector(':scope > cite')
        const citeText = citeEl ? domNodeToMarkdown(citeEl).trim() : ''
        const clone = el.cloneNode(true) as HTMLElement
        clone.querySelectorAll(':scope > cite').forEach((c) => c.remove())
        const quoteLines = domNodeToMarkdown(clone)
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
        if (quoteLines.length > 0) {
          const prefixed = quoteLines.map((l) => `> ${l}`).join('\n')
          md += citeText
            ? `\n\n${prefixed}\n> — ${citeText.replace(/^—\s*/, '')}\n\n`
            : `\n\n${prefixed}\n\n`
        }
        break
      }
      case 'ul': {
        const lis = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => `- ${domNodeToMarkdown(li).replace(/\n+/g, ' ').trim()}`)
          .filter((line) => line !== '-')
          .join('\n')
        if (lis) md += `\n\n${lis}\n\n`
        break
      }
      case 'ol': {
        const lis = Array.from(el.querySelectorAll(':scope > li'))
          .map(
            (li, index) =>
              `${index + 1}. ${domNodeToMarkdown(li).replace(/\n+/g, ' ').trim()}`,
          )
          .filter((line) => !/^\d+\.\s*$/.test(line))
          .join('\n')
        if (lis) md += `\n\n${lis}\n\n`
        break
      }
      case 'li':
        md += domNodeToMarkdown(el)
        break
      case 'strong':
      case 'b': {
        const inner = domNodeToMarkdown(el)
        if (inner) md += `**${inner}**`
        break
      }
      case 'em':
      case 'i': {
        const inner = domNodeToMarkdown(el)
        if (inner) md += `*${inner}*`
        break
      }
      case 'u': {
        const inner = domNodeToMarkdown(el)
        if (inner) md += `<u>${inner}</u>`
        break
      }
      case 'del':
      case 's':
      case 'strike': {
        const inner = domNodeToMarkdown(el)
        if (inner) md += `~~${inner}~~`
        break
      }
      case 'code': {
        const inner = domNodeToMarkdown(el)
        if (inner) md += `\`${inner}\``
        break
      }
      case 'pre': {
        const inner = domNodeToMarkdown(el).trim()
        if (inner) md += `\n\n${inner}\n\n`
        break
      }
      case 'hr':
        md += '\n\n---\n\n'
        break
      case 'br':
        md += '\n'
        break
      case 'div': {
        const inner = domNodeToMarkdown(el).trim()
        if (inner) {
          md += `\n\n${inner}\n\n`
        }
        break
      }
      default:
        md += domNodeToMarkdown(el)
        break
    }
  }

  // Normalize duplicate newlines
  return md.replace(/\n{3,}/g, '\n\n')
}

/**
 * Fallback regex converter when DOMParser is unavailable
 */
function cleanRegexHtmlToMarkdown(html: string): string {
  let md = html
  md = md.replace(/<h1>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
  md = md.replace(/<h2>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
  md = md.replace(/<h3>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
  md = md.replace(/<h4>([\s\S]*?)<\/h4>/gi, '\n\n### $1\n\n')
  md = md.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (_m, inner: string) => {
    const citeMatch = inner.match(/<cite>([\s\S]*?)<\/cite>/i)
    const cite = citeMatch ? citeMatch[1].replace(/<[^>]+>/g, '').trim() : ''
    const quoteBody = inner
      .replace(/<cite>[\s\S]*?<\/cite>/gi, '')
      .replace(/<\/p>\s*<p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!quoteBody) return ''
    const lines = quoteBody
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `> ${l}`)
      .join('\n')
    return cite
      ? `\n\n${lines}\n> — ${cite.replace(/^—\s*/, '')}\n\n`
      : `\n\n${lines}\n\n`
  })
  md = md.replace(/<li>([\s\S]*?)<\/li>/gi, '- $1\n')
  md = md.replace(/<ul>([\s\S]*?)<\/ul>/gi, '\n\n$1\n\n')
  md = md.replace(/<ol>([\s\S]*?)<\/ol>/gi, '\n\n$1\n\n')
  md = md.replace(/<p>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
  md = md.replace(/<div>([\s\S]*?)<\/div>/gi, '\n\n$1\n\n')
  md = md.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
  md = md.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~')
  md = md.replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~')
  md = md.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  md = md.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
  md = md.replace(/<(?!\/?u\b)[^>]+>/gi, '')
  return md.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}
