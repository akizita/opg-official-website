'use server'

import { revalidatePath } from 'next/cache'

import { getAdminSession } from '@/lib/auth/admin-session'
import { isAdminMfaRequired } from '@/lib/auth/config'
import {
  canEditDraft,
  canPublish,
  canRequestChanges,
  canSubmitReview,
} from '@/lib/auth/permissions'
import {
  ABOUT_COPY_SECTIONS,
  ARTICLES_COPY_SECTIONS,
  CAREERS_COPY_SECTIONS,
  CLIENTS_COPY_SECTIONS,
  CONTACT_COPY_SECTIONS,
  HOME_COPY_SECTIONS,
  pageCopyBlocks,
  readPageCopy,
} from '@/lib/content/page-copy'
import {
  type DocumentStatus,
  type PageDocument,
  type RichTextBlock,
  validatePageDocumentInput,
} from '@/lib/content/page-documents'
import {
  isValidVisualUrl,
  pageVisualBlock,
  type PageVisualConfig,
  type VisualPage,
  VISUAL_BLOCK_KEY,
  VISUAL_PAGES,
  VISUAL_SECTION_GROUPS,
} from '@/lib/content/page-visual'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

const SCHEMAS = {
  home: HOME_COPY_SECTIONS,
  about: ABOUT_COPY_SECTIONS,
  clients: CLIENTS_COPY_SECTIONS,
  careers: CAREERS_COPY_SECTIONS,
  articles: ARTICLES_COPY_SECTIONS,
  contact: CONTACT_COPY_SECTIONS,
} as const

export type VisualSaveInput = {
  page: VisualPage
  intent: 'save_draft' | 'publish' | 'unpublish' | 'submit_review' | 'request_changes'
  expectedVersion: number
  title: string
  summary: string
  body?: string
  editorialTitle?: string
  editorialLead?: string
  copy: Record<string, string>
  visual: PageVisualConfig
  seoTitle: string
  seoDescription: string
  ogImageUrl: string
  canonicalUrl: string
}

export type VisualSaveResult = {
  success: boolean
  message: string
  status?: DocumentStatus
  version?: number
  updatedAt?: string
}

