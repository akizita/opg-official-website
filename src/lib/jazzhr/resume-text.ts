import 'server-only'

import { inflateRawSync } from 'node:zlib'

const MAX_EXTRACTED_RESUME_CHARS = 100_000
const PDF_EXTRACT_TIMEOUT_MS = 10_000

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_EXTRACTED_RESUME_CHARS)
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number(dec)
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16)
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : ''
    })
}

type ZipEntry = {
  compressedData: Buffer
  compressionMethod: number
  filename: string
}

/**
 * Reads matching entries from a ZIP archive (DOCX/ODT) using the Central
 * Directory when present, falling back to Local File Headers when needed.
 */
function readZipEntries(
  buffer: Buffer,
  matcher: (name: string) => boolean,
): Map<string, Buffer> {
  const results = new Map<string, Buffer>()
  const entries: ZipEntry[] = []

  // Locate End of Central Directory (PK\x05\x06) near end of file.
  let eocdOffset = -1
  const minOffset = Math.max(0, buffer.length - 65_557)
  for (let i = buffer.length - 22; i >= minOffset; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }

  if (eocdOffset >= 0) {
    const cdSize = buffer.readUInt32LE(eocdOffset + 12)
    const cdOffset = buffer.readUInt32LE(eocdOffset + 16)
    const cdEnd = Math.min(buffer.length, cdOffset + cdSize)
    let cursor = cdOffset

    while (cursor + 46 <= cdEnd && buffer.readUInt32LE(cursor) === 0x02014b50) {
      const compressionMethod = buffer.readUInt16LE(cursor + 10)
      const compressedSize = buffer.readUInt32LE(cursor + 20)
      const nameLen = buffer.readUInt16LE(cursor + 28)
      const extraLen = buffer.readUInt16LE(cursor + 30)
      const commentLen = buffer.readUInt16LE(cursor + 32)
      const localHeaderOffset = buffer.readUInt32LE(cursor + 42)
      const filename = buffer
        .subarray(cursor + 46, cursor + 46 + nameLen)
        .toString('utf8')

      if (
        matcher(filename) &&
        localHeaderOffset + 30 <= buffer.length &&
        buffer.readUInt32LE(localHeaderOffset) === 0x04034b50
      ) {
        const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26)
        const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28)
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
        const dataEnd = Math.min(buffer.length, dataStart + compressedSize)
        if (dataStart <= dataEnd) {
          entries.push({
            compressedData: buffer.subarray(dataStart, dataEnd),
            compressionMethod,
            filename,
          })
        }
      }

      cursor += 46 + nameLen + extraLen + commentLen
    }
  }

  for (const entry of entries) {
    try {
      if (entry.compressionMethod === 0) {
        results.set(entry.filename, entry.compressedData)
      } else if (entry.compressionMethod === 8) {
        results.set(entry.filename, inflateRawSync(entry.compressedData))
      }
    } catch {
      // Skip malformed zip entry cleanly.
    }
  }

  return results
}

function extractXmlText(xml: string): string {
  const withBreaks = xml
    .replace(/<w:tab\b[^>]*\/?>/gi, '\t')
    .replace(/<text:tab\b[^>]*\/?>/gi, '\t')
    .replace(/<text:s\b[^>]*\/?>/gi, ' ')
    .replace(
      /<\/(?:w:p|w:tr|text:p|text:h|table:table-row)>|<w:br\b[^>]*\/?>|<text:line-break\b[^>]*\/?>/gi,
      '\n',
    )
    .replace(/<\/(?:w:tc|table:table-cell)>/gi, '  ')

  return normalizeExtractedText(decodeXmlEntities(withBreaks.replace(/<[^>]+>/g, '')))
}

