'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { uploadMediaAction } from '@/app/admin/media/actions'
import {
  saveVisualPageAction,
  type VisualSaveInput,
} from '@/app/admin/pages/visual-actions'
import { applyPageVisualOverrides } from '@/components/site/page-visual-runtime'
import {
  ABOUT_COPY_SECTIONS,
  ARTICLES_COPY_SECTIONS,
  CAREERS_COPY_SECTIONS,
  CLIENTS_COPY_SECTIONS,
  CONTACT_COPY_SECTIONS,
  HOME_COPY_SECTIONS,
  type CopySection,
} from '@/lib/content/page-copy'
import type { DocumentStatus } from '@/lib/content/page-documents'
import type { MediaAsset } from '@/lib/content/media'
import {
  PAGE_LINK_DIRECTORY,
  type PageVisualConfig,
  type VisualPage,
  VISUAL_PAGES,
  VISUAL_SECTION_GROUPS,
  isValidVisualUrl,
} from '@/lib/content/page-visual'

export type VisualPageDraft = Omit<VisualSaveInput, 'page' | 'intent' | 'expectedVersion'> & {
  status: DocumentStatus
  version: number
  updatedAt: string | null
}

type Selection =
  | { kind: 'text'; key: string; selector: string; linkSelector?: string; linkHref?: string }
  | { kind: 'image'; selector: string; baseSrc: string; baseAlt: string }
  | { kind: 'section'; id: string; selector: string }

const SCHEMAS: Record<VisualPage, readonly CopySection[]> = {
  home: HOME_COPY_SECTIONS,
  about: ABOUT_COPY_SECTIONS,
  clients: CLIENTS_COPY_SECTIONS,
  careers: CAREERS_COPY_SECTIONS,
  articles: ARTICLES_COPY_SECTIONS,
  contact: CONTACT_COPY_SECTIONS,
}