const validSelector = (selector: string) =>
  selector.length > 0 &&
  selector.length < 500 &&
  /^[.#>:a-zA-Z0-9_() -]+$/.test(selector)

function validateVisualConfig(page: VisualPage, config: PageVisualConfig): string | null {
  if (!config || typeof config !== 'object') return 'Visual settings are invalid.'
  if (
    !config.images || typeof config.images !== 'object' ||
    !config.links || typeof config.links !== 'object' ||
    !config.styles || typeof config.styles !== 'object' ||
    !config.sectionOrder || typeof config.sectionOrder !== 'object'
  ) return 'Visual settings are incomplete.'
  if (JSON.stringify(config).length > 50000) return 'Visual settings are too large.'

  for (const [selector, image] of Object.entries(config.images)) {
    if (!validSelector(selector)) return 'An image selector is invalid.'
    if (!image || typeof image.src !== 'string' || !/^(https?:\/\/|\/[^/])/.test(image.src))
      return 'Choose an uploaded or valid external image.'
    if (typeof image.alt !== 'string' || !image.alt.trim() || image.alt.length > 300)
      return 'Every replacement image needs descriptive alt text.'
    if (typeof image.position !== 'string' || !/^\d{1,3}% \d{1,3}%$/.test(image.position))
      return 'Image focal point is invalid.'
    const [x, y] = image.position.split(' ').map((part) => Number.parseInt(part, 10))
    if (x > 100 || y > 100) return 'Image focal point must be between 0% and 100%.'
  }
  for (const [selector, href] of Object.entries(config.links)) {
    if (!validSelector(selector) || !isValidVisualUrl(href))
      return 'Choose a listed site destination or a valid external URL.'
  }
  for (const [selector, style] of Object.entries(config.styles)) {
    if (!validSelector(selector)) return 'A style target is invalid.'
    for (const color of [style.color, style.backgroundColor]) {
      if (color && !/^#[0-9a-fA-F]{6}$|^var\(--[a-z-]+\)$/.test(color))
        return 'Choose a design color or a six-digit custom color.'
    }
    if (style.textAlign && !['left', 'center', 'right'].includes(style.textAlign))
      return 'Alignment is invalid.'
    for (const spacing of [style.paddingTop, style.paddingBottom]) {
      if (spacing && !/^(0|0\.5|1|1\.5|2|3|4|6|8)rem$/.test(spacing))
        return 'Choose a supported spacing value.'
    }
  }
  for (const group of VISUAL_SECTION_GROUPS[page]) {
    const order = config.sectionOrder[group.id]
    if (!order) continue
    const expected = group.sections.map((section) => section.id)
    if (order.length !== expected.length || new Set(order).size !== expected.length ||
        order.some((id) => !expected.includes(id)))
      return 'Section order is invalid.'
  }
  return null
}

export async function saveVisualPageAction(input: VisualSaveInput): Promise<VisualSaveResult> {
  if (!input || !Object.prototype.hasOwnProperty.call(VISUAL_PAGES, input.page))
    return { success: false, message: 'Unknown marketing page.' }
  const session = await getAdminSession()
  if (!session) return { success: false, message: 'Sign in to save this page.' }
  if (isAdminMfaRequired() && session.currentLevel !== 'aal2')
    return { success: false, message: 'Two-factor authentication is required.' }

  const role = session.profile.roleKey
  let status: DocumentStatus
  switch (input.intent) {
    case 'publish':
      if (!canPublish(role)) return { success: false, message: 'You cannot publish pages.' }
      status = 'published'
      break
    case 'unpublish':
      if (!canPublish(role)) return { success: false, message: 'You cannot unpublish pages.' }
      status = 'unpublished'
      break
    case 'submit_review':
      if (!canSubmitReview(role) || role === 'super_admin')
        return { success: false, message: 'You cannot submit this page for review.' }
      status = 'in_review'
      break
    case 'request_changes':
      if (!canRequestChanges(role))
        return { success: false, message: 'You cannot request changes.' }
      status = 'changes_requested'
      break
    case 'save_draft':
      if (!canEditDraft(role)) return { success: false, message: 'You cannot edit pages.' }
      status = 'draft'
      break
    default:
      return { success: false, message: 'Unknown save action.' }
  }

  const schema = SCHEMAS[input.page]
  const copyForm = new FormData()
  for (const section of schema) {
    for (const field of section.fields) {
      copyForm.set(field.key, input.copy?.[field.key] ?? '')
    }
  }
  const copy = readPageCopy(copyForm, schema)
  if (Object.keys(copy.errors).length)
    return { success: false, message: Object.values(copy.errors)[0] }
  const visualError = validateVisualConfig(input.page, input.visual)
  if (visualError) return { success: false, message: visualError }

  const supabase = await createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('page_documents')
    .select('*')
    .eq('slug', input.page)
    .maybeSingle<PageDocument>()
  if (fetchError) return { success: false, message: 'Could not load the current page version.' }
  const currentVersion = existing?.version ?? 0
  if (input.expectedVersion !== currentVersion)
    return { success: false, message: 'This page changed since you opened it. Refresh before saving to avoid overwriting another editor.' }

  const knownKeys = new Set(schema.flatMap((section) => section.fields.map((field) => field.key)))
  const previous = Array.isArray(existing?.content) ? existing.content : []
  let replacedClientHeading = false
  let replacedClientParagraph = false
  const preserved = previous.filter((block) => {
    if (block.type === 'paragraph' && block.key)
      return block.key !== VISUAL_BLOCK_KEY && !knownKeys.has(block.key)
    if (input.page === 'about' && block.type === 'paragraph') return false
    if (input.page === 'clients' && block.type === 'heading' && !replacedClientHeading) {
      replacedClientHeading = true
      return false
    }
    if (input.page === 'clients' && block.type === 'paragraph' && !replacedClientParagraph) {
      replacedClientParagraph = true
      return false
    }
    return true
  })
  const content: RichTextBlock[] = [...preserved]
  if (input.page === 'about') {
    const paragraphs = (input.body || '').split(/\n\n+/).map((value) => value.trim()).filter(Boolean)
    if (!paragraphs.length) return { success: false, message: 'Who We Are story cannot be empty.' }
    content.push(...paragraphs.map((paragraph): RichTextBlock => ({ type: 'paragraph', content: paragraph })))
  }
  if (input.page === 'clients') {
    const editorialTitle = input.editorialTitle?.trim()
    const editorialLead = input.editorialLead?.trim()
    if (!editorialTitle || !editorialLead)
      return { success: false, message: 'The Clients featured story needs a heading and introduction.' }
    content.push(
      { type: 'heading', level: 2, content: editorialTitle },
      { type: 'paragraph', content: editorialLead },
    )
  }
  content.push(...pageCopyBlocks(copy.values), pageVisualBlock(input.visual))

  const primary = input.page === 'careers'
    ? { title: copy.values.heroTitle, summary: copy.values.heroLead }
    : input.page === 'articles'
      ? { title: copy.values.pageTitle, summary: copy.values.collectionLead }
      : input.page === 'contact'
        ? { title: copy.values.heroTitle, summary: copy.values.heroLead }
        : { title: input.title, summary: input.summary }
  const validation = validatePageDocumentInput({
    ...primary,
    content,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
    og_image_url: input.ogImageUrl,
    canonical_url: input.canonicalUrl,
    status,
  })
  if (!validation.success)
    return { success: false, message: validation.message }

  const now = new Date().toISOString()
  const version = currentVersion + 1
  const record = {
    slug: input.page,
    ...validation.data,
    status,
    version,
    updated_at: now,
    updated_by: session.profile.id,
    ...(status === 'published' ? { published_at: now, published_by: session.profile.id } : {}),
  }
  const { data: saved, error } = existing
    ? await supabase
        .from('page_documents')
        .update(record)
        .eq('id', existing.id)
        .eq('version', currentVersion)
        .select('id')
        .maybeSingle()
    : await supabase
        .from('page_documents')
        .insert({ ...record, created_at: now, created_by: session.profile.id })
        .select('id')
        .maybeSingle()
  if (error) {
    logger.error('Failed to save visual marketing page', { page: input.page, error: error.message })
    return { success: false, message: 'Could not save the page. Please retry.' }
  }
  if (!saved)
    return { success: false, message: 'This page was updated by another editor. Refresh before saving.' }
  revalidatePath(VISUAL_PAGES[input.page].path)
  revalidatePath('/admin/pages')
  revalidatePath('/sitemap.xml')
  return {
    success: true,
    message: status === 'published' ? 'Page published. The public page has been refreshed.' : 'Page saved.',
    status,
    version,
    updatedAt: now,
  }
}
