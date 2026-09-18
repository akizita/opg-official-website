import { describe, expect, it } from 'vitest'

import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  sanitizeFileName,
  uploadMediaAsset,
} from '@/lib/content/media'

describe('Media Management and Storage', () => {
  it('sanitizes unsafe file names into clean alphanumeric strings with timestamp', () => {
    const raw = 'My Unsafe File Name @ 2026!.PNG'
    const sanitized = sanitizeFileName(raw)

    expect(sanitized).toMatch(/^my-unsafe-file-name-2026-\d+\.png$/)
    expect(sanitized).not.toContain(' ')
    expect(sanitized).not.toContain('@')
    expect(sanitized).not.toContain('!')
  })

  it('rejects files larger than 5 MB', async () => {
    const fakeLargeFile = new File([''], 'too-large.png', { type: 'image/png' })
    Object.defineProperty(fakeLargeFile, 'size', { value: MAX_FILE_SIZE_BYTES + 1 })

    const result = await uploadMediaAsset(fakeLargeFile, { altText: 'Test' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('5 MB maximum size limit')
  })

  it('rejects unsupported file MIME types', async () => {
    const fakeExeFile = new File(['payload'], 'malware.exe', { type: 'application/x-msdownload' })

    const result = await uploadMediaAsset(fakeExeFile, { altText: 'Malware' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Unsupported image format')
  })

  it('validates allowed image MIME types list', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/png')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/webp')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/avif')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/svg+xml')
  })
})

