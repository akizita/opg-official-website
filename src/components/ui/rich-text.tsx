import type { ReactNode } from 'react'

export type RichTextBlock =
  | { type: 'paragraph'; content: string; key?: string }
  | { type: 'heading'; level: 2 | 3 | 4; content: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'blockquote'; content: string; citation?: string }
  | { type: 'callout'; content: string; variant?: 'info' | 'warning' }

export type RichTextContent = string | RichTextBlock[]

type RichTextProps = {
  className?: string
  content: RichTextContent
}

const INLINE_TOKEN_PATTERN =
  /(\*\*[^*]+?\*\*|\*[^*]+?\*|~~[^~]+?~~|`[^`]+?`|<u>[\s\S]+?<\/u>)/g

function renderInlineMarkdown(text: string): ReactNode {
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

export function RichText({ className = '', content }: RichTextProps) {
  if (typeof content === 'string') {
    const paragraphs = content
      .replace(/\r\n?/g, '\n')
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    return (
      <div className={`rich-text ${className}`.trim()}>
        {paragraphs.map((para, index) => (
          <p key={index}>{renderInlineMarkdown(para)}</p>
        ))}
      </div>
    )
  }

  if (!Array.isArray(content)) {
    return null
  }

  return (
    <div className={`rich-text ${className}`.trim()}>
      {content.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index}>{renderInlineMarkdown(block.content)}</p>

          case 'heading': {
            const HeadingTag = `h${block.level}` as 'h2' | 'h3' | 'h4'
            return (
              <HeadingTag key={index}>
                {renderInlineMarkdown(block.content)}
              </HeadingTag>
            )
          }

          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={index}>
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineMarkdown(item)}</li>
                ))}
              </ListTag>
            )
          }

          case 'blockquote':
            return (
              <blockquote key={index}>
                <p>{renderInlineMarkdown(block.content)}</p>
                {block.citation ? (
                  <cite>{renderInlineMarkdown(block.citation)}</cite>
                ) : null}
              </blockquote>
            )

          case 'callout':
            return (
              <aside
                key={index}
                className={`callout callout--${block.variant || 'info'}`}
              >
                <p>{renderInlineMarkdown(block.content)}</p>
              </aside>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
