'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  type BlogStudioActionState,
  resetClientsBlogAction,
  saveClientsBlogAction,
  uploadClientsBlogImageAction,
} from '@/app/admin/blog/actions'
import type {
  StudioArticleOption,
  StudioAuthorOption,
} from '@/app/admin/blog/page'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconBlog,
  OpgIconClose,
  OpgIconPlus,
  OpgIconTrash,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import { ArticlesRealtimeSync } from '@/components/ui/articles-realtime-sync'
import {
  ClientsBlogRealtimeSync,
  notifyClientsBlogChanged,
} from '@/components/ui/clients-blog-realtime-sync'
import { TeamRealtimeSync } from '@/components/ui/team-realtime-sync'
import { canEditDraft } from '@/lib/auth/permissions'
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from '@/lib/content/article-editor-conversion'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import {
  type ClientsBlogBlock,
  type ClientsBlogConfig,
  computeAuthorMonogram,
  estimateClientsBlogReadTime,
} from '@/lib/content/clients-blog-types'

import styles from './blog-studio.module.css'

type ImageModalTarget =
  | { kind: 'hero' }
  | { kind: 'author' }
  | { kind: 'insert_block' }
  | { kind: 'replace_block'; blockId: string }

const initialActionState: BlogStudioActionState = {
  status: 'idle',
}

function formatShortDate(value: string | null): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

function generateBlockId(prefix: 'text' | 'photo'): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `blog-${prefix}-${crypto.randomUUID().slice(0, 8)}`
  }
  return `blog-${prefix}-${Date.now()}`
}

