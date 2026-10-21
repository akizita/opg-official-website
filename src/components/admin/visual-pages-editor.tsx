'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { uploadMediaAction } from '@/app/admin/media/actions'
import {
  deleteVisualRevisionAction,
  saveVisualPageAction,
  type VisualRevision,
  type VisualSaveInput,
} from '@/app/admin/pages/visual-actions'
import {
  applyPageVisualOverrides,
  setAnchorLabel,
} from '@/components/site/page-visual-runtime'
import {
  ABOUT_COPY_SECTIONS,
  CAREERS_COPY_SECTIONS,
  CLIENTS_COPY_SECTIONS,
  HOME_COPY_SECTIONS,
  type CopySection,
} from '@/lib/content/page-copy'
import type { DocumentStatus } from '@/lib/content/page-documents'
import type { MediaAsset } from '@/lib/content/media'
import {
  PAGE_LINK_DIRECTORY,
  type PageVisualConfig,
  type VisualEditorPage,
  VISUAL_EDITOR_PAGES,
} from '@/lib/content/page-visual'

export type VisualPageDraft = Omit<
  VisualSaveInput,
  'page' | 'intent' | 'expectedVersion' | 'versionTitle'
> & {
  status: DocumentStatus
  version: number
  updatedAt: string | null
}

type Selection =
  | { kind: 'text'; key: string; selector: string }
  | { kind: 'image'; selector: string; baseSrc: string; baseAlt: string }
  | { kind: 'button'; selector: string; key?: string }

type ImageDraft = { src: string; alt: string; position: string }
type ButtonDraft = { title: string; href: string }
type SeoDraft = Pick<
  VisualPageDraft,
  'seoTitle' | 'seoDescription' | 'ogImageUrl' | 'canonicalUrl'
>

const SCHEMAS: Record<VisualEditorPage, readonly CopySection[]> = {
  home: HOME_COPY_SECTIONS,
  about: ABOUT_COPY_SECTIONS,
  clients: CLIENTS_COPY_SECTIONS,
  careers: CAREERS_COPY_SECTIONS,
}