function extractDocxText(buffer: Buffer): string {
  const parts = readZipEntries(
    buffer,
    (name) =>
      name === 'word/document.xml' ||
      /^word\/header\d*\.xml$/i.test(name) ||
      /^word\/footer\d*\.xml$/i.test(name),
  )

  const orderedKeys = [...parts.keys()].sort((a, b) => {
    if (a.includes('header') && !b.includes('header')) return -1
    if (!a.includes('header') && b.includes('header')) return 1
    if (a === 'word/document.xml' && b.includes('footer')) return -1
    if (a.includes('footer') && b === 'word/document.xml') return 1
    return a.localeCompare(b)
  })

  const chunks = orderedKeys
    .map((key) => extractXmlText(parts.get(key)!.toString('utf8')))
    .filter(Boolean)

  return normalizeExtractedText(chunks.join('\n\n'))
}

function extractOdtText(buffer: Buffer): string {
  const parts = readZipEntries(buffer, (name) => name === 'content.xml')
  const content = parts.get('content.xml')
  if (!content) return ''
  return extractXmlText(content.toString('utf8'))
}

function extractRtfText(buffer: Buffer): string {
  const raw = buffer.toString('latin1')
  const output: string[] = []
  let depth = 0
  let skipDepth: number | null = null
  const skipDestinations = new Set([
    'fonttbl',
    'colortbl',
    'stylesheet',
    'info',
    'pict',
    'object',
    'header',
    'footer',
    'headerl',
    'headerr',
    'headerf',
    'footerl',
    'footerr',
    'footerf',
  ])

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]
    if (ch === '{') {
      depth += 1
      continue
    }
    if (ch === '}') {
      if (skipDepth !== null && depth <= skipDepth) {
        skipDepth = null
      }
      depth = Math.max(0, depth - 1)
      continue
    }
    if (skipDepth !== null) continue

    if (ch === '\\') {
      const next = raw[i + 1]
      if (!next) break
      if (next === '*' && raw[i + 2] === '\\') {
        skipDepth = depth
        i += 1
        continue
      }
      if (next === "'" && /^[0-9a-f]{2}$/i.test(raw.slice(i + 2, i + 4))) {
        const byte = Number.parseInt(raw.slice(i + 2, i + 4), 16)
        output.push(String.fromCharCode(byte))
        i += 3
        continue
      }
      if (next === '\\' || next === '{' || next === '}') {
        output.push(next)
        i += 1
        continue
      }
      if (next === '~') {
        output.push(' ')
        i += 1
        continue
      }

      const wordMatch = /^[a-z]+(-?\d+)? ?/i.exec(raw.slice(i + 1))
      if (wordMatch) {
        const word = wordMatch[0].trim().replace(/-?\d+$/, '').toLowerCase()
        i += wordMatch[0].length
        if (skipDestinations.has(word)) {
          skipDepth = depth
        } else if (word === 'par' || word === 'line') {
          output.push('\n')
        } else if (word === 'tab') {
          output.push('\t')
        }
        continue
      }
      continue
    }

    if (ch !== '\r' && ch !== '\n') {
      output.push(ch)
    }
  }

  return normalizeExtractedText(output.join(''))
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import('unpdf')
    const result = await Promise.race([
      extractText(new Uint8Array(buffer), { mergePages: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF extraction timeout')), PDF_EXTRACT_TIMEOUT_MS),
      ),
    ])
    const text = Array.isArray(result.text)
      ? result.text.join('\n\n')
      : String(result.text ?? '')
    return normalizeExtractedText(text)
  } catch {
    return ''
  }
}

/**
 * Extracts readable plain text from uploaded candidate résumés (`TXT`, `PDF`,
 * `DOCX`, `ODT`, `RTF`) so JazzHR populates `TEXT-BASED RESUME FORMATTED BY JAZZHR`
 * and Talent Fit immediately rather than waiting on or failing binary parsing.
 */
export async function extractResumePlainText(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  if (!buffer.length) return ''
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  try {
    if (extension === 'txt') {
      return normalizeExtractedText(buffer.toString('utf8'))
    }
    if (extension === 'pdf') {
      return await extractPdfText(buffer)
    }
    if (extension === 'docx') {
      return extractDocxText(buffer)
    }
    if (extension === 'odt') {
      return extractOdtText(buffer)
    }
    if (extension === 'rtf') {
      return extractRtfText(buffer)
    }
  } catch {
    return ''
  }

  return ''
}
