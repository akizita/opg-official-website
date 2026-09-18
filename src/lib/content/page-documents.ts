import type { RichTextBlock } from '@/components/ui/rich-text'

export type DocumentStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'published'
  | 'unpublished'
  | 'archived'

export const VALID_DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'draft',
  'in_review',
  'changes_requested',
  'published',
  'unpublished',
  'archived',
] as const

export type PageDocument = {
  id: string
  slug: string
  title: string
  summary: string | null
  content: RichTextBlock[]
  seo_title: string | null
  seo_description: string | null
  canonical_url: string | null
  og_image_url: string | null
  status: DocumentStatus
  version: number
  created_by: string | null
  updated_by: string | null
  published_by: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  archived_at: string | null
}

export type MissionVisionFormData = {
  title: string
  summary: string
  missionTitle: string
  missionBody: string
  visionTitle: string
  visionBody: string
  calloutText: string
  calloutVariant: 'info' | 'warning'
  seoTitle: string
  seoDescription: string
  ogImageUrl: string
  canonicalUrl: string
}

export type PageDocumentInput = {
  title: string
  summary: string | null
  content: RichTextBlock[]
  seo_title: string | null
  seo_description: string | null
  canonical_url: string | null
  og_image_url: string | null
  status?: DocumentStatus
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string>; message: string }

/**
 * Extracts structured mission & vision fields from RichTextBlock[] content.
 */
export function extractMissionVisionContent(
  content: RichTextBlock[] | null | undefined,
): {
  missionTitle: string
  missionBody: string
  visionTitle: string
  visionBody: string
  calloutText: string
  calloutVariant: 'info' | 'warning'
} {
  const fallback = {
    missionTitle: 'Our Mission',
    missionBody: '',
    visionTitle: 'Our Vision',
    visionBody: '',
    calloutText: '',
    calloutVariant: 'info' as 'info' | 'warning',
  }

  if (!Array.isArray(content) || content.length === 0) {
    return fallback
  }

  let foundFirstHeading = false
  let foundSecondHeading = false

  for (const block of content) {
    if (block.type === 'heading') {
      if (!foundFirstHeading) {
        fallback.missionTitle = block.content
        foundFirstHeading = true
      } else if (!foundSecondHeading) {
        fallback.visionTitle = block.content
        foundSecondHeading = true
      }
    } else if (block.type === 'paragraph') {
      if (foundFirstHeading && !foundSecondHeading) {
        fallback.missionBody = fallback.missionBody
          ? `${fallback.missionBody}\n\n${block.content}`
          : block.content
      } else if (foundSecondHeading) {
        fallback.visionBody = fallback.visionBody
          ? `${fallback.visionBody}\n\n${block.content}`
          : block.content
      }
    } else if (block.type === 'callout') {
      fallback.calloutText = block.content
      if (block.variant === 'warning') {
        fallback.calloutVariant = 'warning'
      }
    }
  }

  return fallback
}

/**
 * Builds standard RichTextBlock[] content for Mission & Vision.
 */
export function buildMissionVisionBlocks(fields: {
  missionTitle: string
  missionBody: string
  visionTitle: string
  visionBody: string
  calloutText?: string
  calloutVariant?: 'info' | 'warning'
}): RichTextBlock[] {
  const blocks: RichTextBlock[] = []

  const missionTitle = fields.missionTitle.trim() || 'Our Mission'
  blocks.push({ type: 'heading', level: 2, content: missionTitle })

  if (fields.missionBody.trim()) {
    const paragraphs = fields.missionBody
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
    for (const para of paragraphs) {
      blocks.push({ type: 'paragraph', content: para })
    }
  }

  const visionTitle = fields.visionTitle.trim() || 'Our Vision'
  blocks.push({ type: 'heading', level: 2, content: visionTitle })

  if (fields.visionBody.trim()) {
    const paragraphs = fields.visionBody
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
    for (const para of paragraphs) {
      blocks.push({ type: 'paragraph', content: para })
    }
  }

  if (fields.calloutText && fields.calloutText.trim()) {
    blocks.push({
      type: 'callout',
      content: fields.calloutText.trim(),
      variant: fields.calloutVariant || 'info',
    })
  }

  return blocks
}

/**
 * Validates document input values against schema rules.
 */
