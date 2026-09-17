export type RichTextBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 2 | 3 | 4; content: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'blockquote'; content: string; citation?: string }
  | { type: 'callout'; content: string; variant?: 'info' | 'warning' }

export type RichTextContent = string | RichTextBlock[]

type RichTextProps = {
  className?: string
  content: RichTextContent
}

export function RichText({ className = '', content }: RichTextProps) {
  if (typeof content === 'string') {
    // Split by newlines into clean paragraph blocks
    const paragraphs = content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    return (
      <div className={`rich-text ${className}`.trim()}>
        {paragraphs.map((para, index) => (
          <p key={index}>{para}</p>
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
            return <p key={index}>{block.content}</p>

          case 'heading': {
            const HeadingTag = `h${block.level}` as 'h2' | 'h3' | 'h4'
            return <HeadingTag key={index}>{block.content}</HeadingTag>
          }

          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={index}>
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ListTag>
            )
          }

          case 'blockquote':
            return (
              <blockquote key={index}>
                <p>{block.content}</p>
                {block.citation ? <cite>{block.citation}</cite> : null}
              </blockquote>
            )

          case 'callout':
            return (
              <aside
                key={index}
                className={`callout callout--${block.variant || 'info'}`}
              >
                <p>{block.content}</p>
              </aside>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
