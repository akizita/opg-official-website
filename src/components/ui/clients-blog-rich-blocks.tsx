import type { ReactNode } from 'react'

import { splitMarkdownBlocks } from '@/lib/content/article-markdown'

const INLINE_TOKEN_PATTERN =
  /(\*\*[^*]+?\*\*|\*[^*]+?\*|~~[^~]+?~~|`[^`]+?`|<u>[\s\S]+?<\/u>)/g

function renderInlineBlogMarkdown(text: string): ReactNode {
  if (!text) return text
  const parts = text.split(INLINE_TOKEN_PATTERN)
  if (parts.length === 1) return text

  return parts.map((part, idx) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>
    }
    if (
      part.startsWith('*') &&
      part.endsWith('*') &&
      !part.startsWith('**') &&
      part.length > 2
    ) {
      return <em key={idx}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return <del key={idx}>{part.slice(2, -2)}</del>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={idx}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length > 7) {
      return <u key={idx}>{part.slice(3, -4)}</u>
    }
    return part
  })
}

function renderFeatureListItem(text: string, index: number) {
  const boldPrefixMatch = text.match(/^\*\*([^*]+?):\*\*\s*(.+)$/)
  if (boldPrefixMatch) {
    return (
      <li key={index}>
        <strong>{boldPrefixMatch[1]}:</strong>{' '}
        {renderInlineBlogMarkdown(boldPrefixMatch[2])}
      </li>
    )
  }

  const colonIndex = text.indexOf(': ')
  if (colonIndex > 0 && !text.includes('**')) {
    return (
      <li key={index}>
        <strong>{text.slice(0, colonIndex + 1)}</strong>{' '}
        {text.slice(colonIndex + 2)}
      </li>
    )
  }

  return <li key={index}>{renderInlineBlogMarkdown(text)}</li>
}

export function ClientsBlogRichBlock({
  isLeadBlock = false,
  markdown,
}: {
  isLeadBlock?: boolean
  markdown: string
}) {
  if (!markdown.trim()) return null

  const rawSections = splitMarkdownBlocks(markdown)
  const firstParagraphIndex = isLeadBlock
    ? rawSections.findIndex((raw) => {
        const t = raw.trim()
        return (
          t.length > 0 &&
          !/^#{1,4}\s+/.test(t) &&
          !/^([-*_]){3,}$/.test(t) &&
          !t.startsWith('>') &&
          !/^\d+\.\s+/.test(t) &&
          !/^[-*]\s+/.test(t)
        )
      })
    : -1

  return (
    <>
      {rawSections.map((raw, idx) => {
        const trimmed = raw.trim()
        if (!trimmed) return null

        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          const Tag = level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
          return (
            <Tag className="clients-blog-h3" key={idx}>
              {renderInlineBlogMarkdown(headingMatch[2].trim())}
            </Tag>
          )
        }

        if (/^([-*_]){3,}$/.test(trimmed)) {
          return <hr className="clients-blog-divider" key={idx} />
        }

        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((l) => l.replace(/^>\s?/, '').trim())
            .filter(Boolean)

          let citation: string | undefined
          if (quoteLines.length > 1) {
            const last = quoteLines[quoteLines.length - 1]
            const citeMatch = last.match(/^(?:—|--)\s*(.+)$/)
            if (citeMatch) {
              citation = citeMatch[1].trim()
              quoteLines.pop()
            }
          }

          return (
            <blockquote className="clients-blog-blockquote" key={idx}>
              <p>{renderInlineBlogMarkdown(quoteLines.join(' '))}</p>
              {citation && <cite>— {renderInlineBlogMarkdown(citation)}</cite>}
            </blockquote>
          )
        }

        const lines = trimmed.split('\n')
        if (lines.length > 0 && lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol className="clients-blog-feature-list" key={idx}>
              {lines.map((line, itemIdx) =>
                renderFeatureListItem(
                  line.replace(/^\s*\d+\.\s+/, '').trim(),
                  itemIdx,
                ),
              )}
            </ol>
          )
        }

        if (lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul className="clients-blog-bullet-list" key={idx}>
              {lines.map((line, itemIdx) =>
                renderFeatureListItem(
                  line.replace(/^\s*[-*]\s+/, '').trim(),
                  itemIdx,
                ),
              )}
            </ul>
          )
        }

        const useLeadClass = idx === firstParagraphIndex
        return (
          <p
            className={
              useLeadClass
                ? 'clients-blog-paragraph clients-blog-paragraph--lead'
                : 'clients-blog-paragraph'
            }
            key={idx}
          >
            {renderInlineBlogMarkdown(
              lines
                .map((l) => l.trim())
                .filter(Boolean)
                .join(' '),
            )}
          </p>
        )
      })}
    </>
  )
}