export function validatePageDocumentInput(
  raw: unknown,
): ValidationResult<PageDocumentInput> {
  const errors: Record<string, string> = {}

  if (!raw || typeof raw !== 'object') {
    return {
      success: false,
      errors: { form: 'Invalid input data.' },
      message: 'Input data must be an object.',
    }
  }

  const input = raw as Record<string, unknown>

  // Title validation
  const rawTitle = input.title
  if (typeof rawTitle !== 'string' || rawTitle.trim() === '') {
    errors.title = 'Title is required and cannot be empty.'
  } else if (rawTitle.trim().length > 200) {
    errors.title = 'Title cannot exceed 200 characters.'
  }

  // Summary validation
  let summary: string | null = null
  if (input.summary !== undefined && input.summary !== null) {
    if (typeof input.summary !== 'string') {
      errors.summary = 'Summary must be a string.'
    } else {
      const trimmed = input.summary.trim()
      if (trimmed.length > 500) {
        errors.summary = 'Summary cannot exceed 500 characters.'
      } else {
        summary = trimmed.length > 0 ? trimmed : null
      }
    }
  }

  // Content validation
  let content: RichTextBlock[] = []
  if (!Array.isArray(input.content)) {
    errors.content = 'Content must be an array of blocks.'
  } else {
    content = input.content as RichTextBlock[]
    if (content.length === 0) {
      errors.content = 'Content cannot be empty. Add at least one block.'
    } else {
      for (let i = 0; i < content.length; i++) {
        const block = content[i]
        if (!block || typeof block !== 'object' || !('type' in block)) {
          errors.content = `Block at index ${i} is malformed.`
          break
        }
        if (
          block.type === 'heading' &&
          (!block.content?.trim() || ![2, 3, 4].includes(block.level))
        ) {
          errors.content = `Heading block at index ${i} requires valid level (2, 3, or 4) and content.`
          break
        }
        if (
          (block.type === 'paragraph' ||
            block.type === 'callout' ||
            block.type === 'blockquote') &&
          !block.content?.trim()
        ) {
          errors.content = `Block at index ${i} of type '${block.type}' cannot have empty content.`
          break
        }
      }
    }
  }

  // SEO validations
  let seoTitle: string | null = null
  if (input.seo_title !== undefined && input.seo_title !== null) {
    if (typeof input.seo_title !== 'string') {
      errors.seo_title = 'SEO Title must be a string.'
    } else {
      const trimmed = input.seo_title.trim()
      if (trimmed.length > 100) {
        errors.seo_title = 'SEO Title cannot exceed 100 characters.'
      } else {
        seoTitle = trimmed.length > 0 ? trimmed : null
      }
    }
  }

  let seoDescription: string | null = null
  if (input.seo_description !== undefined && input.seo_description !== null) {
    if (typeof input.seo_description !== 'string') {
      errors.seo_description = 'SEO Description must be a string.'
    } else {
      const trimmed = input.seo_description.trim()
      if (trimmed.length > 250) {
        errors.seo_description = 'SEO Description cannot exceed 250 characters.'
      } else {
        seoDescription = trimmed.length > 0 ? trimmed : null
      }
    }
  }

  let canonicalUrl: string | null = null
  if (input.canonical_url !== undefined && input.canonical_url !== null) {
    if (typeof input.canonical_url !== 'string') {
      errors.canonical_url = 'Canonical URL must be a string.'
    } else {
      const trimmed = input.canonical_url.trim()
      canonicalUrl = trimmed.length > 0 ? trimmed : null
    }
  }

  let ogImageUrl: string | null = null
  if (input.og_image_url !== undefined && input.og_image_url !== null) {
    if (typeof input.og_image_url !== 'string') {
      errors.og_image_url = 'OG Image URL must be a string.'
    } else {
      const trimmed = input.og_image_url.trim()
      ogImageUrl = trimmed.length > 0 ? trimmed : null
    }
  }

  // Status validation (optional)
  let status: DocumentStatus | undefined
  if (input.status !== undefined && input.status !== null) {
    if (!VALID_DOCUMENT_STATUSES.includes(input.status as DocumentStatus)) {
      errors.status = `Status must be one of: ${VALID_DOCUMENT_STATUSES.join(', ')}.`
    } else {
      status = input.status as DocumentStatus
    }
  }

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0]
    return {
      success: false,
      errors,
      message: firstError,
    }
  }

  return {
    success: true,
    data: {
      title: (rawTitle as string).trim(),
      summary,
      content,
      seo_title: seoTitle,
      seo_description: seoDescription,
      canonical_url: canonicalUrl,
      og_image_url: ogImageUrl,
      ...(status ? { status } : {}),
    },
  }
}
