/**
 * High-fidelity Markdown <-> WYSIWYG HTML Converter for Article Editor
 */

/**
 * Converts stored Markdown text into semantic HTML for the contentEditable editor.
 */
export function markdownToEditorHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p><br></p>'
  }

  const sections = markdown.split(/\n\n+/)
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

    // Heading 3: ### Section
    const h3Match = trimmed.match(/^###\s+(.+)$/)
    if (h3Match) {
      htmlParts.push(`<h3>${formatInline(h3Match[1].trim())}</h3>`)
      continue
    }

    // Blockquote: > Quote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join('<br>')
      htmlParts.push(`<blockquote>${formatInline(quoteText)}</blockquote>`)
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

  return htmlParts.join('')
}

/**
 * Format inline Markdown syntax into HTML tags
 */
function formatInline(text: string): string {
  let result = text
  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic: *text* or _text_
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
  return domNodeToMarkdown(doc.body).trim()
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
      case 'h1':
        md += `\n\n# ${domNodeToMarkdown(el).trim()}\n\n`
        break
      case 'h2':
        md += `\n\n## ${domNodeToMarkdown(el).trim()}\n\n`
        break
      case 'h3':
        md += `\n\n### ${domNodeToMarkdown(el).trim()}\n\n`
        break
      case 'p': {
        const inner = domNodeToMarkdown(el).trim()
        if (inner) {
          md += `\n\n${inner}\n\n`
        }
        break
      }
      case 'blockquote':
        md += `\n\n> ${domNodeToMarkdown(el).trim()}\n\n`
        break
      case 'ul': {
        const lis = Array.from(el.querySelectorAll(':scope > li'))
          .map((li) => `- ${domNodeToMarkdown(li).trim()}`)
          .join('\n')
        md += `\n\n${lis}\n\n`
        break
      }
      case 'ol': {
        const lis = Array.from(el.querySelectorAll(':scope > li'))
          .map((li, index) => `${index + 1}. ${domNodeToMarkdown(li).trim()}`)
          .join('\n')
        md += `\n\n${lis}\n\n`
        break
      }
      case 'li':
        md += domNodeToMarkdown(el)
        break
      case 'strong':
      case 'b':
        md += `**${domNodeToMarkdown(el)}**`
        break
      case 'em':
      case 'i':
        md += `*${domNodeToMarkdown(el)}*`
        break
      case 'u':
        md += `<u>${domNodeToMarkdown(el)}</u>`
        break
      case 'del':
      case 's':
      case 'strike':
        md += `~~${domNodeToMarkdown(el)}~~`
        break
      case 'code':
        md += `\`${domNodeToMarkdown(el)}\``
        break
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
  md = md.replace(/<h1>(.*?)<\/h1>/gi, '\n\n# $1\n\n')
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '\n\n## $1\n\n')
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '\n\n### $1\n\n')
  md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, '\n\n> $1\n\n')
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n')
  md = md.replace(/<ul>(.*?)<\/ul>/gi, '\n\n$1\n\n')
  md = md.replace(/<ol>(.*?)<\/ol>/gi, '\n\n$1\n\n')
  md = md.replace(/<p>(.*?)<\/p>/gi, '\n\n$1\n\n')
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~')
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  md = md.replace(/<hr\s*\/?>/gi, '\n\n---\n\n')
  md = md.replace(/<[^>]+>/g, '')
  return md.replace(/\n{3,}/g, '\n\n').trim()
}