const DESIGN_COLORS = [
  { label: 'Brand gold', value: 'var(--color-brand)' },
  { label: 'Brand yellow', value: 'var(--color-brand-secondary)' },
  { label: 'Ink', value: 'var(--color-ink)' },
  { label: 'Muted ink', value: 'var(--color-ink-soft)' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#0d0d0d' },
] as const
const SPACING = ['0rem', '0.5rem', '1rem', '1.5rem', '2rem', '3rem', '4rem', '6rem', '8rem']

function normalized(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function elementSelector(element: Element, root: Element): string {
  const parts: string[] = []
  let current: Element | null = element
  while (current && current !== root) {
    const parent: Element | null = current.parentElement
    if (!parent) break
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === current?.tagName)
    const position = sameTag.indexOf(current) + 1
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${position})`)
    current = parent
  }
  return parts.join(' > ')
}

function findFieldElement(root: Element, value: string): HTMLElement | null {
  if (!value.trim()) return null
  const candidates = root.querySelectorAll<HTMLElement>(
    'h1,h2,h3,h4,p,span,strong,small,dt,dd,button,a,label,li',
  )
  for (const element of candidates) {
    if (element.closest('[aria-hidden="true"],script,style')) continue
    if (element.dataset.cmsField) continue
    if (normalized(element.textContent || '') !== normalized(value)) continue
    const sameChild = Array.from(element.children).some(
      (child) => normalized(child.textContent || '') === normalized(value),
    )
    if (!sameChild) return element
  }
  return null
}

function decorateCanvas(doc: Document, page: VisualPage, draft: VisualPageDraft) {
  const root = doc.querySelector('#main-content')
  if (!root) return
  const fields: Record<string, string> =
    page === 'home' || page === 'about' || page === 'clients'
      ? { title: draft.title, summary: draft.summary, ...draft.copy }
      : { ...draft.copy }
  if (draft.editorialTitle) fields.editorialTitle = draft.editorialTitle
  if (draft.editorialLead) fields.editorialLead = draft.editorialLead
  for (const [key, value] of Object.entries(fields)) {
    const element = findFieldElement(root, value)
    if (element) element.dataset.cmsField = key
    else if (value.includes('\n')) {
      value.split(/\r?\n/).forEach((line, index) => {
        const lineElement = findFieldElement(root, line)
        if (lineElement) lineElement.dataset.cmsField = `line:${key}:${index}`
      })
    }
  }
  if (draft.body) {
    draft.body.split(/\n\n+/).forEach((paragraph, index) => {
      const element = findFieldElement(root, paragraph)
      if (element) element.dataset.cmsField = `body:${index}`
    })
  }
}

function fieldLabel(page: VisualPage, key: string): string {
  if (key === 'title') return 'Page heading'
  if (key === 'summary') return 'Hero introduction'
  if (key === 'editorialTitle') return 'Featured story heading'
  if (key === 'editorialLead') return 'Featured story introduction'
  if (key.startsWith('body:')) return `Who We Are paragraph ${Number(key.split(':')[1]) + 1}`
  if (key.startsWith('line:')) {
    const [, base, index] = key.split(':')
    return `${fieldLabel(page, base)} · line ${Number(index) + 1}`
  }
  return SCHEMAS[page].flatMap((section) => section.fields).find((field) => field.key === key)?.label ?? key
}

function fieldValue(draft: VisualPageDraft, key: string): string {
  if (key.startsWith('body:')) return draft.body?.split(/\n\n+/)[Number(key.split(':')[1])] ?? ''
  if (key.startsWith('line:')) {
    const [, base, index] = key.split(':')
    return draft.copy[base]?.split(/\r?\n/)[Number(index)] ?? ''
  }
  if (key === 'title' || key === 'summary' || key === 'editorialTitle' || key === 'editorialLead')
    return draft[key] ?? ''
  return draft.copy[key] ?? ''
}

function updateFieldValue(draft: VisualPageDraft, key: string, value: string): VisualPageDraft {
  if (key.startsWith('body:')) {
    const paragraphs = (draft.body || '').split(/\n\n+/)
    paragraphs[Number(key.split(':')[1])] = value
    return { ...draft, body: paragraphs.join('\n\n') }
  }
  if (key.startsWith('line:')) {
    const [, base, index] = key.split(':')
    const lines = (draft.copy[base] || '').split(/\r?\n/)
    lines[Number(index)] = value
    return { ...draft, copy: { ...draft.copy, [base]: lines.join('\n') } }
  }
  if (key === 'title' || key === 'summary' || key === 'editorialTitle' || key === 'editorialLead')
    return { ...draft, [key]: value }
  return { ...draft, copy: { ...draft.copy, [key]: value } }
}

function cloneConfig(config: PageVisualConfig): PageVisualConfig {
  return {
    images: { ...config.images },
    links: { ...config.links },
    styles: { ...config.styles },
    sectionOrder: { ...config.sectionOrder },
  }
}

function setCanvasMode(doc: Document, mode: 'edit' | 'preview') {
  doc.documentElement.dataset.opgEditorMode = mode
}

function setCanvasPage(doc: Document, page: VisualPage) {
  doc.documentElement.dataset.opgEditorPage = page
}

export function VisualPagesEditor({
  initialPage,
  initialPages,
  media,
  permissions,
}: {
  initialPage: VisualPage
  initialPages: Record<VisualPage, VisualPageDraft>
  media: MediaAsset[]
  permissions: { canEditDraft: boolean; canPublish: boolean; canManageMedia: boolean }
}) {
  const [page, setPage] = useState<VisualPage>(initialPage)
  const [drafts, setDrafts] = useState(initialPages)
  const [dirtyPages, setDirtyPages] = useState<Set<VisualPage>>(new Set())
  const [selection, setSelection] = useState<Selection | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [zoom, setZoom] = useState<'fit' | 'actual'>('fit')
  const [stageWidth, setStageWidth] = useState(900)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [mediaSearch, setMediaSearch] = useState('')
  const [linkSearch, setLinkSearch] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [dragging, setDragging] = useState<{ group: string; id: string } | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<Array<{ page: VisualPage; draft: VisualPageDraft }>>([])
  const latestRef = useRef({ page, drafts, mode })
  useEffect(() => {
    latestRef.current = { page, drafts, mode }
  }, [page, drafts, mode])
  const draft = drafts[page]
  const dirty = dirtyPages.has(page)
  const virtualWidth = device === 'desktop' ? 1280 : 390
  const virtualHeight = device === 'desktop' ? 850 : 844
  const scale = zoom === 'actual' ? 1 : Math.min(1, stageWidth / virtualWidth)
  const pageUrl = VISUAL_PAGES[page].path
  const frameUrl = `${pageUrl}?opgPreview=1&editorRefresh=${refresh}`

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyPages.size) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirtyPages])

  useEffect(() => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    setCanvasMode(doc, mode)
    doc.querySelectorAll<HTMLElement>('[data-cms-selected]').forEach((element) => {
      delete element.dataset.cmsSelected
      element.contentEditable = 'false'
    })
    if (mode !== 'edit' || !selection) return
    try {
      const element = selection.selector
        ? doc.querySelector<HTMLElement>(`#main-content ${selection.selector}`)
        : selection.kind === 'text'
          ? Array.from(doc.querySelectorAll<HTMLElement>('[data-cms-field]')).find(
              (item) => item.dataset.cmsField === selection.key,
            )
          : null
      if (element) element.dataset.cmsSelected = 'true'
    } catch {
      // A selected element may disappear when a carousel changes slides.
    }
  }, [mode, selection, page, refresh])

  const updateDraft = useCallback((updater: (current: VisualPageDraft) => VisualPageDraft) => {
    historyRef.current.push({ page, draft: structuredClone(latestRef.current.drafts[page]) })
    if (historyRef.current.length > 40) historyRef.current.shift()
    setCanUndo(true)
    setDrafts((current) => ({ ...current, [page]: updater(current[page]) }))
    setDirtyPages((current) => new Set(current).add(page))
    setMessage('Unsaved changes')
  }, [page])

  const applyFrame = useCallback((next: VisualPageDraft) => {
    const doc = frameRef.current?.contentDocument
    if (doc) applyPageVisualOverrides(page, next.visual, doc)
  }, [page])

  const setText = useCallback((key: string, value: string, source?: HTMLElement) => {
    updateDraft((current) => updateFieldValue(current, key, value))
    const doc = frameRef.current?.contentDocument
    if (doc) {
      for (const element of doc.querySelectorAll<HTMLElement>('[data-cms-field]')) {
        if (element.dataset.cmsField !== key || element === source) continue
        if (key === 'title' && element.classList.contains('about-hero-banner__title')) {
          const prefix = element.querySelector<HTMLElement>('.about-hero-banner__title-prefix')
          const accent = element.querySelector<HTMLElement>('.about-hero-banner__title-accent')
          if (prefix && accent && value.toLowerCase().startsWith('about ')) {
            prefix.textContent = 'About'
            accent.textContent = value.slice(6)
            continue
          }
        }
        element.textContent = value
      }
    }
  }, [updateDraft])

  const handleFrameLoad = useCallback(() => {
    const iframe = frameRef.current
    const doc = iframe?.contentDocument
    if (!doc || !iframe?.contentWindow) {
      setMessage('The preview could not be inspected. Check that the local site is running.')
      return
    }
    const current = latestRef.current
    const currentDraft = current.drafts[current.page]
    applyPageVisualOverrides(current.page, currentDraft.visual, doc)
    decorateCanvas(doc, current.page, currentDraft)
    setCanvasPage(doc, current.page)
    let editorStyle = doc.getElementById('opg-visual-editor-style')
    if (!editorStyle) {
      editorStyle = doc.createElement('style')
      editorStyle.id = 'opg-visual-editor-style'
      editorStyle.textContent = `
        html[data-opg-editor-mode="edit"] [data-cms-field]:hover,
        html[data-opg-editor-mode="edit"] [data-cms-section]:hover,
        html[data-opg-editor-mode="edit"] #main-content img:hover {
          outline: 2px dashed #f2b705 !important;
          outline-offset: 4px;
        }
        html[data-opg-editor-mode="edit"] [data-cms-field]:hover { cursor: text; }
        html[data-opg-editor-mode="edit"] #main-content img:hover { cursor: pointer; }
        html[data-opg-editor-mode="edit"] [data-cms-selected] {
          outline: 3px solid #f29f04 !important;
          outline-offset: 4px;
        }
        html[data-opg-editor-page="home"] .site-header-wrapper,
        html[data-opg-editor-page="about"] .site-header-wrapper,
        html[data-opg-editor-page="clients"] .site-header-wrapper {
          visibility: hidden !important;
          pointer-events: none !important;
        }
        html[data-opg-editor-page="careers"] .site-header-wrapper,
        html[data-opg-editor-page="articles"] .site-header-wrapper,
        html[data-opg-editor-page="contact"] .site-header-wrapper {
          display: none !important;
        }
        #opg-visual-image-action {
          position: fixed;
          z-index: 10000;
          display: none;
          align-items: center;
          gap: 6px;
          padding: 8px 11px;
          border: 1px solid #fff;
          border-radius: 999px;
          background: #211c15;
          box-shadow: 0 4px 16px #0007;
          color: #fff;
          font: 700 13px/1 system-ui, sans-serif;
          cursor: pointer;
        }
        #opg-visual-image-action svg { width: 17px; height: 17px; }
        html[data-opg-editor-mode="preview"] #opg-visual-image-action { display: none !important; }
      `
      doc.head.append(editorStyle)
    }
    setCanvasMode(doc, current.mode)
    const root = doc.querySelector('#main-content')
    if (!root) return
    const imageAction = doc.createElement('button')
    imageAction.id = 'opg-visual-image-action'
    imageAction.type = 'button'
    imageAction.setAttribute('aria-label', 'Change this photo')
    imageAction.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h-4l-2 3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z"/><circle cx="12" cy="13" r="3"/></svg><span>Change photo</span>'
    doc.body.append(imageAction)
    let hoveredImage: HTMLImageElement | null = null
    const selectImage = (image: HTMLImageElement) => {
      setSelection({
        kind: 'image',
        selector: elementSelector(image, root),
        baseSrc: image.getAttribute('src') || '',
        baseAlt: image.getAttribute('alt') || '',
      })
    }
    const showImageAction = (image: HTMLImageElement) => {
      if (latestRef.current.mode !== 'edit') return
      const rect = image.getBoundingClientRect()
      if (rect.width < 40 || rect.height < 40) return
      hoveredImage = image
      imageAction.style.display = 'flex'
      imageAction.style.top = `${Math.max(8, rect.top + 10)}px`
      imageAction.style.left = `${Math.max(8, Math.min(rect.right - imageAction.offsetWidth - 10, doc.documentElement.clientWidth - imageAction.offsetWidth - 8))}px`
    }
    const hideImageAction = () => {
      imageAction.style.display = 'none'
    }
    const pointerMove = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target || target.nodeType !== 1 || imageAction.contains(target)) return
      const image = target.closest('img')
      if (image?.tagName === 'IMG' && root.contains(image)) showImageAction(image)
      else hideImageAction()
    }
    const click = (event: MouseEvent) => {
      if (latestRef.current.mode === 'preview') return
      const target = event.target as Element | null
      if (!target || target.nodeType !== 1) return
      event.preventDefault()
      event.stopPropagation()
      const image = target.closest('img') ?? (imageAction.contains(target) ? hoveredImage : null)
      if (image?.tagName === 'IMG') {
        selectImage(image)
        return
      }
      const text = target.closest<HTMLElement>('[data-cms-field]')
      if (text?.dataset.cmsField) {
        const anchor = text.closest('a')
        const item = {
          kind: 'text' as const,
          key: text.dataset.cmsField,
          selector: elementSelector(text, root),
          linkSelector: anchor ? elementSelector(anchor, root) : undefined,
          linkHref: anchor?.getAttribute('href') || undefined,
        }
        setSelection(item)
        if (text.childElementCount === 0 && !['A', 'BUTTON'].includes(text.tagName)) {
          text.contentEditable = 'true'
          text.setAttribute('role', 'textbox')
          text.setAttribute('aria-label', `Edit ${fieldLabel(current.page, item.key)}`)
          text.focus()
        }
        return
      }
      const section = target.closest<HTMLElement>('[data-cms-section]')
      if (section?.dataset.cmsSection)
        setSelection({ kind: 'section', id: section.dataset.cmsSection, selector: elementSelector(section, root) })
    }
    const input = (event: Event) => {
      const element = event.target as HTMLElement | null
      if (!element || element.nodeType !== 1) return
      const key = element.dataset.cmsField
      if (key) setText(key, element.innerText, element)
    }
    const paste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (!target || target.nodeType !== 1 || !target.dataset.cmsField) return
      event.preventDefault()
      const plain = event.clipboardData?.getData('text/plain') ?? ''
      iframe.contentWindow?.document.execCommand('insertText', false, plain)
    }
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLImageElement | null
      if (latestRef.current.mode !== 'edit' || target?.tagName !== 'IMG') return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      selectImage(target)
    }
    const makeImagesFocusable = () => {
      root.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
        image.tabIndex = 0
        image.setAttribute('role', 'button')
        image.setAttribute('aria-label', `Change photo: ${image.alt || 'untitled image'}`)
      })
    }
    makeImagesFocusable()
    doc.addEventListener('click', click, true)
    doc.addEventListener('input', input, true)
    doc.addEventListener('paste', paste, true)
    doc.addEventListener('pointermove', pointerMove, true)
    doc.addEventListener('keydown', keydown, true)
    doc.addEventListener('scroll', hideImageAction, true)
    const observer = new MutationObserver(() => {
      const current = latestRef.current
      decorateCanvas(doc, current.page, current.drafts[current.page])
      makeImagesFocusable()
    })
    observer.observe(root, { childList: true, subtree: true })
    const cleanup = () => {
      doc.removeEventListener('click', click, true)
      doc.removeEventListener('input', input, true)
      doc.removeEventListener('paste', paste, true)
      doc.removeEventListener('pointermove', pointerMove, true)
      doc.removeEventListener('keydown', keydown, true)
      doc.removeEventListener('scroll', hideImageAction, true)
      imageAction.remove()
      observer.disconnect()
    }
    iframe.addEventListener('load', cleanup, { once: true })
  }, [setText])

  const selectPage = (next: VisualPage) => {
    if (next === page) return
    if (dirty && !window.confirm('This page has unsaved changes. Switch pages and keep the unsaved draft in this session?'))
      return
    setPage(next)
    setSelection(null)
    setMessage('')
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    window.history.pushState(null, '', url)
  }

  const undo = () => {
    const entry = historyRef.current.pop()
    if (!entry) return
    setCanUndo(historyRef.current.length > 0)
    setDrafts((current) => ({ ...current, [entry.page]: entry.draft }))
    setDirtyPages((current) => new Set(current).add(entry.page))
    if (entry.page === page) {
      applyFrame(entry.draft)
      setRefresh((value) => value + 1)
    }
    setMessage('Last edit undone')
  }

  const save = async (intent: VisualSaveInput['intent']) => {
    if (saving) return
    setSaving(true)
    setMessage('Saving…')
    const current = latestRef.current.drafts[page]
    try {
      const result = await saveVisualPageAction({
        ...current,
        page,
        intent,
        expectedVersion: current.version,
      })
      setMessage(result.message)
      if (result.success && result.version && result.status) {
        setDrafts((all) => ({
          ...all,
          [page]: {
            ...all[page],
            version: result.version!,
            status: result.status!,
            updatedAt: result.updatedAt ?? null,
          },
        }))
        setDirtyPages((all) => {
          const next = new Set(all)
          next.delete(page)
          return next
        })
        historyRef.current = historyRef.current.filter((entry) => entry.page !== page)
        setCanUndo(historyRef.current.length > 0)
        setRefresh((value) => value + 1)
      }
    } catch {
      setMessage('The save request failed. Your edits are still in this browser session.')
    } finally {
      setSaving(false)
    }
  }

  const updateVisual = (updater: (config: PageVisualConfig) => PageVisualConfig) => {
    const next = { ...draft, visual: updater(cloneConfig(draft.visual)) }
    updateDraft(() => next)
    applyFrame(next)
  }

  const image = selection?.kind === 'image'
    ? draft.visual.images[selection.selector]
    : undefined
  const imageSrc = image?.src ?? (selection?.kind === 'image' ? selection.baseSrc : '')
  const imageAlt = image?.alt ?? (selection?.kind === 'image' ? selection.baseAlt : '')
  const imagePosition = image?.position ?? '50% 50%'
  const style = selection ? draft.visual.styles[selection.selector] ?? {} : {}
  const linkSelector = selection?.kind === 'text' ? selection.linkSelector : undefined
  const currentLink = linkSelector
    ? draft.visual.links[linkSelector] ??
      (selection?.kind === 'text' ? selection.linkHref || '' : '')
    : ''
  const filteredMedia = useMemo(
    () => media.filter((asset) => `${asset.file_name} ${asset.alt_text}`.toLowerCase().includes(mediaSearch.toLowerCase())).slice(0, 30),
    [media, mediaSearch],
  )
  const filteredLinks = PAGE_LINK_DIRECTORY.filter((item) =>
    `${item.label} ${item.href}`.toLowerCase().includes(linkSearch.toLowerCase()),
  )
  const selectedGroup = selection?.kind === 'section'
    ? VISUAL_SECTION_GROUPS[page].find((group) => group.sections.some((section) => section.id === selection.id))
    : undefined

  const setImage = (next: { src: string; alt: string; position: string }) => {
    if (selection?.kind !== 'image') return
    updateVisual((config) => ({
      ...config,
      images: { ...config.images, [selection.selector]: next },
    }))
  }

  const setLink = (href: string) => {
    if (!linkSelector || !isValidVisualUrl(href)) return
    updateVisual((config) => ({
      ...config,
      links: { ...config.links, [linkSelector]: href },
    }))
    setCustomUrl('')
  }

  const setStyle = (name: 'color' | 'backgroundColor' | 'textAlign' | 'paddingTop' | 'paddingBottom', value: string) => {
    if (!selection) return
    updateVisual((config) => ({
      ...config,
      styles: {
        ...config.styles,
        [selection.selector]: { ...(config.styles[selection.selector] ?? {}), [name]: value },
      },
    }))
  }

  const reorder = (groupId: string, sourceId: string, targetId: string) => {
    const group = VISUAL_SECTION_GROUPS[page].find((item) => item.id === groupId)
    if (!group || sourceId === targetId) return
    const order = [...(draft.visual.sectionOrder[groupId] ?? group.sections.map((item) => item.id))]
    const from = order.indexOf(sourceId)
    const to = order.indexOf(targetId)
    if (from < 0 || to < 0) return
    order.splice(from, 1)
    order.splice(to, 0, sourceId)
    updateVisual((config) => ({
      ...config,
      sectionOrder: { ...config.sectionOrder, [groupId]: order },
    }))
  }

  return (
    <div className="visual-editor">
      <header className="visual-editor__top">
        <div>
          <p className="visual-editor__eyebrow">Website CMS · Visual editor</p>
          <h1>{VISUAL_PAGES[page].label}</h1>
          <p>Click page content to edit it in context. Preview uses the live marketing components.</p>
        </div>
        <div className="visual-editor__savebar">
          <span className={dirty ? 'is-dirty' : 'is-saved'} role="status">
            {saving ? 'Saving…' : dirty ? 'Unsaved changes' : `Saved · ${draft.status}`}
          </span>
          <button disabled={!canUndo || saving} onClick={undo} type="button">Undo</button>
          <button disabled={!permissions.canEditDraft || saving} onClick={() => save('save_draft')} type="button">Save draft</button>
          {permissions.canPublish && (
            <button className="visual-editor__publish" disabled={saving} onClick={() => save('publish')} type="button">Publish page</button>
          )}
        </div>
      </header>
      {message && <p className="visual-editor__message" role="status">{message}</p>}
      <nav aria-label="Marketing pages" className="visual-editor__page-tabs">
        <span className="visual-editor__page-tabs-label">Pages</span>
        {Object.entries(VISUAL_PAGES).map(([id, item]) => (
          <button
            aria-current={page === id ? 'page' : undefined}
            className={page === id ? 'is-active' : ''}
            key={id}
            onClick={() => selectPage(id as VisualPage)}
            type="button"
          >
            {item.label}
            {dirtyPages.has(id as VisualPage) && <span aria-label="Unsaved changes" className="visual-editor__dirty-dot" />}
          </button>
        ))}
      </nav>
      <div className="visual-editor__layout">
        <section aria-label="Page canvas" className="visual-editor__canvas">
          <div className="visual-editor__toolbar">
            <div aria-label="Editor mode" role="group">
              <button aria-pressed={mode === 'edit'} onClick={() => setMode('edit')} type="button">Edit</button>
              <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')} type="button">Preview</button>
            </div>
            <div aria-label="Preview size" role="group">
              <button aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} type="button">Desktop</button>
              <button aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} type="button">Mobile</button>
              <button aria-pressed={zoom === 'actual'} onClick={() => setZoom(zoom === 'actual' ? 'fit' : 'actual')} type="button">{zoom === 'actual' ? 'Fit' : '100%'}</button>
            </div>
          </div>
          <div className="visual-editor__stage" ref={stageRef}>
            <div className="visual-editor__frame-shell" style={{ width: virtualWidth * scale, height: virtualHeight * scale }}>
              <iframe
                aria-label={`${VISUAL_PAGES[page].label} ${device} ${mode} canvas`}
                key={page}
                onLoad={handleFrameLoad}
                ref={frameRef}
                src={frameUrl}
                style={{ width: virtualWidth, height: virtualHeight, transform: `scale(${scale})` }}
                title={`${VISUAL_PAGES[page].label} page preview`}
              />
            </div>
          </div>
          <p className="visual-editor__hint">{mode === 'edit' ? 'Click text, images, or sections on the page to edit them. Links will not navigate in Edit mode.' : 'Preview mode keeps buttons, tabs, and carousels interactive.'}</p>
        </section>

        <aside aria-label="Selected element settings" className="visual-editor__inspector">
          <h2>Inspector</h2>
          {!selection && <p>Select text, an image, or a section on the canvas. The controls for that element will appear here.</p>}
          {selection?.kind === 'text' && (
            <div className="visual-editor__controls">
              <h3>{fieldLabel(page, selection.key)}</h3>
              <label htmlFor="visual-editor-text">Text</label>
              <textarea id="visual-editor-text" onChange={(event) => setText(selection.key, event.target.value)} rows={Math.min(8, Math.max(2, Math.ceil(fieldValue(draft, selection.key).length / 55)))} value={fieldValue(draft, selection.key)} />
              {selection.linkSelector && (
                <div className="visual-editor__link-picker">
                  <h3>Button or link destination</h3>
                  <p>Current: <code>{currentLink}</code></p>
                  <label htmlFor="visual-editor-link-search">Find a site page or section</label>
                  <input id="visual-editor-link-search" onChange={(event) => setLinkSearch(event.target.value)} placeholder="Search pages and sections" value={linkSearch} />
                  <div className="visual-editor__choices">
                    {filteredLinks.map((item) => <button key={item.href} onClick={() => setLink(item.href)} type="button"><span>{item.label}</span><small>{item.href}</small></button>)}
                  </div>
                  <label htmlFor="visual-editor-custom-url">Custom or external URL</label>
                  <input id="visual-editor-custom-url" onChange={(event) => setCustomUrl(event.target.value)} placeholder="https://example.com/page" value={customUrl} />
                  <button disabled={!isValidVisualUrl(customUrl)} onClick={() => setLink(customUrl)} type="button">Use URL</button>
                  {customUrl && !isValidVisualUrl(customUrl) && <p role="alert">Use a listed internal page or a valid http, https, mailto, or tel URL.</p>}
                </div>
              )}
            </div>
          )}
          {selection?.kind === 'image' && (
            <div className="visual-editor__controls">
              <h3>Image</h3>
              {imageSrc && (
                // Library previews can include uploaded and external URLs outside Next Image's allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={imageAlt || 'Selected image preview'} className="visual-editor__image-preview" src={imageSrc} />
              )}
              <label htmlFor="visual-editor-alt">Alternative text</label>
              <input id="visual-editor-alt" onChange={(event) => setImage({ src: imageSrc, alt: event.target.value, position: imagePosition })} value={imageAlt} />
              <label htmlFor="visual-editor-focal-x">Horizontal focal point: {imagePosition.split(' ')[0]}</label>
              <input id="visual-editor-focal-x" max="100" min="0" onChange={(event) => setImage({ src: imageSrc, alt: imageAlt, position: `${event.target.value}% ${imagePosition.split(' ')[1]}` })} type="range" value={Number.parseInt(imagePosition, 10)} />
              <label htmlFor="visual-editor-focal-y">Vertical focal point: {imagePosition.split(' ')[1]}</label>
              <input id="visual-editor-focal-y" max="100" min="0" onChange={(event) => setImage({ src: imageSrc, alt: imageAlt, position: `${imagePosition.split(' ')[0]} ${event.target.value}%` })} type="range" value={Number.parseInt(imagePosition.split(' ')[1], 10)} />
              <label htmlFor="visual-editor-media-search">Choose from media library</label>
              <input id="visual-editor-media-search" onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search uploaded images" value={mediaSearch} />
              <div className="visual-editor__media-grid">
                {filteredMedia.map((asset) => (
                  <button aria-label={`Use ${asset.alt_text || asset.file_name}`} key={asset.id} onClick={() => setImage({ src: asset.public_url, alt: asset.alt_text || imageAlt, position: imagePosition })} type="button">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={asset.public_url} /><span>{asset.file_name}</span>
                  </button>
                ))}
              </div>
              {permissions.canManageMedia && (
                <div>
                  <label htmlFor="visual-editor-upload">Upload a new image (max 5 MB)</label>
                  <input accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml" disabled={uploading} id="visual-editor-upload" onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    if (!imageAlt.trim()) { setMessage('Add descriptive alt text before uploading.'); return }
                    const data = new FormData()
                    data.set('file', file)
                    data.set('altText', imageAlt)
                    data.set('category', 'pages')
                    setUploading(true)
                    try {
                      const result = await uploadMediaAction(data)
                      if (result.success && result.url) setImage({ src: result.url, alt: result.altText || imageAlt, position: imagePosition })
                      else setMessage(result.error || 'Upload failed.')
                    } finally { setUploading(false) }
                  }} type="file" />
                  {uploading && <p role="status">Uploading image…</p>}
                </div>
              )}
            </div>
          )}
          {selection?.kind === 'section' && (
            <div className="visual-editor__controls">
              <h3>{selectedGroup?.sections.find((section) => section.id === selection.id)?.label ?? selection.id.replace(/-/g, ' ')}</h3>
              {selectedGroup && (
                <details className="visual-editor__section-order">
                  <summary>Reorder {selectedGroup.label.toLowerCase()}</summary>
                  <p className="visual-editor__hint">Drag a section or use the arrow buttons.</p>
                  {(draft.visual.sectionOrder[selectedGroup.id] ?? selectedGroup.sections.map((section) => section.id)).map((id, index, ordered) => {
                    const section = selectedGroup.sections.find((item) => item.id === id)
                    if (!section) return null
                    return (
                      <div
                        className="visual-editor__section-row"
                        draggable={mode === 'edit'}
                        key={id}
                        onDragStart={() => setDragging({ group: selectedGroup.id, id })}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          if (dragging?.group === selectedGroup.id) reorder(selectedGroup.id, dragging.id, id)
                          setDragging(null)
                        }}
                      >
                        <span>{section.label}</span>
                        <div>
                          <button aria-label={`Move ${section.label} up`} disabled={index === 0 || mode === 'preview'} onClick={() => reorder(selectedGroup.id, id, ordered[index - 1])} type="button">↑</button>
                          <button aria-label={`Move ${section.label} down`} disabled={index === ordered.length - 1 || mode === 'preview'} onClick={() => reorder(selectedGroup.id, id, ordered[index + 1])} type="button">↓</button>
                        </div>
                      </div>
                    )
                  })}
                </details>
              )}
            </div>
          )}
          {selection && (
            <div className="visual-editor__controls">
              <h3>Appearance</h3>
              <label htmlFor="visual-editor-color">Text color</label>
              <select id="visual-editor-color" onChange={(event) => setStyle('color', event.target.value)} value={style.color || ''}>
                <option value="">Site default</option>
                {DESIGN_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}
              </select>
              <label htmlFor="visual-editor-custom-color">Custom text color</label>
              <input id="visual-editor-custom-color" onChange={(event) => setStyle('color', event.target.value)} type="color" value={style.color?.startsWith('#') ? style.color : '#0d0d0d'} />
              <label htmlFor="visual-editor-background">Background color</label>
              <select id="visual-editor-background" onChange={(event) => setStyle('backgroundColor', event.target.value)} value={style.backgroundColor || ''}>
                <option value="">Site default</option>
                {DESIGN_COLORS.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}
              </select>
              <label htmlFor="visual-editor-align">Alignment</label>
              <select id="visual-editor-align" onChange={(event) => setStyle('textAlign', event.target.value)} value={style.textAlign || ''}>
                <option value="">Site default</option>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
              {selection.kind === 'section' && (
                <>
                  <label htmlFor="visual-editor-space-top">Top spacing</label>
                  <select id="visual-editor-space-top" onChange={(event) => setStyle('paddingTop', event.target.value)} value={style.paddingTop || ''}>
                    <option value="">Site default</option>{SPACING.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <label htmlFor="visual-editor-space-bottom">Bottom spacing</label>
                  <select id="visual-editor-space-bottom" onChange={(event) => setStyle('paddingBottom', event.target.value)} value={style.paddingBottom || ''}>
                    <option value="">Site default</option>{SPACING.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </>
              )}
            </div>
          )}
          <details className="visual-editor__seo">
            <summary>SEO and social settings</summary>
            <label htmlFor="visual-editor-seo-title">SEO title</label>
            <input id="visual-editor-seo-title" maxLength={100} onChange={(event) => updateDraft((current) => ({ ...current, seoTitle: event.target.value }))} value={draft.seoTitle} />
            <label htmlFor="visual-editor-seo-description">SEO description</label>
            <textarea id="visual-editor-seo-description" maxLength={250} onChange={(event) => updateDraft((current) => ({ ...current, seoDescription: event.target.value }))} value={draft.seoDescription} />
            <label htmlFor="visual-editor-og-image">Social image URL</label>
            <input id="visual-editor-og-image" onChange={(event) => updateDraft((current) => ({ ...current, ogImageUrl: event.target.value }))} value={draft.ogImageUrl} />
            <label htmlFor="visual-editor-canonical">Canonical URL</label>
            <input id="visual-editor-canonical" onChange={(event) => updateDraft((current) => ({ ...current, canonicalUrl: event.target.value }))} value={draft.canonicalUrl} />
          </details>
        </aside>
      </div>
    </div>
  )
}