function resolvePreviewImage(rawUrl: string): {
  src: string
  unoptimized: boolean
} {
  const safe = resolveSafeArticleImage(rawUrl)
  const isSvg = /\.svg(\?|#|$)/i.test(safe.src)
  return {
    src: safe.src,
    unoptimized: safe.unoptimized || isSvg,
  }
}

/* =========================================================================
   Image Picker Modal (Instant Supabase Upload or Direct URL)
   ========================================================================= */

function StudioImageModal({
  currentUrl,
  isOpen,
  subtitle,
  title,
  onApply,
  onClose,
}: {
  currentUrl: string
  isOpen: boolean
  subtitle: string
  title: string
  onApply: (url: string) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'upload' | 'url'>(
    currentUrl ? 'url' : 'upload',
  )
  const [urlInput, setUrlInput] = useState(currentUrl)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await uploadClientsBlogImageAction(fd)
      if (!res.success || !res.url) {
        setUploadError(res.error || 'Could not upload image.')
      } else {
        setUploadedUrl(res.url)
      }
    } catch {
      setUploadError('Image upload failed. Check file size and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const effectiveUrl = mode === 'upload' ? uploadedUrl : urlInput.trim()

  return (
    <div
      aria-labelledby="blog-image-modal-title"
      aria-modal="true"
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle} id="blog-image-modal-title">
              {title}
            </h2>
            <p className={styles.modalSubtitle}>{subtitle}</p>
          </div>
          <button
            aria-label="Close modal"
            className={styles.modalCloseBtn}
            onClick={onClose}
            type="button"
          >
            <OpgIconClose size={14} />
          </button>
        </div>

        <div className={styles.modalTabs}>
          <button
            className={`${styles.modalTab} ${mode === 'upload' ? styles.modalTabActive : ''}`}
            onClick={() => setMode('upload')}
            type="button"
          >
            Upload File
          </button>
          <button
            className={`${styles.modalTab} ${mode === 'url' ? styles.modalTabActive : ''}`}
            onClick={() => setMode('url')}
            type="button"
          >
            Paste Image URL
          </button>
        </div>

        {mode === 'upload' ? (
          <div>
            <input
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
              className={styles.sidebarInput}
              id="blog-studio-file-upload"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              type="file"
            />
            <label
              className={styles.uploadDropzone}
              htmlFor="blog-studio-file-upload"
            >
              <OpgIconUpload size={22} />
              <strong>
                {isUploading
                  ? 'Uploading to media storage…'
                  : uploadedUrl
                    ? 'Replace uploaded image'
                    : 'Choose a photo from your computer'}
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#57534e' }}>
                PNG, JPG, WEBP, AVIF, GIF, or SVG (max 5 MB)
              </span>
            </label>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label
              htmlFor="blog-image-url-input"
              style={{ fontSize: '0.79rem', fontWeight: 700, color: '#1c1917' }}
            >
              Direct Image URL or Asset Path
            </label>
            <input
              autoFocus
              className={styles.sidebarInput}
              id="blog-image-url-input"
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://... or /images/clients-blog-hero.jpg"
              style={{ padding: '0.6rem 0.8rem', fontSize: '0.86rem' }}
              type="text"
              value={urlInput}
            />
          </div>
        )}

        {uploadError && (
          <div
            className={`${styles.toast} ${styles.toastError}`}
            role="alert"
            style={{ padding: '0.6rem 0.85rem', fontSize: '0.8rem' }}
          >
            <span>{uploadError}</span>
          </div>
        )}

        {effectiveUrl && (
          <div className={styles.modalPreviewBox}>
            {(() => {
              const img = resolvePreviewImage(effectiveUrl)
              return (
                <Image
                  alt="Selected photo preview"
                  fill
                  sizes="520px"
                  src={img.src}
                  style={{ objectFit: 'cover' }}
                  unoptimized={img.unoptimized}
                />
              )
            })()}
          </div>
        )}

        <div className={styles.modalFooter}>
          <button
            className={styles.secondaryBtn}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.publishBtn}
            disabled={!effectiveUrl || isUploading}
            onClick={() => {
              if (effectiveUrl) {
                onApply(effectiveUrl)
                onClose()
              }
            }}
            type="button"
          >
            Apply Photo
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Rich Text Canvas Block (Uncontrolled contentEditable — Zero Cursor Jump)
   ========================================================================= */

function RichTextBlockCanvas({
  canEdit,
  initialMarkdown,
  isActive,
  onChangeMarkdown,
  onContextMenu,
  onFocusBlock,
  onKeyDownShortcut,
  registerElement,
}: {
  canEdit: boolean
  initialMarkdown: string
  isActive: boolean
  onChangeMarkdown: (markdown: string) => void
  onContextMenu: (e: React.MouseEvent) => void
  onFocusBlock: () => void
  onKeyDownShortcut: (e: React.KeyboardEvent<HTMLDivElement>) => void
  registerElement: (el: HTMLDivElement | null) => void
}) {
  const localRef = useRef<HTMLDivElement | null>(null)
  const initialMarkdownRef = useRef(initialMarkdown)

  useEffect(() => {
    if (localRef.current) {
      localRef.current.innerHTML = markdownToEditorHtml(
        initialMarkdownRef.current,
      )
    }
  }, [])

  return (
    <div
      aria-label="Editable blog text section"
      aria-multiline="true"
      className={styles.richEditor}
      contentEditable={canEdit}
      data-active-editor={isActive ? 'true' : undefined}
      onBlur={() => {
        if (localRef.current) {
          onChangeMarkdown(editorHtmlToMarkdown(localRef.current.innerHTML))
        }
      }}
      onContextMenu={canEdit ? onContextMenu : undefined}
      onFocus={onFocusBlock}
      onInput={() => {
        if (localRef.current) {
          onChangeMarkdown(editorHtmlToMarkdown(localRef.current.innerHTML))
        }
      }}
      onKeyDown={canEdit ? onKeyDownShortcut : undefined}
      onPaste={(e) => {
        if (!canEdit) return
        const plainText = e.clipboardData?.getData('text/plain')
        if (!plainText) return
        e.preventDefault()
        document.execCommand(
          'insertHTML',
          false,
          markdownToEditorHtml(plainText),
        )
        if (localRef.current) {
          onChangeMarkdown(editorHtmlToMarkdown(localRef.current.innerHTML))
        }
      }}
      ref={(node) => {
        localRef.current = node
        registerElement(node)
      }}
      role="textbox"
      suppressContentEditableWarning
    />
  )
}

/* =========================================================================
   Main Canva-Style Visual Blog Studio
   ========================================================================= */

export function BlogStudio({
  articleOptions,
  authorOptions,
  initialConfig,
  roleKey,
}: {
  articleOptions: StudioArticleOption[]
  authorOptions: StudioAuthorOption[]
  initialConfig: ClientsBlogConfig
  roleKey: string
}) {
  const router = useRouter()
  const canEdit = canEditDraft(roleKey)
  const formRef = useRef<HTMLFormElement>(null)

  const [config, setConfig] = useState<ClientsBlogConfig>(initialConfig)
  const [savedBaseline, setSavedBaseline] =
    useState<ClientsBlogConfig>(initialConfig)
  const [resetVersion, setResetVersion] = useState(0)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(
    initialConfig.blocks.find((b) => b.type === 'rich_text')?.id ||
      initialConfig.blocks[0]?.id ||
      null,
  )
  const [imageModal, setImageModal] = useState<ImageModalTarget | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [banner, setBanner] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const editorRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const savedRangeRef = useRef<Range | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    blockId: string
    x: number
    y: number
  } | null>(null)

  const [, formAction, isPublishing] = useActionState(
    async (prevState: BlogStudioActionState, formData: FormData) => {
      const res = await saveClientsBlogAction(prevState, formData)
      if (res.status === 'success' && res.savedConfig) {
        setSavedBaseline(res.savedConfig)
        setConfig(res.savedConfig)
        setBanner({
          type: 'success',
          text: res.message || 'Blog changes published live to /clients.',
        })
        notifyClientsBlogChanged()
        router.refresh()
      } else if (res.status === 'error') {
        setBanner({
          type: 'error',
          text: res.message || 'Failed to publish blog changes.',
        })
      }
      return res
    },
    initialActionState,
  )

  useEffect(() => {
    if (!contextMenu) return
    const closeMenu = () => setContextMenu(null)
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', closeMenu)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('keydown', onEsc)
    }
  }, [contextMenu])

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedBaseline),
    [config, savedBaseline],
  )

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  const applyFormatToBlock = useCallback(
    (
      targetBlockId: string | null,
      command: string,
      value: string | undefined = undefined,
    ) => {
      if (!canEdit) return
      const resolvedId =
        targetBlockId ||
        config.blocks.find((b) => b.type === 'rich_text')?.id ||
        null
      if (!resolvedId) return

      const editorEl = editorRefs.current.get(resolvedId)
      if (!editorEl) return

      editorEl.focus()
      if (
        savedRangeRef.current &&
        editorEl.contains(savedRangeRef.current.commonAncestorContainer)
      ) {
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(savedRangeRef.current)
        }
      }

      try {
        document.execCommand('defaultParagraphSeparator', false, 'p')
      } catch {
        // Ignore unsupported command error
      }
      document.execCommand(command, false, value)

      const updatedMd = editorHtmlToMarkdown(editorEl.innerHTML)
      setConfig((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === resolvedId && b.type === 'rich_text'
            ? { ...b, markdown: updatedMd }
            : b,
        ),
      }))
      setContextMenu(null)
    },
    [canEdit, config.blocks],
  )

  const handleDiscard = () => {
    setConfig(savedBaseline)
    setResetVersion((v) => v + 1)
    setBanner(null)
  }

  const handleAddTextBlock = () => {
    const newId = generateBlockId('text')
    const newBlock: ClientsBlogBlock = {
      id: newId,
      type: 'rich_text',
      markdown:
        '### New Editorial Section\n\nWrite your updated commentary, client outcomes, or numbered list items directly on the canvas.',
    }
    setConfig((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }))
    setActiveBlockId(newId)
  }

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    setConfig((prev) => {
      if (nextIndex < 0 || nextIndex >= prev.blocks.length) return prev
      const nextBlocks = [...prev.blocks]
      const [moved] = nextBlocks.splice(index, 1)
      nextBlocks.splice(nextIndex, 0, moved)
      return { ...prev, blocks: nextBlocks }
    })
    setResetVersion((v) => v + 1)
  }

  const handleRemoveBlock = (blockId: string) => {
    setConfig((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }))
  }

  const handleTeamAuthorChange = (authorId: string) => {
    const match = authorOptions.find((a) => a.id === authorId)
    if (!match) return
    setConfig((prev) => ({
      ...prev,
      authorMode: 'team',
      authorId: match.id,
      authorName: match.name,
      authorRole: match.role,
      authorAvatarUrl: match.avatarUrl,
      authorMonogram: computeAuthorMonogram(match.name),
    }))
  }

  const resolvedFeaturedArticle = useMemo(() => {
    if (articleOptions.length === 0) return null
    if (config.featuredArticleMode === 'custom' && config.featuredArticleSlug) {
      return (
        articleOptions.find((a) => a.slug === config.featuredArticleSlug) ||
        articleOptions[0]
      )
    }
    return (
      articleOptions.find((a) => a.isFeaturedSitewide) || articleOptions[0]
    )
  }, [
    articleOptions,
    config.featuredArticleMode,
    config.featuredArticleSlug,
  ])

  const imageModalDefaults = useMemo(() => {
    if (!imageModal) return null
    if (imageModal.kind === 'hero') {
      return {
        title: 'Hero Showcase Photo',
        subtitle:
          'Upload a widescreen banner image or paste an image URL for the top of the Clients Blog.',
        currentUrl: config.heroImageUrl || '',
      }
    }
    if (imageModal.kind === 'author') {
      return {
        title: 'Written By Author Portrait',
        subtitle:
          'Upload a portrait photo or paste an image URL for the sidebar author badge.',
        currentUrl: config.authorAvatarUrl || '',
      }
    }
    if (imageModal.kind === 'replace_block') {
      const target = config.blocks.find(
        (b): b is Extract<ClientsBlogBlock, { type: 'image' }> =>
          b.id === imageModal.blockId && b.type === 'image',
      )
      return {
        title: 'Replace Blog Photo',
        subtitle: 'Swap this inline image with an uploaded file or URL.',
        currentUrl: target?.url || '',
      }
    }
    return {
      title: 'Insert New Photo Block',
      subtitle: 'Add a new visual photo banner directly into the blog body.',
      currentUrl: '',
    }
  }, [imageModal, config.heroImageUrl, config.authorAvatarUrl, config.blocks])

  const handleApplyImageModal = (url: string) => {
    if (!imageModal) return
    if (imageModal.kind === 'hero') {
      setConfig((prev) => ({
        ...prev,
        heroImageUrl: url,
      }))
    } else if (imageModal.kind === 'author') {
      setConfig((prev) => ({
        ...prev,
        authorAvatarUrl: url,
      }))
    } else if (imageModal.kind === 'replace_block') {
      setConfig((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === imageModal.blockId && b.type === 'image'
            ? { ...b, url }
            : b,
        ),
      }))
    } else if (imageModal.kind === 'insert_block') {
      const newId = generateBlockId('photo')
      const newPhoto: ClientsBlogBlock = {
        id: newId,
        type: 'image',
        url,
        alt: 'OPG Global Team & Client Collaboration',
        caption: '',
      }
      setConfig((prev) => ({
        ...prev,
        blocks: [...prev.blocks, newPhoto],
      }))
      setActiveBlockId(newId)
    }
  }

  return (
    <div className={styles.workspace}>
      <ClientsBlogRealtimeSync />
      <TeamRealtimeSync />
      <ArticlesRealtimeSync />

      {/* Top Sticky Studio Header */}
      <form
        action={formAction}
        className={styles.studioTopBar}
        ref={formRef}
      >
        <input name="payload" type="hidden" value={JSON.stringify(config)} />

        <div className={styles.studioTitleGroup}>
          <h1 className={styles.studioTitle}>Clients Blog Studio</h1>
          <span
            className={`${styles.statusBadge} ${
              isDirty ? styles.statusBadgeDirty : styles.statusBadgeLive
            }`}
          >
            ● {isDirty ? 'Unsaved Edits' : 'Synced Live on /clients'}
          </span>
        </div>

        <div className={styles.studioActions}>
          {canEdit && (
            <>
              <button
                className={styles.secondaryBtn}
                disabled={isPublishing}
                onClick={() => setIsResetDialogOpen(true)}
                type="button"
              >
                Reset Default
              </button>
              {isDirty && (
                <button
                  className={styles.secondaryBtn}
                  disabled={isPublishing}
                  onClick={handleDiscard}
                  type="button"
                >
                  Discard
                </button>
              )}
            </>
          )}

          <Link
            className={styles.secondaryBtn}
            href="/clients#clients-blog-heading"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>View Live ↗</span>
          </Link>

          {canEdit && (
            <button
              className={styles.publishBtn}
              disabled={isPublishing}
              type="submit"
            >
              {isPublishing ? 'Publishing…' : 'Publish Changes'}
            </button>
          )}
        </div>
      </form>

      {banner && (
        <div
          className={`${styles.toast} ${
            banner.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
          role="status"
        >
          <span>{banner.text}</span>
          <button
            aria-label="Dismiss status message"
            className={styles.modalCloseBtn}
            onClick={() => setBanner(null)}
            type="button"
          >
            <OpgIconClose size={13} />
          </button>
        </div>
      )}

      {/* Canva-Style Split Workspace: Tool Dock Left + Live Canvas Right */}
      <div className={styles.studioLayout}>
        {/* Left Canva Tool Dock */}
        <aside aria-label="Blog studio elements dock" className={styles.canvaDock}>
          {canEdit && (
            <div className={styles.dockSection}>
              <span className={styles.dockHeading}>Add Canvas Block</span>
              <div className={styles.dockActionGrid}>
                <button
                  className={styles.dockInsertBtn}
                  onClick={handleAddTextBlock}
                  type="button"
                >
                  <OpgIconPlus size={16} />
                  <span>Text Block</span>
                </button>
                <button
                  className={styles.dockInsertBtn}
                  onClick={() => setImageModal({ kind: 'insert_block' })}
                  type="button"
                >
                  <OpgIconUpload size={16} />
                  <span>Photo Block</span>
                </button>
              </div>
            </div>
          )}

          <div className={styles.dockSection}>
            <span className={styles.dockHeading}>Visible Sections</span>

            <div className={styles.dockToggleRow}>
              <span>Hero Photo Banner</span>
              <button
                aria-checked={Boolean(config.heroImageUrl)}
                aria-label="Toggle Hero Photo Banner"
                className={`${styles.miniSwitch} ${
                  config.heroImageUrl ? styles.miniSwitchOn : ''
                }`}
                disabled={!canEdit}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    heroImageUrl: prev.heroImageUrl
                      ? null
                      : '/images/clients-blog-hero.jpg',
                  }))
                }
                role="switch"
                type="button"
              >
                <span className={styles.miniSwitchThumb} />
              </button>
            </div>

            <div className={styles.dockToggleRow}>
              <span>Share Buttons</span>
              <button
                aria-checked={config.showShareButtons}
                aria-label="Toggle Share Buttons"
                className={`${styles.miniSwitch} ${
                  config.showShareButtons ? styles.miniSwitchOn : ''
                }`}
                disabled={!canEdit}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    showShareButtons: !prev.showShareButtons,
                  }))
                }
                role="switch"
                type="button"
              >
                <span className={styles.miniSwitchThumb} />
              </button>
            </div>

            <div className={styles.dockToggleRow}>
              <span>Featured Article</span>
              <button
                aria-checked={config.showFeaturedArticle}
                aria-label="Toggle Featured Article Sidebar Card"
                className={`${styles.miniSwitch} ${
                  config.showFeaturedArticle ? styles.miniSwitchOn : ''
                }`}
                disabled={!canEdit}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    showFeaturedArticle: !prev.showFeaturedArticle,
                  }))
                }
                role="switch"
                type="button"
              >
                <span className={styles.miniSwitchThumb} />
              </button>
            </div>
          </div>

          <div className={styles.dockSection}>
            <span className={styles.dockHeading}>
              Canvas Layers ({config.blocks.length})
            </span>
            <div className={styles.layerList}>
              {config.blocks.map((block, idx) => (
                <button
                  className={`${styles.layerItem} ${
                    activeBlockId === block.id ? styles.layerItemActive : ''
                  }`}
                  key={block.id}
                  onClick={() => {
                    setActiveBlockId(block.id)
                    document
                      .getElementById(`canvas-block-${block.id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  type="button"
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {idx + 1}.{' '}
                    {block.type === 'image'
                      ? block.alt || 'Inline Photo'
                      : block.markdown
                          .replace(/^#+\s+/gm, '')
                          .trim()
                          .slice(0, 24) || 'Text Section'}
                  </span>
                  <span className={styles.layerTag}>
                    {block.type === 'image' ? 'Photo' : 'Text'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Interactive /clients Blog Canvas */}
        <div className={styles.canvasStage}>
          {/* 1. Editorial Header Canvas */}
          <header className={styles.headerEditor}>
            <div className={styles.metaInlineRow}>
              <input
                aria-label="Published label"
                className={styles.metaInput}
                disabled={!canEdit}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    publishedLabel: e.target.value,
                  }))
                }
                placeholder="Published Autumn 2026"
                type="text"
                value={config.publishedLabel}
              />
              <span aria-hidden="true" style={{ color: '#a8a29e' }}>
                —
              </span>
              <input
                aria-label="Reading time label"
                className={styles.metaInput}
                disabled={!canEdit}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    readTimeLabel: e.target.value,
                  }))
                }
                placeholder="4 min read"
                style={{ minWidth: '7.5rem' }}
                type="text"
                value={config.readTimeLabel}
              />
              {canEdit && (
                <button
                  className={styles.autoCalcBtn}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      readTimeLabel: estimateClientsBlogReadTime(
                        prev.blocks,
                        prev.lead,
                      ),
                    }))
                  }
                  title="Auto-calculate reading time from canvas words"
                  type="button"
                >
                  Auto Read Time
                </button>
              )}
            </div>

            <textarea
              aria-label="Clients blog title"
              className={styles.inlineTitleInput}
              disabled={!canEdit}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter editorial headline…"
              rows={2}
              value={config.title}
            />

            <textarea
              aria-label="Clients blog lead summary"
              className={styles.inlineLeadTextarea}
              disabled={!canEdit}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, lead: e.target.value }))
              }
              placeholder="Write a concise opening summary…"
              rows={3}
              value={config.lead}
            />
          </header>

          {/* 2. Hero Banner Photo (Editable & Removable) */}
          {config.heroImageUrl ? (
            <div className={styles.heroPhotoStage}>
              {(() => {
                const heroImg = resolvePreviewImage(config.heroImageUrl)
                return (
                  <Image
                    alt={config.heroImageAlt || 'Clients blog banner'}
                    className={styles.heroPhotoImg}
                    fill
                    sizes="(max-width: 64rem) 100vw, 980px"
                    src={heroImg.src}
                    unoptimized={heroImg.unoptimized}
                  />
                )
              })()}

              {canEdit && (
                <>
                  <div className={styles.photoOverlayBar}>
                    <button
                      className={styles.overlayPillBtn}
                      onClick={() => setImageModal({ kind: 'hero' })}
                      type="button"
                    >
                      <OpgIconUpload size={13} />
                      <span>Change Photo</span>
                    </button>
                    <button
                      className={`${styles.overlayPillBtn} ${styles.overlayPillDanger}`}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, heroImageUrl: null }))
                      }
                      type="button"
                    >
                      <OpgIconTrash size={13} />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className={styles.altInlineBar}>
                    <span className={styles.altInlineLabel}>Alt Text</span>
                    <input
                      aria-label="Hero image alt text"
                      className={styles.altInlineInput}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          heroImageAlt: e.target.value,
                        }))
                      }
                      placeholder="Describe this banner image for accessibility…"
                      type="text"
                      value={config.heroImageAlt}
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.removedHeroPlaceholder}>
              <span>
                Hero banner photo is hidden/removed for the public /clients blog.
              </span>
              {canEdit && (
                <button
                  className={styles.insertPillBtn}
                  onClick={() => setImageModal({ kind: 'hero' })}
                  type="button"
                >
                  <OpgIconUpload size={14} />
                  <span>Add Hero Photo</span>
                </button>
              )}
            </div>
          )}

          {/* 3. 2-Column Editorial Layout (Left Metadata Sidebar + Right Canva Blog Body) */}
          <div className={styles.blogGrid}>
            {/* Left Sidebar Controls */}
            <aside
              aria-label="Left sidebar blog controls"
              className={styles.sidebarCanvas}
            >
              {/* WRITTEN BY */}
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarHeaderRow}>
                  <span className={styles.sidebarLabel}>Written By</span>
                  {canEdit && (
                    <div className={styles.segmentedMini}>
                      <button
                        className={`${styles.segmentedMiniBtn} ${
                          config.authorMode === 'custom'
                            ? styles.segmentedMiniBtnActive
                            : ''
                        }`}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            authorMode: 'custom',
                            authorId: null,
                          }))
                        }
                        type="button"
                      >
                        Custom
                      </button>
                      <button
                        className={`${styles.segmentedMiniBtn} ${
                          config.authorMode === 'team'
                            ? styles.segmentedMiniBtnActive
                            : ''
                        }`}
                        onClick={() => {
                          const firstAuthor = authorOptions[0]
                          if (firstAuthor) {
                            handleTeamAuthorChange(firstAuthor.id)
                          } else {
                            setConfig((prev) => ({
                              ...prev,
                              authorMode: 'team',
                            }))
                          }
                        }}
                        type="button"
                      >
                        Team Member
                      </button>
                    </div>
                  )}
                </div>

                {canEdit && config.authorMode === 'team' && (
                  <select
                    aria-label="Select team member author"
                    className={styles.sidebarSelect}
                    onChange={(e) => handleTeamAuthorChange(e.target.value)}
                    value={config.authorId || ''}
                  >
                    {authorOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                )}

                <div className={styles.authorCardPreview}>
                  <button
                    aria-label="Change author avatar"
                    className={styles.authorAvatarBtn}
                    disabled={!canEdit}
                    onClick={() => setImageModal({ kind: 'author' })}
                    title="Click to upload or paste author photo"
                    type="button"
                  >
                    {config.authorAvatarUrl ? (
                      (() => {
                        const avatarImg = resolvePreviewImage(
                          config.authorAvatarUrl,
                        )
                        return (
                          <Image
                            alt={config.authorName}
                            className={styles.authorAvatarImg}
                            fill
                            sizes="48px"
                            src={avatarImg.src}
                            unoptimized={avatarImg.unoptimized}
                          />
                        )
                      })()
                    ) : (
                      <span>
                        {config.authorMonogram ||
                          computeAuthorMonogram(config.authorName)}
                      </span>
                    )}
                  </button>

                  <div className={styles.authorFields}>
                    <input
                      aria-label="Author name"
                      className={styles.sidebarInput}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          authorName: e.target.value,
                          authorMonogram: computeAuthorMonogram(e.target.value),
                        }))
                      }
                      placeholder="Author or Editorial Name"
                      type="text"
                      value={config.authorName}
                    />
                    <input
                      aria-label="Author role"
                      className={styles.sidebarInput}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          authorRole: e.target.value,
                        }))
                      }
                      placeholder="Role / Team subtitle"
                      type="text"
                      value={config.authorRole}
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className={styles.avatarActionRow}>
                    <button
                      className={styles.tinyLinkBtn}
                      onClick={() => setImageModal({ kind: 'author' })}
                      type="button"
                    >
                      {config.authorAvatarUrl ? 'Change Photo' : 'Add Photo'}
                    </button>
                    {config.authorAvatarUrl && (
                      <button
                        className={`${styles.tinyLinkBtn} ${styles.tinyDangerBtn}`}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            authorAvatarUrl: null,
                          }))
                        }
                        type="button"
                      >
                        Remove Photo
                      </button>
                    )}
                    {!config.authorAvatarUrl && (
                      <input
                        aria-label="Author monogram initials"
                        className={styles.sidebarInput}
                        maxLength={4}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            authorMonogram: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="OPG"
                        style={{ width: '4.25rem', padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                        type="text"
                        value={config.authorMonogram}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* SHARE THIS */}
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarHeaderRow}>
                  <span className={styles.sidebarLabel}>Share This</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: config.showShareButtons ? '#166534' : '#78716c' }}>
                    {config.showShareButtons ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <span style={{ fontSize: '0.76rem', color: '#57534e' }}>
                  {config.showShareButtons
                    ? 'LinkedIn share & copy link buttons active.'
                    : 'Share buttons hidden from left sidebar.'}
                </span>
              </div>

              {/* FEATURED ARTICLE CARD */}
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarHeaderRow}>
                  <span className={styles.sidebarLabel}>Featured Article</span>
                  {canEdit && (
                    <div className={styles.segmentedMini}>
                      <button
                        className={`${styles.segmentedMiniBtn} ${
                          config.featuredArticleMode === 'auto'
                            ? styles.segmentedMiniBtnActive
                            : ''
                        }`}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            featuredArticleMode: 'auto',
                          }))
                        }
                        type="button"
                      >
                        Auto
                      </button>
                      <button
                        className={`${styles.segmentedMiniBtn} ${
                          config.featuredArticleMode === 'custom'
                            ? styles.segmentedMiniBtnActive
                            : ''
                        }`}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            featuredArticleMode: 'custom',
                            featuredArticleSlug:
                              prev.featuredArticleSlug ||
                              articleOptions[0]?.slug ||
                              null,
                          }))
                        }
                        type="button"
                      >
                        Choose
                      </button>
                    </div>
                  )}
                </div>

                {canEdit &&
                  config.showFeaturedArticle &&
                  config.featuredArticleMode === 'custom' && (
                    <select
                      aria-label="Choose featured sidebar article"
                      className={styles.sidebarSelect}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          featuredArticleSlug: e.target.value || null,
                        }))
                      }
                      value={config.featuredArticleSlug || ''}
                    >
                      {articleOptions.map((art) => (
                        <option key={art.slug} value={art.slug}>
                          {art.title}
                        </option>
                      ))}
                    </select>
                  )}

                {config.showFeaturedArticle && resolvedFeaturedArticle ? (
                  <div className={styles.featuredPreviewCard}>
                    <div className={styles.featuredPreviewMedia}>
                      {(() => {
                        const coverImg = resolvePreviewImage(
                          resolvedFeaturedArticle.coverImageUrl ||
                            '/images/clients-blog-secondary.jpg',
                        )
                        return (
                          <Image
                            alt={resolvedFeaturedArticle.title}
                            className={styles.featuredPreviewImg}
                            fill
                            sizes="320px"
                            src={coverImg.src}
                            unoptimized={coverImg.unoptimized}
                          />
                        )
                      })()}
                      <span className={styles.featuredPreviewTag}>
                        {config.featuredArticleBadgeLabel || 'Featured Article'}
                      </span>
                    </div>
                    <div className={styles.featuredPreviewBody}>
                      <span className={styles.featuredPreviewMeta}>
                        {formatShortDate(resolvedFeaturedArticle.publishedAt)} •{' '}
                        {resolvedFeaturedArticle.readingTimeMinutes} min read
                      </span>
                      <h3 className={styles.featuredPreviewTitle}>
                        {resolvedFeaturedArticle.title}
                      </h3>
                      <div className={styles.avatarActionRow}>
                        <Link
                          className={styles.tinyLinkBtn}
                          href={`/admin/articles/${resolvedFeaturedArticle.id}/edit`}
                        >
                          Edit Article ↗
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#78716c' }}>
                    {config.showFeaturedArticle
                      ? 'No published articles available yet.'
                      : 'Featured Article card hidden on /clients.'}
                  </span>
                )}

                {canEdit && config.showFeaturedArticle && (
                  <input
                    aria-label="Featured card badge label"
                    className={styles.sidebarInput}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        featuredArticleBadgeLabel: e.target.value,
                      }))
                    }
                    placeholder="Featured Article"
                    type="text"
                    value={config.featuredArticleBadgeLabel}
                  />
                )}

                {canEdit && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span className={styles.sidebarLabel}>Bottom CTA Label</span>
                    <input
                      aria-label="View more articles button label"
                      className={styles.sidebarInput}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          viewMoreArticlesLabel: e.target.value,
                        }))
                      }
                      placeholder="View more articles"
                      type="text"
                      value={config.viewMoreArticlesLabel}
                    />
                  </div>
                )}
              </div>
            </aside>

            {/* Right Column: Sticky Formatting Toolbar + Canva Blocks */}
            <div className={styles.bodyColumn}>
              {canEdit && (
                <div
                  aria-label="Rich text formatting toolbar"
                  className={styles.wysiwygToolbar}
                  role="toolbar"
                >
                  <button
                    className={styles.tbBtn}
                    onClick={() => applyFormatToBlock(activeBlockId, 'undo')}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    title="Undo"
                    type="button"
                  >
                    ↶
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() => applyFormatToBlock(activeBlockId, 'redo')}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    title="Redo"
                    type="button"
                  >
                    ↷
                  </button>
                  <span className={styles.tbSep} />
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'formatBlock', '<h2>')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    H2
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'formatBlock', '<h3>')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    H3
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'formatBlock', '<p>')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    P
                  </button>
                  <span className={styles.tbSep} />
                  <button
                    className={styles.tbBtn}
                    onClick={() => applyFormatToBlock(activeBlockId, 'bold')}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    B
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() => applyFormatToBlock(activeBlockId, 'italic')}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    style={{ fontStyle: 'italic' }}
                    type="button"
                  >
                    I
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'underline')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    style={{ textDecoration: 'underline' }}
                    type="button"
                  >
                    U
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'strikeThrough')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    style={{ textDecoration: 'line-through' }}
                    type="button"
                  >
                    S
                  </button>
                  <span className={styles.tbSep} />
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(
                        activeBlockId,
                        'formatBlock',
                        '<blockquote>',
                      )
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    “ Quote
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'insertUnorderedList')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    • List
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(activeBlockId, 'insertOrderedList')
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    1. List
                  </button>
                  <button
                    className={styles.tbBtn}
                    onClick={() =>
                      applyFormatToBlock(
                        activeBlockId,
                        'insertHorizontalRule',
                      )
                    }
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveSelection()
                    }}
                    type="button"
                  >
                    ―
                  </button>
                </div>
              )}

              <div className={styles.blockStack}>
                {config.blocks.map((block, index) => {
                  const isBlockActive = activeBlockId === block.id
                  return (
                    <div
                      className={`${styles.canvasBlock} ${
                        isBlockActive ? styles.canvasBlockActive : ''
                      }`}
                      id={`canvas-block-${block.id}`}
                      key={block.id}
                      onClick={() => setActiveBlockId(block.id)}
                    >
                      <div className={styles.blockControls}>
                        <span className={styles.blockKindPill}>
                          {block.type === 'image'
                            ? `Photo Block · #${index + 1}`
                            : `Text Section · #${index + 1}`}
                        </span>

                        {canEdit && (
                          <div className={styles.blockBtnRow}>
                            {block.type === 'image' && (
                              <button
                                className={styles.blockIconBtn}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setImageModal({
                                    kind: 'replace_block',
                                    blockId: block.id,
                                  })
                                }}
                                type="button"
                              >
                                Replace Photo
                              </button>
                            )}
                            <button
                              aria-label="Move block up"
                              className={styles.blockIconBtn}
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveBlock(index, -1)
                              }}
                              type="button"
                            >
                              ↑
                            </button>
                            <button
                              aria-label="Move block down"
                              className={styles.blockIconBtn}
                              disabled={index === config.blocks.length - 1}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMoveBlock(index, 1)
                              }}
                              type="button"
                            >
                              ↓
                            </button>
                            <button
                              aria-label="Remove block"
                              className={`${styles.blockIconBtn} ${styles.blockDeleteBtn}`}
                              disabled={config.blocks.length <= 1}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveBlock(block.id)
                              }}
                              title={
                                config.blocks.length <= 1
                                  ? 'At least one block is required'
                                  : 'Delete block'
                              }
                              type="button"
                            >
                              <OpgIconTrash size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {block.type === 'rich_text' ? (
                        <RichTextBlockCanvas
                          canEdit={canEdit}
                          initialMarkdown={block.markdown}
                          isActive={isBlockActive}
                          key={`${block.id}-${resetVersion}`}
                          onChangeMarkdown={(markdown) => {
                            setConfig((prev) => ({
                              ...prev,
                              blocks: prev.blocks.map((b) =>
                                b.id === block.id && b.type === 'rich_text'
                                  ? { ...b, markdown }
                                  : b,
                              ),
                            }))
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            saveSelection()
                            setActiveBlockId(block.id)
                            setContextMenu({
                              blockId: block.id,
                              x: Math.min(e.clientX, window.innerWidth - 220),
                              y: Math.min(e.clientY, window.innerHeight - 320),
                            })
                          }}
                          onFocusBlock={() => setActiveBlockId(block.id)}
                          onKeyDownShortcut={(e) => {
                            if (
                              (e.ctrlKey || e.metaKey) &&
                              e.key.toLowerCase() === 'b'
                            ) {
                              e.preventDefault()
                              applyFormatToBlock(block.id, 'bold')
                            } else if (
                              (e.ctrlKey || e.metaKey) &&
                              e.key.toLowerCase() === 'i'
                            ) {
                              e.preventDefault()
                              applyFormatToBlock(block.id, 'italic')
                            } else if (
                              (e.ctrlKey || e.metaKey) &&
                              e.key.toLowerCase() === 'u'
                            ) {
                              e.preventDefault()
                              applyFormatToBlock(block.id, 'underline')
                            }
                          }}
                          registerElement={(el) => {
                            editorRefs.current.set(block.id, el)
                          }}
                        />
                      ) : (
                        <div>
                          <div className={styles.blockImageFrame}>
                            {(() => {
                              const img = resolvePreviewImage(block.url)
                              return (
                                <Image
                                  alt={block.alt || 'Clients blog image'}
                                  fill
                                  sizes="(max-width: 64rem) 100vw, 760px"
                                  src={img.src}
                                  style={{ objectFit: 'cover' }}
                                  unoptimized={img.unoptimized}
                                />
                              )
                            })()}
                          </div>
                          {canEdit && (
                            <div className={styles.blockImageMeta}>
                              <input
                                aria-label="Image alt text"
                                className={styles.sidebarInput}
                                onChange={(e) =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    blocks: prev.blocks.map((b) =>
                                      b.id === block.id && b.type === 'image'
                                        ? { ...b, alt: e.target.value }
                                        : b,
                                    ),
                                  }))
                                }
                                placeholder="Alt text description…"
                                type="text"
                                value={block.alt}
                              />
                              <input
                                aria-label="Optional image caption"
                                className={styles.sidebarInput}
                                onChange={(e) =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    blocks: prev.blocks.map((b) =>
                                      b.id === block.id && b.type === 'image'
                                        ? { ...b, caption: e.target.value }
                                        : b,
                                    ),
                                  }))
                                }
                                placeholder="Optional photo caption…"
                                type="text"
                                value={block.caption || ''}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {canEdit && (
                <div className={styles.insertBar}>
                  <button
                    className={styles.insertPillBtn}
                    onClick={handleAddTextBlock}
                    type="button"
                  >
                    <OpgIconPlus size={14} />
                    <span>Add Text Section</span>
                  </button>
                  <button
                    className={styles.insertPillBtn}
                    onClick={() => setImageModal({ kind: 'insert_block' })}
                    type="button"
                  >
                    <OpgIconUpload size={14} />
                    <span>Add Photo Block</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right-Click Formatting Context Menu */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className={styles.contextMenuItem}
            onClick={() =>
              applyFormatToBlock(contextMenu.blockId, 'formatBlock', '<h3>')
            }
            type="button"
          >
            Section Heading (H3)
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() =>
              applyFormatToBlock(contextMenu.blockId, 'formatBlock', '<p>')
            }
            type="button"
          >
            Body Paragraph
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() => applyFormatToBlock(contextMenu.blockId, 'bold')}
            type="button"
          >
            Bold
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() => applyFormatToBlock(contextMenu.blockId, 'italic')}
            type="button"
          >
            Italic
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() =>
              applyFormatToBlock(contextMenu.blockId, 'insertOrderedList')
            }
            type="button"
          >
            Numbered Feature List
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() =>
              applyFormatToBlock(contextMenu.blockId, 'insertUnorderedList')
            }
            type="button"
          >
            Bullet List
          </button>
        </div>
      )}

      {/* Photo Upload / URL Picker Modal */}
      {imageModal && imageModalDefaults && (
        <StudioImageModal
          currentUrl={imageModalDefaults.currentUrl}
          isOpen
          onApply={handleApplyImageModal}
          onClose={() => setImageModal(null)}
          subtitle={imageModalDefaults.subtitle}
          title={imageModalDefaults.title}
        />
      )}

      {/* Reset Default Confirmation Modal */}
      <AdminConfirmDialog
        cancelText="Cancel"
        confirmText="Reset to Default"
        description="Restore the Clients Page Blog section (header, hero banner, Written By, and all content blocks) back to the original baseline layout?"
        formAction={async () => {
          const res = await resetClientsBlogAction()
          setIsResetDialogOpen(false)
          if (res.success && res.config) {
            setConfig(res.config)
            setSavedBaseline(res.config)
            setResetVersion((v) => v + 1)
            setBanner({
              type: 'success',
              text: 'Clients Blog reset to default showcase layout.',
            })
            notifyClientsBlogChanged()
            router.refresh()
          } else {
            setBanner({
              type: 'error',
              text: res.error || 'Could not reset blog layout.',
            })
          }
        }}
        icon={<OpgIconBlog size={22} />}
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title="Reset Blog Showcase"
        tone="warning"
      />
    </div>
  )
}
