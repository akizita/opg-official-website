import { describe, expect, it } from 'vitest'

import {
  canArchive,
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
  canViewContent,
  hasRolePermission,
} from '@/lib/auth/permissions'
import {
  buildMissionVisionBlocks,
  extractMissionVisionContent,
  validatePageDocumentInput,
} from '@/lib/content/page-documents'

describe('page-documents schema & validation', () => {
  it('validates a complete and valid page document input', () => {
    const rawInput = {
      title: 'Mission & Vision',
      summary: 'Empowering global organizations with exceptional talent.',
      content: [
        { type: 'heading', level: 2, content: 'Our Mission' },
        { type: 'paragraph', content: 'Our mission is to connect talent.' },
        { type: 'callout', variant: 'info', content: 'Core values.' },
      ],
      seo_title: 'Mission & Vision | OPG',
      seo_description:
        'Discover the mission and vision of Outsourced Pro Global.',
      status: 'draft',
    }

    const result = validatePageDocumentInput(rawInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Mission & Vision')
      expect(result.data.summary).toBe(
        'Empowering global organizations with exceptional talent.',
      )
      expect(result.data.content).toHaveLength(3)
      expect(result.data.status).toBe('draft')
    }
  })

  it('rejects missing or empty title with understandable message', () => {
    const emptyTitle = {
      title: '   ',
      content: [{ type: 'paragraph', content: 'Some body text.' }],
    }
    const result = validatePageDocumentInput(emptyTitle)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.title).toBeDefined()
      expect(result.message).toContain('Title is required')
    }
  })

  it('rejects empty content block array', () => {
    const emptyContent = {
      title: 'Valid Title',
      content: [],
    }
    const result = validatePageDocumentInput(emptyContent)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.content).toContain('Content cannot be empty')
    }
  })

  it('rejects malformed rich text block', () => {
    const malformed = {
      title: 'Valid Title',
      content: [
        { type: 'heading', level: 5, content: 'Invalid heading level' },
      ],
    }
    const result = validatePageDocumentInput(malformed)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.content).toContain('valid level')
    }
  })

  it('rejects invalid status', () => {
    const invalidStatus = {
      title: 'Valid Title',
      content: [{ type: 'paragraph', content: 'Valid paragraph' }],
      status: 'not_a_status',
    }
    const result = validatePageDocumentInput(invalidStatus)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.status).toContain('Status must be one of')
    }
  })

  it('extracts and builds mission vision blocks round-trip', () => {
    const original = {
      missionTitle: 'Custom Mission',
      missionBody: 'First paragraph.\n\nSecond paragraph.',
      visionTitle: 'Custom Vision',
      visionBody: 'Vision paragraph.',
      calloutText: 'Important value.',
      calloutVariant: 'info' as const,
    }

    const blocks = buildMissionVisionBlocks(original)
    expect(blocks).toHaveLength(6)
    expect(blocks[0]).toEqual({
      type: 'heading',
      level: 2,
      content: 'Custom Mission',
    })
    expect(blocks[1]).toEqual({
      type: 'paragraph',
      content: 'First paragraph.',
    })
    expect(blocks[2]).toEqual({
      type: 'paragraph',
      content: 'Second paragraph.',
    })
    expect(blocks[3]).toEqual({
      type: 'heading',
      level: 2,
      content: 'Custom Vision',
    })
    expect(blocks[4]).toEqual({
      type: 'paragraph',
      content: 'Vision paragraph.',
    })

    const extracted = extractMissionVisionContent([
      ...blocks,
      { type: 'callout', variant: 'warning', content: 'Warning note.' },
    ])
    expect(extracted.missionTitle).toBe('Custom Mission')
    expect(extracted.missionBody).toContain('First paragraph.')
    expect(extracted.visionTitle).toBe('Custom Vision')
    expect(extracted.visionBody).toBe('Vision paragraph.')
    expect(extracted.calloutText).toBe('Warning note.')
    expect(extracted.calloutVariant).toBe('warning')
  })
})

describe('role permissions matrix', () => {
  it('editor has draft and submit permissions but cannot publish or archive', () => {
    expect(canViewContent('editor')).toBe(true)
    expect(canEditDraft('editor')).toBe(true)
    expect(canSubmitReview('editor')).toBe(true)
    expect(canPublish('editor')).toBe(false)
    expect(canArchive('editor')).toBe(false)
  })

  it('publisher has publish and archive permissions in addition to editing', () => {
    expect(canViewContent('publisher')).toBe(true)
    expect(canEditDraft('publisher')).toBe(true)
    expect(canSubmitReview('publisher')).toBe(true)
    expect(canRequestChanges('publisher')).toBe(true)
    expect(canPublish('publisher')).toBe(true)
    expect(canArchive('publisher')).toBe(true)
  })

  it('super_admin has all permissions', () => {
    expect(canViewContent('super_admin')).toBe(true)
    expect(canEditDraft('super_admin')).toBe(true)
    expect(canPublish('super_admin')).toBe(true)
    expect(canArchive('super_admin')).toBe(true)
    expect(hasRolePermission('super_admin', 'users.roles.manage')).toBe(true)
  })

  it('inquiry_manager has no content publishing or editing permissions', () => {
    expect(canViewContent('inquiry_manager')).toBe(false)
    expect(canEditDraft('inquiry_manager')).toBe(false)
    expect(canPublish('inquiry_manager')).toBe(false)
  })
})