function normalized(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function originalImageSource(image: HTMLImageElement): string {
  const src = image.getAttribute('src') || ''
  try {
    const url = new URL(src, image.ownerDocument.location?.href)
    if (url.pathname === '/_next/image')
      return url.searchParams.get('url') || src
  } catch {
    // Keep the original attribute when the image URL cannot be parsed.
  }
  return src
}

function elementSelector(element: Element, root: Element): string {
  const parts: string[] = []
  let current: Element | null = element
  while (current && current !== root) {
    const parent: Element | null = current.parentElement
    if (!parent) break
    const sameTag = Array.from(parent.children).filter(
      (child) => child.tagName === current?.tagName,
    )
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

function decorateCanvas(
  doc: Document,
  page: VisualEditorPage,
  draft: VisualPageDraft,
) {
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

function fieldLabel(page: VisualEditorPage, key: string): string {
  if (key === 'title') return 'Page heading'
  if (key === 'summary') return 'Hero introduction'
  if (key === 'editorialTitle') return 'Featured story heading'
  if (key === 'editorialLead') return 'Featured story introduction'
  if (key.startsWith('body:'))
    return `Who We Are paragraph ${Number(key.split(':')[1]) + 1}`
  if (key.startsWith('line:')) {
    const [, base, index] = key.split(':')
    return `${fieldLabel(page, base)} · line ${Number(index) + 1}`
  }
  return (
    SCHEMAS[page]
      .flatMap((section) => section.fields)
      .find((field) => field.key === key)?.label ?? key
  )
}

function fieldValue(draft: VisualPageDraft, key: string): string {
  if (key.startsWith('body:'))
    return draft.body?.split(/\n\n+/)[Number(key.split(':')[1])] ?? ''
  if (key.startsWith('line:')) {
    const [, base, index] = key.split(':')
    return draft.copy[base]?.split(/\r?\n/)[Number(index)] ?? ''
  }
  if (
    key === 'title' ||
    key === 'summary' ||
    key === 'editorialTitle' ||
    key === 'editorialLead'
  )
    return draft[key] ?? ''
  return draft.copy[key] ?? ''
}

function updateFieldValue(
  draft: VisualPageDraft,
  key: string,
  value: string,
): VisualPageDraft {
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
  if (
    key === 'title' ||
    key === 'summary' ||
    key === 'editorialTitle' ||
    key === 'editorialLead'
  )
    return { ...draft, [key]: value }
  return { ...draft, copy: { ...draft.copy, [key]: value } }
}

function cloneConfig(config: PageVisualConfig): PageVisualConfig {
  return {
    images: { ...config.images },
    links: { ...config.links },
    labels: { ...config.labels },
    styles: { ...config.styles },
    sectionOrder: { ...config.sectionOrder },
  }
}

function setCanvasMode(doc: Document, mode: 'edit' | 'preview') {
  doc.documentElement.dataset.opgEditorMode = mode
}

function setCanvasPage(doc: Document, page: VisualEditorPage) {
  doc.documentElement.dataset.opgEditorPage = page
}

export function VisualPagesEditor({
  initialPage,
  initialPages,
  initialRevisions,
  media,
  permissions,
  revisionsUnavailable,
}: {
  initialPage: VisualEditorPage
  initialPages: Record<VisualEditorPage, VisualPageDraft>
  initialRevisions: Record<VisualEditorPage, VisualRevision[]>
  media: MediaAsset[]
  permissions: {
    canEditDraft: boolean
    canPublish: boolean
    canManageMedia: boolean
  }
  revisionsUnavailable: boolean
}) {
  const [page, setPage] = useState<VisualEditorPage>(initialPage)
  const [drafts, setDrafts] = useState(initialPages)
  const [dirtyPages, setDirtyPages] = useState<Set<VisualEditorPage>>(new Set())
  const [selection, setSelection] = useState<Selection | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('preview')
  const [versionTitles, setVersionTitles] = useState<
    Partial<Record<VisualEditorPage, string>>
  >({})
  const [titleRequired, setTitleRequired] = useState(false)
  const [revisions, setRevisions] = useState(initialRevisions)
  const [deletingRevisionId, setDeletingRevisionId] = useState<string | null>(
    null,
  )
  const [stageWidth, setStageWidth] = useState(900)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [mediaSearch, setMediaSearch] = useState('')
  const [mediaCategory, setMediaCategory] = useState('all')
  const [visibleMediaCount, setVisibleMediaCount] = useState(18)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [modal, setModal] = useState<
    'image' | 'button' | 'text' | 'seo' | null
  >(null)
  const [modalError, setModalError] = useState('')
  const [imageDraft, setImageDraft] = useState<ImageDraft>({
    src: '',
    alt: '',
    position: '50% 50%',
  })
  const [buttonDraft, setButtonDraft] = useState<ButtonDraft>({
    title: '',
    href: '',
  })
  const [textDraft, setTextDraft] = useState('')
  const [seoDraft, setSeoDraft] = useState<SeoDraft>({
    seoTitle: '',
    seoDescription: '',
    ogImageUrl: '',
    canonicalUrl: '',
  })
  const frameRef = useRef<HTMLIFrameElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const libraryDialogRef = useRef<HTMLDialogElement>(null)
  const versionTitleRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<
    Array<{ page: VisualEditorPage; draft: VisualPageDraft }>
  >([])
  const latestRef = useRef({ page, drafts, mode })
  useEffect(() => {
    latestRef.current = { page, drafts, mode }
  }, [page, drafts, mode])
  const draft = drafts[page]
  const dirty = dirtyPages.has(page)
  const versionTitle = versionTitles[page] ?? ''
  const virtualWidth = 1280
  const virtualHeight = 850
  const scale = Math.min(1, stageWidth / virtualWidth)
  const pageUrl = VISUAL_EDITOR_PAGES[page].path
  const frameUrl = `${pageUrl}?opgPreview=1&editorRefresh=${refresh}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (modal && !dialog.open) dialog.showModal()
    if (!modal && dialog.open) dialog.close()
  }, [modal])

  useEffect(() => {
    const dialog = libraryDialogRef.current
    if (!dialog) return
    if (libraryOpen && !dialog.open) dialog.showModal()
    if (!libraryOpen && dialog.open) dialog.close()
  }, [libraryOpen])

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setStageWidth(entry.contentRect.width),
    )
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
    doc
      .querySelectorAll<HTMLElement>('[data-cms-selected]')
      .forEach((element) => {
        delete element.dataset.cmsSelected
        if (element.dataset.opgInlineEdit) {
          delete element.dataset.opgInlineEdit
          element.removeAttribute('contenteditable')
          element.removeAttribute('role')
          element.removeAttribute('aria-label')
        }
      })
    if (mode !== 'edit' || !selection) return
    try {
      const element = selection.selector
        ? doc.querySelector<HTMLElement>(`#main-content ${selection.selector}`)
        : selection.kind === 'text'
          ? Array.from(
              doc.querySelectorAll<HTMLElement>('[data-cms-field]'),
            ).find((item) => item.dataset.cmsField === selection.key)
          : null
      if (element) {
        element.dataset.cmsSelected = 'true'
        if (
          selection.kind === 'text' &&
          element.childElementCount === 0 &&
          !['A', 'BUTTON'].includes(element.tagName)
        ) {
          element.dataset.opgInlineEdit = 'true'
          element.contentEditable = 'true'
          element.setAttribute('role', 'textbox')
          element.setAttribute(
            'aria-label',
            `Edit ${fieldLabel(page, selection.key)}`,
          )
          element.focus()
        }
      }
    } catch {
      // A selected element may disappear when a carousel changes slides.
    }
  }, [mode, selection, page, refresh])

  const updateDraft = useCallback(
    (updater: (current: VisualPageDraft) => VisualPageDraft) => {
      historyRef.current.push({
        page,
        draft: structuredClone(latestRef.current.drafts[page]),
      })
      if (historyRef.current.length > 40) historyRef.current.shift()
      setCanUndo(true)
      setDrafts((current) => ({ ...current, [page]: updater(current[page]) }))
      setDirtyPages((current) => new Set(current).add(page))
    },
    [page],
  )

  const applyFrame = useCallback(
    (next: VisualPageDraft) => {
      const doc = frameRef.current?.contentDocument
      if (doc) applyPageVisualOverrides(page, next.visual, doc)
    },
    [page],
  )

  const syncCanvasText = useCallback(
    (key: string, value: string, source?: HTMLElement) => {
      const doc = frameRef.current?.contentDocument
      if (doc) {
        for (const element of doc.querySelectorAll<HTMLElement>(
          '[data-cms-field]',
        )) {
          if (element.dataset.cmsField !== key || element === source) continue
          if (
            key === 'title' &&
            element.classList.contains('about-hero-banner__title')
          ) {
            const prefix = element.querySelector<HTMLElement>(
              '.about-hero-banner__title-prefix',
            )
            const accent = element.querySelector<HTMLElement>(
              '.about-hero-banner__title-accent',
            )
            if (prefix && accent && value.toLowerCase().startsWith('about ')) {
              prefix.textContent = 'About'
              accent.textContent = value.slice(6)
              continue
            }
          }
          if (element.tagName === 'A')
            setAnchorLabel(element as HTMLAnchorElement, value)
          else element.textContent = value
        }
      }
    },
    [],
  )

  const setText = useCallback(
    (key: string, value: string, source?: HTMLElement) => {
      updateDraft((current) => updateFieldValue(current, key, value))
      syncCanvasText(key, value, source)
    },
    [updateDraft, syncCanvasText],
  )

  const handleFrameLoad = useCallback(() => {
    const iframe = frameRef.current
    const doc = iframe?.contentDocument
    if (!doc || !iframe?.contentWindow) {
      setMessage(
        'The preview could not be inspected. Check that the local site is running.',
      )
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
        html[data-opg-editor-mode="edit"] #main-content a.button-link:hover,
        html[data-opg-editor-mode="edit"] #main-content img:hover {
          outline: 2px dashed #f2b705 !important;
          outline-offset: 4px;
        }
        html[data-opg-editor-mode="edit"] [data-cms-field]:hover { cursor: text; }
        html[data-opg-editor-mode="edit"] #main-content a.button-link:hover { cursor: pointer; }
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
    imageAction.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h-4l-2 3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z"/><circle cx="12" cy="13" r="3"/></svg><span>Change photo</span>'
    doc.body.append(imageAction)
    let hoveredImage: HTMLImageElement | null = null
    const selectImage = (image: HTMLImageElement) => {
      const selected: Selection = {
        kind: 'image',
        selector: elementSelector(image, root),
        baseSrc: originalImageSource(image),
        baseAlt: image.getAttribute('alt') || '',
      }
      const saved =
        latestRef.current.drafts[latestRef.current.page].visual.images[
          selected.selector
        ]
      setSelection(selected)
      setImageDraft({
        src: saved?.src ?? selected.baseSrc,
        alt: saved?.alt ?? selected.baseAlt,
        position: saved?.position ?? '50% 50%',
      })
      setMediaSearch('')
      setModalError('')
      setModal('image')
    }
    const selectButton = (anchor: HTMLAnchorElement, target: Element) => {
      const field =
        target.closest<HTMLElement>('[data-cms-field]') ??
        anchor.querySelector<HTMLElement>('[data-cms-field]')
      const key = field?.dataset.cmsField
      const selector = elementSelector(anchor, root)
      const currentDraft = latestRef.current.drafts[latestRef.current.page]
      setSelection({ kind: 'button', selector, key })
      setButtonDraft({
        title: key
          ? fieldValue(currentDraft, key)
          : (currentDraft.visual.labels[selector] ??
            normalized(anchor.textContent || '')),
        href:
          currentDraft.visual.links[selector] ??
          anchor.getAttribute('href') ??
          '',
      })
      setModalError('')
      setModal('button')
    }
    const isEditableButton = (anchor: HTMLAnchorElement) =>
      anchor.matches('.button-link, [role="button"], [data-cms-field]') ||
      Boolean(anchor.querySelector('[data-cms-field]'))
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
      if (!target || target.nodeType !== 1 || imageAction.contains(target))
        return
      const image = target.closest('img')
      if (image?.tagName === 'IMG' && root.contains(image))
        showImageAction(image)
      else hideImageAction()
    }
    const click = (event: MouseEvent) => {
      if (latestRef.current.mode === 'preview') return
      const target = event.target as Element | null
      if (!target || target.nodeType !== 1) return
      if (target.closest('[data-opg-inline-edit]')) {
        event.stopPropagation()
        return
      }
      event.preventDefault()
      event.stopPropagation()
      const image =
        target.closest('img') ??
        (imageAction.contains(target) ? hoveredImage : null)
      if (image?.tagName === 'IMG') {
        selectImage(image)
        return
      }
      const anchor = target.closest<HTMLAnchorElement>('a')
      if (anchor && root.contains(anchor) && isEditableButton(anchor)) {
        selectButton(anchor, target)
        return
      }
      const text = target.closest<HTMLElement>('[data-cms-field]')
      if (text?.dataset.cmsField) {
        const item = {
          kind: 'text' as const,
          key: text.dataset.cmsField,
          selector: elementSelector(text, root),
        }
        setSelection(item)
        if (
          text.childElementCount > 0 ||
          ['A', 'BUTTON'].includes(text.tagName)
        ) {
          const active = latestRef.current
          setTextDraft(fieldValue(active.drafts[active.page], item.key))
          setModalError('')
          setModal('text')
        }
        return
      }
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
      const target = event.target as HTMLElement | null
      if (latestRef.current.mode !== 'edit' || !target) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (target.tagName === 'IMG') {
        event.preventDefault()
        selectImage(target as HTMLImageElement)
      } else if (
        target.tagName === 'A' &&
        root.contains(target) &&
        isEditableButton(target as HTMLAnchorElement)
      ) {
        event.preventDefault()
        selectButton(target as HTMLAnchorElement, target)
      }
    }
    const makeImagesFocusable = () => {
      root.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
        image.tabIndex = 0
        image.setAttribute('role', 'button')
        image.setAttribute(
          'aria-label',
          `Change photo: ${image.alt || 'untitled image'}`,
        )
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

  const selectPage = (next: VisualEditorPage) => {
    if (next === page) return
    if (
      dirty &&
      !window.confirm(
        'This page has unsaved changes. Switch pages and keep the unsaved draft in this session?',
      )
    )
      return
    setPage(next)
    setMode('preview')
    setCanUndo(historyRef.current.some((entry) => entry.page === next))
    setSelection(null)
    setMessage('')
    setTitleRequired(false)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    window.history.pushState(null, '', url)
  }

  const undo = () => {
    const index = historyRef.current.findLastIndex(
      (entry) => entry.page === page,
    )
    if (index < 0) return
    const [entry] = historyRef.current.splice(index, 1)
    setCanUndo(historyRef.current.some((item) => item.page === page))
    setDrafts((current) => ({ ...current, [entry.page]: entry.draft }))
    setDirtyPages((current) => new Set(current).add(entry.page))
    applyFrame(entry.draft)
    setRefresh((value) => value + 1)
    setMessage('Last edit undone')
  }

  const save = async (intent: VisualSaveInput['intent']) => {
    if (saving) return
    const title = versionTitle.trim()
    if (!title || title.length > 120) {
      setMessage('')
      setTitleRequired(true)
      versionTitleRef.current?.focus()
      return
    }
    setTitleRequired(false)
    setSaving(true)
    setMessage('Saving…')
    const current = latestRef.current.drafts[page]
    try {
      const result = await saveVisualPageAction({
        ...current,
        page,
        intent,
        versionTitle: title,
        expectedVersion: current.version,
      })
      setMessage(result.message)
      if (result.success && result.version && result.status) {
        if (result.revision)
          setRevisions((all) => ({
            ...all,
            [page]: [result.revision!, ...all[page]],
          }))
        setVersionTitles((all) => ({ ...all, [page]: '' }))
        setMode('preview')
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
        historyRef.current = historyRef.current.filter(
          (entry) => entry.page !== page,
        )
        setCanUndo(false)
        setRefresh((value) => value + 1)
      }
    } catch {
      setMessage(
        'The save request failed. Your edits are still in this browser session.',
      )
    } finally {
      setSaving(false)
    }
  }

  const updateVisual = (
    updater: (config: PageVisualConfig) => PageVisualConfig,
  ) => {
    const current = latestRef.current.drafts[page]
    const next = { ...current, visual: updater(cloneConfig(current.visual)) }
    updateDraft(() => next)
    applyFrame(next)
  }

  const mediaCategories = useMemo(
    () =>
      [...new Set(media.map((asset) => asset.category).filter(Boolean))].sort(),
    [media],
  )
  const filteredMedia = useMemo(() => {
    const query = mediaSearch.trim().toLowerCase()
    return media.filter(
      (asset) =>
        (mediaCategory === 'all' || asset.category === mediaCategory) &&
        `${asset.file_name} ${asset.alt_text} ${asset.category}`
          .toLowerCase()
          .includes(query),
    )
  }, [media, mediaCategory, mediaSearch])
  const visibleMedia = filteredMedia.slice(0, visibleMediaCount)
  const closeModal = () => {
    if (uploading) return
    setLibraryOpen(false)
    setModal(null)
    setModalError('')
  }

  const openLibrary = () => {
    setMediaSearch('')
    setMediaCategory('all')
    setVisibleMediaCount(18)
    setLibraryOpen(true)
  }

  const applyImage = () => {
    if (selection?.kind !== 'image') return
    if (
      !/^(https?:\/\/|\/[^/])/.test(imageDraft.src) ||
      !imageDraft.alt.trim()
    ) {
      setModalError('Choose a photo and enter descriptive alternative text.')
      return
    }
    updateVisual((config) => ({
      ...config,
      images: {
        ...config.images,
        [selection.selector]: { ...imageDraft, alt: imageDraft.alt.trim() },
      },
    }))
    closeModal()
  }

  const applyButton = () => {
    if (selection?.kind !== 'button') return
    const title = buttonDraft.title.trim()
    const href = buttonDraft.href.trim()
    if (
      !title ||
      title.length > 200 ||
      !PAGE_LINK_DIRECTORY.some((item) => item.href === href)
    ) {
      setModalError('Enter a button title and choose a directory destination.')
      return
    }
    const current = latestRef.current.drafts[page]
    const next = selection.key
      ? updateFieldValue(current, selection.key, title)
      : { ...current }
    const visual = cloneConfig(next.visual)
    visual.links[selection.selector] = href
    if (selection.key) delete visual.labels[selection.selector]
    else visual.labels[selection.selector] = title
    const updated = { ...next, visual }
    updateDraft(() => updated)
    if (selection.key) syncCanvasText(selection.key, title)
    applyFrame(updated)
    closeModal()
  }

  const applyText = () => {
    if (selection?.kind !== 'text' || !textDraft.trim()) {
      setModalError('Enter text before applying this change.')
      return
    }
    setText(selection.key, textDraft)
    closeModal()
  }

  const openSeo = () => {
    if (mode !== 'edit') {
      setMessage('Choose Edit before changing SEO.')
      return
    }
    setSelection(null)
    setSeoDraft({
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      ogImageUrl: draft.ogImageUrl,
      canonicalUrl: draft.canonicalUrl,
    })
    setModalError('')
    setModal('seo')
  }

  const applySeo = () => {
    updateDraft((current) => ({ ...current, ...seoDraft }))
    closeModal()
  }

  const enterEditMode = () => {
    if (!permissions.canEditDraft) return
    setMessage('')
    setMode('edit')
  }

  const deleteRevision = async (revision: VisualRevision) => {
    if (
      deletingRevisionId ||
      revision.status !== 'draft' ||
      revision.page_version >= draft.version
    )
      return
    if (
      !window.confirm(
        `Delete draft version “${revision.version_title}”? This cannot be undone.`,
      )
    )
      return
    setDeletingRevisionId(revision.id)
    try {
      const result = await deleteVisualRevisionAction(page, revision.id)
      setMessage(result.message)
      if (result.success)
        setRevisions((all) => ({
          ...all,
          [page]: all[page].filter((item) => item.id !== revision.id),
        }))
    } catch {
      setMessage('Could not delete this draft version. Please try again.')
    } finally {
      setDeletingRevisionId(null)
    }
  }

  return (
    <div className="visual-editor">
      <header className="visual-editor__top">
        <div>
          <p className="visual-editor__eyebrow">Website CMS · Visual editor</p>
          <h1>{VISUAL_EDITOR_PAGES[page].label}</h1>
          <p>
            Click text to edit it, a button to change its title and destination,
            or Change photo to replace an image.
          </p>
        </div>
        <span
          className={`visual-editor__save-status ${saving ? 'is-saving' : dirty ? 'is-dirty' : 'is-saved'}`}
          role="status"
        >
          {saving
            ? 'Saving…'
            : dirty
              ? 'Unsaved changes'
              : `Saved · ${draft.status}`}
        </span>
      </header>
      {message && (
        <p className="visual-editor__message" role="status">
          {message}
        </p>
      )}
      <div className="visual-editor__savebar">
        <div className="visual-editor__version-bar">
          <details className="visual-editor__versions">
            <summary>Version history ({revisions[page].length})</summary>
            <div className="visual-editor__version-list">
              {revisionsUnavailable && (
                <p>
                  Version history is unavailable until the database migration is
                  applied.
                </p>
              )}
              {!revisionsUnavailable && revisions[page].length === 0 && (
                <p>
                  No named versions yet. Save a draft to create the first one.
                </p>
              )}
              {revisions[page].map((revision) => (
                <div className="visual-editor__version-item" key={revision.id}>
                  <div>
                    <strong>{revision.version_title}</strong>
                    <span>
                      v{revision.page_version} · {revision.status} ·{' '}
                      {revision.created_by_name}
                    </span>
                    <time dateTime={revision.created_at}>
                      {revision.created_at.slice(0, 16).replace('T', ' ')} UTC
                    </time>
                  </div>
                  {revision.status === 'draft' && (
                    <button
                      aria-label={`Delete draft version ${revision.version_title}`}
                      disabled={
                        deletingRevisionId !== null ||
                        revision.page_version >= draft.version ||
                        !permissions.canEditDraft
                      }
                      onClick={() => deleteRevision(revision)}
                      title={
                        revision.page_version >= draft.version
                          ? 'The current version cannot be deleted'
                          : 'Delete this older draft version'
                      }
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                        width="18"
                      >
                        <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </details>
          <input
            aria-describedby={
              titleRequired ? 'visual-editor-version-title-error' : undefined
            }
            aria-invalid={titleRequired}
            aria-label="Version title (required to save or publish)"
            className={`visual-editor__version-title${titleRequired ? ' is-invalid' : ''}`}
            id="visual-editor-version-title"
            maxLength={120}
            onChange={(event) => {
              setVersionTitles((all) => ({
                ...all,
                [page]: event.target.value,
              }))
              if (event.target.value.trim()) setTitleRequired(false)
            }}
            placeholder={
              titleRequired ? 'Version title required' : 'Version title *'
            }
            ref={versionTitleRef}
            required
            title="Describe this edit for other admins"
            value={versionTitle}
          />
          {titleRequired && (
            <span className="sr-only" id="visual-editor-version-title-error">
              Enter a version title before saving or publishing.
            </span>
          )}
        </div>
        <div className="visual-editor__action-controls">
          <button disabled={!canUndo || saving} onClick={undo} type="button">
            Undo
          </button>
          <button
            disabled={!permissions.canEditDraft || saving}
            onClick={() => save('save_draft')}
            type="button"
          >
            Save draft
          </button>
          {permissions.canPublish && (
            <button
              className="visual-editor__publish"
              disabled={saving}
              onClick={() => save('publish')}
              type="button"
            >
              Publish page
            </button>
          )}
        </div>
      </div>
      <div className="visual-editor__layout">
        <section aria-label="Page canvas" className="visual-editor__canvas">
          <div className="visual-editor__toolbar">
            <div className="visual-editor__toolbar-navigation">
              <div aria-label="Editor mode" role="group">
                <button
                  aria-pressed={mode === 'edit'}
                  onClick={enterEditMode}
                  type="button"
                >
                  Edit
                </button>
                <button
                  aria-pressed={mode === 'preview'}
                  onClick={() => setMode('preview')}
                  type="button"
                >
                  Preview
                </button>
              </div>
              <nav
                aria-label="Marketing pages"
                className="visual-editor__page-tabs"
              >
                {Object.entries(VISUAL_EDITOR_PAGES).map(([id, item]) => (
                  <button
                    aria-current={page === id ? 'page' : undefined}
                    className={page === id ? 'is-active' : ''}
                    disabled={saving}
                    key={id}
                    onClick={() => selectPage(id as VisualEditorPage)}
                    type="button"
                  >
                    {item.label}
                    {dirtyPages.has(id as VisualEditorPage) && (
                      <span
                        aria-label="Unsaved changes"
                        className="visual-editor__dirty-dot"
                      />
                    )}
                  </button>
                ))}
              </nav>
              <button onClick={openSeo} type="button">
                SEO settings
              </button>
            </div>
          </div>
          <div className="visual-editor__stage" ref={stageRef}>
            <div
              className="visual-editor__frame-shell"
              style={{
                width: virtualWidth * scale,
                height: virtualHeight * scale,
              }}
            >
              <iframe
                aria-label={`${VISUAL_EDITOR_PAGES[page].label} ${mode} canvas`}
                key={page}
                onLoad={handleFrameLoad}
                ref={frameRef}
                src={frameUrl}
                style={{
                  width: virtualWidth,
                  height: virtualHeight,
                  transform: `scale(${scale})`,
                }}
                title={`${VISUAL_EDITOR_PAGES[page].label} page preview`}
              />
            </div>
          </div>
          <p className="visual-editor__hint">
            {mode === 'edit'
              ? 'Edit text in place. Click a button or Change photo to open its editor. Links do not navigate in Edit mode.'
              : 'Preview mode keeps buttons, tabs, and carousels interactive.'}
          </p>
        </section>

        <dialog
          aria-labelledby="visual-editor-dialog-title"
          className="visual-editor__dialog"
          onCancel={(event) => {
            if (uploading) event.preventDefault()
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
          onClose={() => {
            setModal(null)
            setModalError('')
          }}
          ref={dialogRef}
        >
          <div className="visual-editor__dialog-content">
            <header className="visual-editor__dialog-header">
              <div>
                <p className="visual-editor__eyebrow">Page editor</p>
                <h2 id="visual-editor-dialog-title">
                  {modal === 'image'
                    ? 'Change photo'
                    : modal === 'button'
                      ? 'Edit button'
                      : modal === 'text'
                        ? selection?.kind === 'text'
                          ? fieldLabel(page, selection.key)
                          : 'Edit text'
                        : 'SEO and social settings'}
                </h2>
              </div>
              <button
                aria-label="Close editor"
                disabled={uploading}
                onClick={closeModal}
                type="button"
              >
                ×
              </button>
            </header>
            {modalError && (
              <p className="visual-editor__dialog-error" role="alert">
                {modalError}
              </p>
            )}
            {modal === 'image' && (
              <div className="visual-editor__dialog-body">
                {imageDraft.src && (
                  // Library previews may use uploaded or external URLs outside Next Image's allowlist.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={imageDraft.alt || 'Selected photo preview'}
                    className="visual-editor__image-preview"
                    src={imageDraft.src}
                  />
                )}
                <label htmlFor="visual-editor-alt">Alternative text</label>
                <input
                  id="visual-editor-alt"
                  maxLength={300}
                  onChange={(event) =>
                    setImageDraft((current) => ({
                      ...current,
                      alt: event.target.value,
                    }))
                  }
                  value={imageDraft.alt}
                />
                <label htmlFor="visual-editor-upload">
                  Upload a new photo (max 5 MB)
                </label>
                <input
                  accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                  disabled={!permissions.canManageMedia || uploading}
                  id="visual-editor-upload"
                  onChange={async (event) => {
                    const input = event.currentTarget
                    const file = input.files?.[0]
                    if (!file) return
                    if (!imageDraft.alt.trim()) {
                      setModalError(
                        'Add descriptive alternative text before uploading.',
                      )
                      input.value = ''
                      return
                    }
                    const data = new FormData()
                    data.set('file', file)
                    data.set('altText', imageDraft.alt.trim())
                    data.set('category', 'pages')
                    setUploading(true)
                    setModalError('')
                    try {
                      const result = await uploadMediaAction(data)
                      if (result.success && result.url) {
                        setImageDraft((current) => ({
                          ...current,
                          src: result.url!,
                          alt: result.altText || current.alt,
                        }))
                      } else {
                        setModalError(result.error || 'Upload failed.')
                      }
                    } catch {
                      setModalError('Upload failed. Please try again.')
                    } finally {
                      setUploading(false)
                      input.value = ''
                    }
                  }}
                  type="file"
                />
                {uploading && <p role="status">Uploading photo…</p>}
                <button
                  className="visual-editor__library-trigger visual-editor__shine-button"
                  disabled={uploading}
                  onClick={openLibrary}
                  type="button"
                >
                  Choose from library
                </button>
                <div className="visual-editor__focal-controls">
                  <label htmlFor="visual-editor-focal-x">
                    Horizontal focal point: {imageDraft.position.split(' ')[0]}
                  </label>
                  <input
                    id="visual-editor-focal-x"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      setImageDraft((current) => ({
                        ...current,
                        position:
                          event.target.value +
                          '% ' +
                          current.position.split(' ')[1],
                      }))
                    }
                    type="range"
                    value={Number.parseInt(imageDraft.position, 10)}
                  />
                  <label htmlFor="visual-editor-focal-y">
                    Vertical focal point: {imageDraft.position.split(' ')[1]}
                  </label>
                  <input
                    id="visual-editor-focal-y"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      setImageDraft((current) => ({
                        ...current,
                        position:
                          current.position.split(' ')[0] +
                          ' ' +
                          event.target.value +
                          '%',
                      }))
                    }
                    type="range"
                    value={Number.parseInt(
                      imageDraft.position.split(' ')[1],
                      10,
                    )}
                  />
                </div>
              </div>
            )}
            {modal === 'button' && (
              <div className="visual-editor__dialog-body">
                <label htmlFor="visual-editor-button-title">Button title</label>
                <input
                  autoFocus
                  id="visual-editor-button-title"
                  maxLength={200}
                  onChange={(event) =>
                    setButtonDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  value={buttonDraft.title}
                />
                <label htmlFor="visual-editor-button-directory">
                  Choose a directory destination
                </label>
                <select
                  id="visual-editor-button-directory"
                  onChange={(event) =>
                    setButtonDraft((current) => ({
                      ...current,
                      href: event.target.value,
                    }))
                  }
                  value={
                    PAGE_LINK_DIRECTORY.some(
                      (item) => item.href === buttonDraft.href,
                    )
                      ? buttonDraft.href
                      : ''
                  }
                >
                  <option disabled value="">
                    Select a page or section
                  </option>
                  {PAGE_LINK_DIRECTORY.map((item) => (
                    <option key={item.href} value={item.href}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {modal === 'text' && (
              <div className="visual-editor__dialog-body">
                <label htmlFor="visual-editor-text">Text</label>
                <textarea
                  autoFocus
                  id="visual-editor-text"
                  onChange={(event) => setTextDraft(event.target.value)}
                  rows={7}
                  value={textDraft}
                />
              </div>
            )}
            {modal === 'seo' && (
              <div className="visual-editor__dialog-body">
                <label htmlFor="visual-editor-seo-title">SEO title</label>
                <input
                  id="visual-editor-seo-title"
                  maxLength={100}
                  onChange={(event) =>
                    setSeoDraft((current) => ({
                      ...current,
                      seoTitle: event.target.value,
                    }))
                  }
                  value={seoDraft.seoTitle}
                />
                <label htmlFor="visual-editor-seo-description">
                  SEO description
                </label>
                <textarea
                  id="visual-editor-seo-description"
                  maxLength={250}
                  onChange={(event) =>
                    setSeoDraft((current) => ({
                      ...current,
                      seoDescription: event.target.value,
                    }))
                  }
                  value={seoDraft.seoDescription}
                />
                <label htmlFor="visual-editor-og-image">Social image URL</label>
                <input
                  id="visual-editor-og-image"
                  onChange={(event) =>
                    setSeoDraft((current) => ({
                      ...current,
                      ogImageUrl: event.target.value,
                    }))
                  }
                  value={seoDraft.ogImageUrl}
                />
                <label htmlFor="visual-editor-canonical">Canonical URL</label>
                <input
                  id="visual-editor-canonical"
                  onChange={(event) =>
                    setSeoDraft((current) => ({
                      ...current,
                      canonicalUrl: event.target.value,
                    }))
                  }
                  value={seoDraft.canonicalUrl}
                />
              </div>
            )}
            <footer className="visual-editor__dialog-actions">
              <button disabled={uploading} onClick={closeModal} type="button">
                Cancel
              </button>
              <button
                className="visual-editor__dialog-primary"
                disabled={!permissions.canEditDraft || uploading}
                onClick={
                  modal === 'image'
                    ? applyImage
                    : modal === 'button'
                      ? applyButton
                      : modal === 'text'
                        ? applyText
                        : applySeo
                }
                type="button"
              >
                {modal === 'image' ? 'Use photo' : 'Apply changes'}
              </button>
            </footer>
          </div>
        </dialog>
        <dialog
          aria-labelledby="visual-editor-library-title"
          className="visual-editor__dialog visual-editor__library-dialog"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLibraryOpen(false)
          }}
          onClose={() => setLibraryOpen(false)}
          ref={libraryDialogRef}
        >
          <div className="visual-editor__dialog-content">
            <header className="visual-editor__dialog-header">
              <div>
                <p className="visual-editor__eyebrow">Media library</p>
                <h2 id="visual-editor-library-title">Choose a photo</h2>
              </div>
              <button
                aria-label="Close media library"
                onClick={() => setLibraryOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="visual-editor__dialog-body">
              <label htmlFor="visual-editor-media-search">Search photos</label>
              <div className="visual-editor__library-search">
                <input
                  id="visual-editor-media-search"
                  onChange={(event) => {
                    setMediaSearch(event.target.value)
                    setVisibleMediaCount(18)
                  }}
                  placeholder="Search by name, description, or category"
                  type="search"
                  value={mediaSearch}
                />
                {mediaSearch && (
                  <button
                    className="visual-editor__shine-button"
                    onClick={() => {
                      setMediaSearch('')
                      setVisibleMediaCount(18)
                    }}
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>
              {mediaCategories.length > 1 && (
                <div
                  aria-label="Photo categories"
                  className="visual-editor__library-categories"
                >
                  {['all', ...mediaCategories].map((category) => (
                    <button
                      aria-pressed={mediaCategory === category}
                      className="visual-editor__shine-button"
                      key={category}
                      onClick={() => {
                        setMediaCategory(category)
                        setVisibleMediaCount(18)
                      }}
                      type="button"
                    >
                      {category === 'all'
                        ? 'All photos'
                        : category.replace(/[-_]/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
              <p className="visual-editor__library-count" role="status">
                {filteredMedia.length === 0
                  ? 'No matching photos'
                  : `Showing ${visibleMedia.length} of ${filteredMedia.length} photos`}
              </p>
              {filteredMedia.length === 0 ? (
                <p className="visual-editor__library-empty">
                  Try another search or category.
                </p>
              ) : (
                <div className="visual-editor__media-grid">
                  {visibleMedia.map((asset) => (
                    <button
                      aria-label={
                        'Choose ' + (asset.alt_text || asset.file_name)
                      }
                      aria-pressed={imageDraft.src === asset.public_url}
                      key={asset.id}
                      onClick={() => {
                        setImageDraft((current) => ({
                          ...current,
                          src: asset.public_url,
                          alt: asset.alt_text || current.alt,
                        }))
                        setModalError('')
                        setLibraryOpen(false)
                      }}
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" loading="lazy" src={asset.public_url} />
                      <span title={asset.file_name}>{asset.file_name}</span>
                    </button>
                  ))}
                </div>
              )}
              {visibleMediaCount < filteredMedia.length && (
                <button
                  className="visual-editor__library-more visual-editor__shine-button"
                  onClick={() => setVisibleMediaCount((count) => count + 18)}
                  type="button"
                >
                  Show more photos
                </button>
              )}
            </div>
            <footer className="visual-editor__dialog-actions">
              <button onClick={() => setLibraryOpen(false)} type="button">
                Back to photo editor
              </button>
            </footer>
          </div>
        </dialog>
      </div>
    </div>
  )
}
