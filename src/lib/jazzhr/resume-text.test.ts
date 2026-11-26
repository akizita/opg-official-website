import { deflateRawSync } from 'node:zlib'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { extractResumePlainText } from '@/lib/jazzhr/resume-text'

function createSingleEntryZip(filename: string, content: string): Buffer {
  const nameBuf = Buffer.from(filename, 'utf8')
  const raw = Buffer.from(content, 'utf8')
  const compressed = deflateRawSync(raw)

  const localHeader = Buffer.alloc(30)
  localHeader.writeUInt32LE(0x04034b50, 0)
  localHeader.writeUInt16LE(20, 4)
  localHeader.writeUInt16LE(8, 8)
  localHeader.writeUInt32LE(compressed.length, 18)
  localHeader.writeUInt32LE(raw.length, 22)
  localHeader.writeUInt16LE(nameBuf.length, 26)

  const cdOffset = localHeader.length + nameBuf.length + compressed.length
  const centralDir = Buffer.alloc(46)
  centralDir.writeUInt32LE(0x02014b50, 0)
  centralDir.writeUInt16LE(20, 4)
  centralDir.writeUInt16LE(20, 6)
  centralDir.writeUInt16LE(8, 10)
  centralDir.writeUInt32LE(compressed.length, 20)
  centralDir.writeUInt32LE(raw.length, 24)
  centralDir.writeUInt16LE(nameBuf.length, 28)
  centralDir.writeUInt32LE(0, 42)

  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(1, 8)
  eocd.writeUInt16LE(1, 10)
  eocd.writeUInt32LE(centralDir.length + nameBuf.length, 12)
  eocd.writeUInt32LE(cdOffset, 16)

  return Buffer.concat([
    localHeader,
    nameBuf,
    compressed,
    centralDir,
    nameBuf,
    eocd,
  ])
}

describe('extractResumePlainText', () => {
  it('extracts plain text cleanly from TXT résumés', async () => {
    const text = await extractResumePlainText(
      Buffer.from('Aki Zita\r\nPaid Media Analyst\r\n\r\n\r\nSQL & GA4'),
      'resume.txt',
    )
    expect(text).toBe('Aki Zita\nPaid Media Analyst\n\nSQL & GA4')
  })

  it('extracts paragraphs and line breaks from DOCX ZIP XML', async () => {
    const docx = createSingleEntryZip(
      'word/document.xml',
      '<w:document><w:body><w:p><w:r><w:t>Aki Zita</w:t></w:r></w:p><w:p><w:r><w:t>Paid Media &amp; Analytics</w:t></w:r></w:p></w:body></w:document>',
    )
    const text = await extractResumePlainText(docx, 'ZitaAki_Resume.docx')
    expect(text).toBe('Aki Zita\nPaid Media & Analytics')
  })

  it('extracts text from ODT and RTF résumés cleanly', async () => {
    const odt = createSingleEntryZip(
      'content.xml',
      '<office:document-content><office:body><office:text><text:h>Summary</text:h><text:p>Data specialist</text:p></office:text></office:body></office:document-content>',
    )
    expect(await extractResumePlainText(odt, 'cv.odt')).toBe(
      'Summary\nData specialist',
    )

    const rtf = Buffer.from(
      '{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}Aki Zita\\par Senior Analyst}',
    )
    expect(await extractResumePlainText(rtf, 'cv.rtf')).toBe(
      'Aki Zita\nSenior Analyst',
    )
  })

  it('returns empty string safely when a PDF buffer has no valid streams', async () => {
    const text = await extractResumePlainText(
      Buffer.from('%PDF-1.7 sample resume'),
      'ZitaAki_Resume.pdf',
    )
    expect(text).toBe('')
  })
})
