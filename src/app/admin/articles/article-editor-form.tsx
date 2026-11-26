'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'

import {
  deleteArticleAction,
  saveArticleAction,
} from '@/app/admin/articles/actions'
import { initialArticleActionState } from '@/app/admin/articles/types'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCheck,
  OpgIconChevron,
  OpgIconClose,
  OpgIconLikes,
  OpgIconTrash,
  OpgIconUpload,
  OpgIconVisits,
} from '@/components/icons/opg-icons'
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from '@/lib/content/article-editor-conversion'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import type {
  AdminArticleDetail,
  ArticleCategory,
  Author,
} from '@/lib/content/articles'

import styles from './articles.module.css'

/* =========================================================================
   Custom Executive Pill Dropdown Component
   ========================================================================= */

type DropdownOption<T extends string | number> = {
  disabled?: boolean
  hint?: string
  label: string
  value: T
}

function FormPillDropdown<T extends string | number>({
  disabled = false,
  label,
  name,
  onChange,
  options,
  value,
}: {
  disabled?: boolean
  label: string
  name: string
  onChange: (val: T) => void
  options: DropdownOption<T>[]
  value: T
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  )

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <input name={name} type="hidden" value={value} />
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`${styles.dropdownTrigger} ${open ? styles.dropdownTriggerOpen : ''}`}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className={styles.dropdownTriggerValue}>
          {selectedOption?.label || 'Select…'}
        </span>
        <OpgIconChevron
          className={`${styles.dropdownChevron} ${open ? styles.dropdownChevronOpen : ''}`}
          size={16}
        />
      </button>

      {open && (
        <div className={styles.dropdownMenu} role="listbox">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value)
            return (
              <button
                aria-selected={isSelected}
                className={`${styles.dropdownOption} ${isSelected ? styles.dropdownOptionSelected : ''}`}
                disabled={option.disabled}
                key={String(option.value)}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                role="option"
                type="button"
              >
                <div className={styles.dropdownOptionText}>
                  <span className={styles.dropdownOptionLabel}>
                    {option.label}
                  </span>
                  {option.hint && (
                    <span className={styles.dropdownOptionHint}>
                      {option.hint}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className={styles.dropdownCheckmark}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   Cover Image Modal (URL or Device Upload with Smooth Minimal Animation)
   ========================================================================= */

function CoverImageModal({
  currentUrl,
  isOpen,
  onApply,
  onClose,
}: {
  currentUrl: string
  isOpen: boolean
  onApply: (url: string) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [urlInput, setUrlInput] = useState(currentUrl)
  const [uploadPreview, setUploadPreview] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const effectivePreview = mode === 'url' ? urlInput.trim() : uploadPreview

  const handleApply = () => {
    if (mode === 'url' && urlInput.trim()) {
      onApply(urlInput.trim())
    } else if (mode === 'upload' && uploadPreview) {
      onApply(uploadPreview)
    }
    onClose()
  }

  return (
    <div
      aria-labelledby="cover-modal-title"
      aria-modal="true"
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h2 className={styles.modalTitle} id="cover-modal-title">
              Update Cover Image
            </h2>
            <p className={styles.modalSubtitle}>
              Select a banner image or upload from your device to feature at the
              top of your article.
            </p>
          </div>
          <button
            aria-label="Close modal"
            className={styles.modalCloseBtn}
            onClick={onClose}
            type="button"
          >
            <OpgIconClose size={15} />
          </button>
        </div>

        <div className={styles.modalTabs}>
          <button
            className={`${styles.modalTab} ${mode === 'url' ? styles.modalTabActive : ''}`}
            onClick={() => setMode('url')}
            type="button"
          >
            Paste Image URL
          </button>
          <button
            className={`${styles.modalTab} ${mode === 'upload' ? styles.modalTabActive : ''}`}
            onClick={() => setMode('upload')}
            type="button"
          >
            Upload File
          </button>
        </div>

        <div className={styles.modalBody}>
          {mode === 'url' ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Image URL</label>
              <input
                autoFocus
                className={styles.input}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/cover-image.jpg"
                type="url"
                value={urlInput}
              />
              <span className={styles.fieldHint}>
                Paste any direct image URL (PNG, JPG, or WEBP).
              </span>
            </div>
          ) : (
            <div>
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={styles.fileInputHidden}
                id="modal-cover-file-upload"
                onChange={handleFileUpload}
                type="file"
              />
              <label
                className={styles.modalUploadDropzone}
                htmlFor="modal-cover-file-upload"
              >
                <span className={styles.modalUploadIcon}>📁</span>
                <span className={styles.modalUploadText}>
                  {uploadPreview
                    ? 'Replace uploaded image'
                    : 'Click to select an image from your device'}
                </span>
                <span className={styles.modalUploadHint}>
                  Supports PNG, JPG, WEBP, and GIF
                </span>
              </label>
            </div>
          )}

          {/* Live Preview Inside Modal */}
          {effectivePreview && (
            <div>
              <span
                className={styles.fieldLabel}
                style={{ marginBottom: '0.4rem' }}
              >
                Preview
              </span>
              <div className={styles.modalPreviewBanner}>
                {(() => {
                  const previewImg = resolveSafeArticleImage(effectivePreview)
                  return (
                    <Image
                      alt="Cover preview"
                      className={styles.modalPreviewImg}
                      fill
                      sizes="500px"
                      src={previewImg.src}
                      unoptimized={previewImg.unoptimized}
                    />
                  )
                })()}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.modalCancelBtn}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.modalApplyBtn}
            disabled={!effectivePreview}
            onClick={handleApply}
            type="button"
          >
            Apply Cover Image
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Operation Feedback Modal (Success & Error with Minimal Animation)
   ========================================================================= */

function OperationAlertModal({
  alert,
  onClose,
  onNavigateArticles,
}: {
  alert: { type: 'success' | 'error'; title: string; message: string } | null
  onClose: () => void
  onNavigateArticles: () => void
}) {
  useEffect(() => {
    if (!alert) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [alert, onClose])

  if (!alert) return null

  const isSuccess = alert.type === 'success'

  return (
    <div
      aria-modal="true"
      className={styles.opModalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="alertdialog"
    >
      <div className={styles.opModalCard}>
        <div
          className={`${styles.opModalIconWrap} ${
            isSuccess ? styles.opModalIconSuccess : styles.opModalIconError
          }`}
        >
          {isSuccess ? <OpgIconCheck size={20} /> : <OpgIconClose size={20} />}
        </div>
        <h3 className={styles.opModalTitle}>{alert.title}</h3>
        <p className={styles.opModalDesc}>{alert.message}</p>
        <div className={styles.opModalActions}>
          {isSuccess ? (
            <>
              <button
                className={styles.opModalBtnSecondary}
                onClick={onClose}
                type="button"
              >
                Keep Editing
              </button>
              <button
                className={styles.opModalBtnPrimary}
                onClick={onNavigateArticles}
                type="button"
              >
                View All Articles
              </button>
            </>
          ) : (
            <button
              className={styles.opModalBtnPrimary}
              onClick={onClose}
              type="button"
            >
              Review & Fix
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   Main Article Editor Form (WYSIWYG Live Canvas & Dedicated Form Fields)
   ========================================================================= */

export function ArticleEditorForm({
  article,
  authors,
  categories,
}: {
  article?: AdminArticleDetail | null
  authors: Author[]
  categories: ArticleCategory[]
  roleKey: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(
    saveArticleAction,
    initialArticleActionState,
  )

  const isEditing = Boolean(article)
  const isPublishedLive = article?.status === 'published'

  // Form State
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [markdownContent, setMarkdownContent] = useState(
    article?.markdownContent || '',
  )
  const [coverImageUrl, setCoverImageUrl] = useState(
    article?.cover_image_url || '',
  )
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>(
    article?.status || 'draft',
  )
  const [isFeatured, setIsFeatured] = useState<boolean>(
    Boolean(article?.is_featured),
  )
  const [authorName, setAuthorName] = useState<string>(
    article?.author_name || 'Outsourced Pro Global',
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    article?.category_id || categories[0]?.id || 1,
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [, startTransition] = useTransition()

  // SEO Accordion
  const [seoTitle, setSeoTitle] = useState(article?.seo_title || '')
  const [seoDescription, setSeoDescription] = useState(
    article?.seo_description || '',
  )
  const [showSeo, setShowSeo] = useState(false)

  // WYSIWYG ContentEditable & Context Menu
  const editorRef = useRef<HTMLDivElement>(null)
  const initialHtmlLoaded = useRef(false)
  const savedRangeRef = useRef<Range | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
  } | null>(null)

  // Initial Content Population in ContentEditable
  useEffect(() => {
    if (!initialHtmlLoaded.current && editorRef.current) {
      editorRef.current.innerHTML = markdownToEditorHtml(
        article?.markdownContent || '',
      )
      initialHtmlLoaded.current = true
    }
  }, [article?.markdownContent])

  // Track Unsaved Changes (Dirty State)
  const [initialData] = useState(() => ({
    authorName: article?.author_name || 'Outsourced Pro Global',
    categoryId: article?.category_id || categories[0]?.id || 1,
    coverImageUrl: article?.cover_image_url || '',
    excerpt: article?.excerpt || '',
    isFeatured: Boolean(article?.is_featured),
    markdownContent: article?.markdownContent || '',
    slug: article?.slug || '',
    status: article?.status || 'draft',
    title: article?.title || '',
  }))

  const isDirty = useMemo(() => {
    return (
      title !== initialData.title ||
      slug !== initialData.slug ||
      excerpt !== initialData.excerpt ||
      markdownContent !== initialData.markdownContent ||
      coverImageUrl !== initialData.coverImageUrl ||
      selectedStatus !== initialData.status ||
      isFeatured !== initialData.isFeatured ||
      authorName !== initialData.authorName ||
      selectedCategoryId !== initialData.categoryId
    )
  }, [
    title,
    slug,
    excerpt,
    markdownContent,
    coverImageUrl,
    selectedStatus,
    isFeatured,
    authorName,
    selectedCategoryId,
    initialData,
  ])

  // Context Menu Global Dismiss
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = () => setContextMenu(null)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu])

  // Save current selection range before opening toolbar/menu
  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  // Restore selection and apply format command
  const applyFormat = useCallback(
    (command: string, value: string | undefined = undefined) => {
      if (editorRef.current) {
        editorRef.current.focus()
      }
      if (savedRangeRef.current) {
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(savedRangeRef.current)
        }
      }
      document.execCommand(command, false, value)
      if (editorRef.current) {
        const updatedMd = editorHtmlToMarkdown(editorRef.current.innerHTML)
        setMarkdownContent(updatedMd)
      }
      setContextMenu(null)
    },
    [],
  )

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const updatedMd = editorHtmlToMarkdown(editorRef.current.innerHTML)
      setMarkdownContent(updatedMd)
    }
  }, [])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      saveSelection()
      // Clamp coordinates to ensure the menu stays on-screen and scrollable
      const menuWidth = 230
      const menuHeight = 360
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 16)
      const y = Math.min(e.clientY, window.innerHeight - menuHeight - 16)
      setContextMenu({ x: Math.max(16, x), y: Math.max(16, y) })
    },
    [saveSelection],
  )

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      applyFormat('bold')
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      applyFormat('italic')
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault()
      applyFormat('underline')
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        applyFormat('redo')
      } else {
        applyFormat('undo')
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      applyFormat('redo')
    }
  }

  // Auto-slugify when title changes
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!slugManuallyEdited) {
      const generated = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generated)
    }
  }

  // Word count & reading time
  const wordCount = useMemo(() => {
    return markdownContent.split(/\s+/).filter(Boolean).length
  }, [markdownContent])

  const calculatedReadingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Revert all edits (Discard) with Confirmation Modal
  const handleConfirmDiscard = useCallback(() => {
    setTitle(initialData.title)
    setSlug(initialData.slug)
    setExcerpt(initialData.excerpt)
    setMarkdownContent(initialData.markdownContent)
    setCoverImageUrl(initialData.coverImageUrl)
    setSelectedStatus(initialData.status)
    setIsFeatured(initialData.isFeatured)
    setAuthorName(initialData.authorName)
    setSelectedCategoryId(initialData.categoryId)
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToEditorHtml(
        initialData.markdownContent,
      )
    }
    setIsDiscardDialogOpen(false)
  }, [initialData])

  // Synchronously set status input before requestSubmit so FormData never submits stale state
  const triggerSaveWithStatus = (
    targetStatus: 'draft' | 'in_review' | 'published' | 'archived',
  ) => {
    setAlertDismissed(false)
    setSelectedStatus(targetStatus)
    const statusInput = formRef.current?.elements.namedItem(
      'status',
    ) as HTMLInputElement | null
    if (statusInput) {
      statusInput.value = targetStatus
    }
    formRef.current?.requestSubmit()
  }

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  )

  // Derived operation alert (pure derived state, zero cascading renders)
  const operationAlert = useMemo(() => {
    if (alertDismissed || state.status === 'idle') return null
    if (state.status === 'success') {
      return {
        type: 'success' as const,
        title:
          selectedStatus === 'published'
            ? 'Article Published Live!'
            : 'Draft Saved Successfully',
        message:
          state.message ||
          (selectedStatus === 'published'
            ? 'Article published successfully and live on the website!'
            : 'Article saved successfully.'),
      }
    }
    if (state.status === 'error') {
      return {
        type: 'error' as const,
        title: 'Unable to Save Article',
        message:
          state.message ||
          'Please review the required fields and fix validation errors.',
      }
    }
    return null
  }, [alertDismissed, state.status, state.message, selectedStatus])

  const excerptId = useId()

  return (
    <div className={styles.editorWorkspace}>
      {/* 1. Top Breadcrumb Navigation */}
      <div className={styles.headerTopNav}>
        <Link className={styles.headerBackBtn} href="/admin/articles">
          <OpgIconChevron className={styles.headerBackChevron} size={14} />
          <span>Back to Articles</span>
        </Link>
      </div>

      {/* 2. Top Header Section (Without visual Edit Article header per UX refinement) */}
      <div className={styles.editorHeader}>
        <h1 className="sr-only">
          {isEditing && article?.title
            ? `Edit Article: ${article.title}`
            : isEditing
              ? 'Edit Article'
              : 'Create Article'}
        </h1>

        {/* Subtext Row: Subtitle on the left, Views & Likes right-aligned */}
        <div className={styles.editorHeaderSubtextRow}>
          <p className={styles.editorSubtitle}>
            {isEditing && article?.title
              ? `Editing: "${article.title}"`
              : 'Write, review, and configure publishing metadata for OPG editorial insights.'}
          </p>

          {isEditing && (
            <div className={styles.subtextMetricsCluster}>
              <span className={styles.headerMetricChip} title="Lifetime views">
                <OpgIconVisits size={14} />
                <strong>{(article?.views || 0).toLocaleString()}</strong>
                <span>Views</span>
              </span>
              <span className={styles.headerMetricChip} title="Reader likes">
                <OpgIconLikes size={14} />
                <strong>{(article?.likes || 0).toLocaleString()}</strong>
                <span>Likes</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Form */}
      <form action={formAction} className={styles.editorLayout} ref={formRef}>
        <input name="id" type="hidden" value={state.articleId || article?.id || ''} />
        <input name="previous_slug" type="hidden" value={article?.slug || ''} />
        <input name="cover_image_url" type="hidden" value={coverImageUrl} />
        <input name="markdownContent" type="hidden" value={markdownContent} />
        <input
          name="category_slug"
          type="hidden"
          value={selectedCategory?.slug || ''}
        />
        <input
          name="category_name"
          type="hidden"
          value={selectedCategory?.name || ''}
        />

        {/* Left Column: Full Cover Banner, Title/Excerpt Fields & WYSIWYG Content */}
        <div className={styles.editorMain}>
          <div className={styles.documentHeaderCanvas}>
            {/* Full Cover Photo Banner Display (Uncropped, Viewable & Editable) */}
            <div className={styles.compactCoverArea}>
              {coverImageUrl ? (
                <div className={styles.compactCoverBanner}>
                  {(() => {
                    const safeCover = resolveSafeArticleImage(coverImageUrl)
                    return (
                      <Image
                        alt="Cover preview"
                        className={styles.compactCoverImg}
                        fill
                        sizes="(max-width: 1200px) 100vw, 840px"
                        src={safeCover.src}
                        unoptimized={safeCover.unoptimized}
                      />
                    )
                  })()}
                  <div className={styles.compactCoverOverlay}>
                    <button
                      className={styles.coverActionPill}
                      onClick={() => setIsCoverModalOpen(true)}
                      type="button"
                    >
                      Change Cover
                    </button>
                    <button
                      className={`${styles.coverActionPill} ${styles.coverActionPillDanger}`}
                      onClick={() => setCoverImageUrl('')}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.addCoverBannerBtn}
                  onClick={() => setIsCoverModalOpen(true)}
                  type="button"
                >
                  <OpgIconUpload size={18} />
                  <span>+ Add Article Cover Image</span>
                </button>
              )}
            </div>

            {/* Dedicated Article Metadata Card (Title, Slug & Description Form Fields) */}
            <div className={styles.articleMetaCard}>
              <div className={styles.field}>
                <label
                  className={styles.fieldLabel}
                  htmlFor="article-title-input"
                >
                  Article Title
                </label>
                <input
                  className={styles.titleInputField}
                  id="article-title-input"
                  name="title"
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter a compelling article headline…"
                  required
                  type="text"
                  value={title}
                />
                {state.errors?.title && (
                  <span className={styles.fieldError}>
                    {state.errors.title}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label
                  className={styles.fieldLabel}
                  htmlFor="article-slug-input"
                >
                  URL Slug
                </label>
                <div className={styles.slugInputWrapper}>
                  <span className={styles.slugPrefix}>/articles/</span>
                  <input
                    className={styles.slugInputField}
                    id="article-slug-input"
                    name="slug"
                    onChange={(e) => {
                      setSlugManuallyEdited(true)
                      setSlug(e.target.value.toLowerCase())
                    }}
                    placeholder="custom-article-slug"
                    required
                    type="text"
                    value={slug}
                  />
                </div>
                {state.errors?.slug && (
                  <span className={styles.fieldError}>{state.errors.slug}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={excerptId}>
                  Article Summary & Description
                </label>
                <textarea
                  className={styles.excerptTextareaField}
                  id={excerptId}
                  maxLength={500}
                  name="excerpt"
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Write a clear executive summary or excerpt (displayed in article cards, search listings, and social sharing previews)…"
                  required
                  rows={3}
                  value={excerpt}
                />
                <div className={styles.fieldMetaRow}>
                  <span className={styles.charCount}>
                    {excerpt.length} / 500 characters
                  </span>
                  {state.errors?.excerpt && (
                    <span className={styles.fieldError}>
                      {state.errors.excerpt}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* WYSIWYG Content Canvas Card */}
          <div className={styles.wysiwygCard}>
            {/* Sticky Notion-Style Interactive Toolbar (Single Seamless Row) */}
            <div className={styles.wysiwygToolbar} onMouseDown={saveSelection}>
              {/* History / Undo / Redo */}
              <div className={styles.toolbarButtonGroup}>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('undo')}
                  title="Undo (Ctrl+Z)"
                  type="button"
                >
                  ↺
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('redo')}
                  title="Redo (Ctrl+Y)"
                  type="button"
                >
                  ↻
                </button>
              </div>

              <span className={styles.toolbarDivider} />

              {/* Headings */}
              <div className={styles.toolbarButtonGroup}>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('formatBlock', '<h1>')}
                  title="Heading 1"
                  type="button"
                >
                  H1
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('formatBlock', '<h2>')}
                  title="Heading 2"
                  type="button"
                >
                  H2
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('formatBlock', '<h3>')}
                  title="Heading 3"
                  type="button"
                >
                  H3
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('formatBlock', '<p>')}
                  title="Normal Paragraph"
                  type="button"
                >
                  P
                </button>
              </div>

              <span className={styles.toolbarDivider} />

              {/* Text Styles */}
              <div className={styles.toolbarButtonGroup}>
                <button
                  className={`${styles.notionToolBtn} ${styles.boldBtn}`}
                  onClick={() => applyFormat('bold')}
                  title="Bold (Ctrl+B)"
                  type="button"
                >
                  B
                </button>
                <button
                  className={`${styles.notionToolBtn} ${styles.italicBtn}`}
                  onClick={() => applyFormat('italic')}
                  title="Italic (Ctrl+I)"
                  type="button"
                >
                  I
                </button>
                <button
                  className={`${styles.notionToolBtn} ${styles.underlineBtn}`}
                  onClick={() => applyFormat('underline')}
                  title="Underline (Ctrl+U)"
                  type="button"
                >
                  U
                </button>
                <button
                  className={`${styles.notionToolBtn} ${styles.strikeBtn}`}
                  onClick={() => applyFormat('strikeThrough')}
                  title="Strikethrough"
                  type="button"
                >
                  S
                </button>
              </div>

              <span className={styles.toolbarDivider} />

              {/* Quotes, Lists & Blocks */}
              <div className={styles.toolbarButtonGroup}>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('formatBlock', '<blockquote>')}
                  title="Quote Block"
                  type="button"
                >
                  “ ”
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('insertUnorderedList')}
                  title="Bullet List"
                  type="button"
                >
                  • List
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('insertOrderedList')}
                  title="Numbered List"
                  type="button"
                >
                  1. List
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('formatBlock', '<pre>')}
                  title="Code Block"
                  type="button"
                >
                  &lt;/&gt;
                </button>
                <button
                  className={styles.notionToolBtn}
                  onClick={() => applyFormat('insertHorizontalRule')}
                  title="Horizontal Divider"
                  type="button"
                >
                  —
                </button>
              </div>
            </div>

            {/* WYSIWYG ContentEditable Surface */}
            <div
              className={styles.wysiwygCanvas}
              contentEditable
              onContextMenu={handleContextMenu}
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              ref={editorRef}
              role="textbox"
              suppressContentEditableWarning
            />

            {/* Floating Right-Click Context Menu (Scrollable & Responsive) */}
            {contextMenu && (
              <div
                className={styles.contextMenu}
                style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('formatBlock', '<h1>')}
                  type="button"
                >
                  <span>Heading 1</span>
                  <strong>H1</strong>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('formatBlock', '<h2>')}
                  type="button"
                >
                  <span>Heading 2</span>
                  <strong>H2</strong>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('formatBlock', '<h3>')}
                  type="button"
                >
                  <span>Heading 3</span>
                  <strong>H3</strong>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('formatBlock', '<p>')}
                  type="button"
                >
                  <span>Paragraph</span>
                  <strong>P</strong>
                </button>
                <div className={styles.contextMenuDivider} />
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('bold')}
                  type="button"
                >
                  <span>Bold</span>
                  <strong>Ctrl+B</strong>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('italic')}
                  type="button"
                >
                  <span>Italic</span>
                  <strong>Ctrl+I</strong>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('underline')}
                  type="button"
                >
                  <span>Underline</span>
                  <strong>Ctrl+U</strong>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('strikeThrough')}
                  type="button"
                >
                  <span>Strikethrough</span>
                  <s>S</s>
                </button>
                <div className={styles.contextMenuDivider} />
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('formatBlock', '<blockquote>')}
                  type="button"
                >
                  <span>Quote Block</span>
                  <span>“ ”</span>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('insertUnorderedList')}
                  type="button"
                >
                  <span>Bullet List</span>
                  <span>•</span>
                </button>
                <button
                  className={styles.contextMenuItem}
                  onClick={() => applyFormat('insertOrderedList')}
                  type="button"
                >
                  <span>Numbered List</span>
                  <span>1.</span>
                </button>
              </div>
            )}

            {/* Content Card Footer with Public Link & Statistics */}
            <div className={styles.writeCardFooter}>
              <span className={styles.writeCardFooterNote}>
                {wordCount} words · ~{calculatedReadingTime} min read
              </span>
              {isEditing && (
                <Link
                  className={styles.viewPublicPageBtn}
                  href={`/articles/${slug || article?.slug}`}
                  target="_blank"
                  title="View live publication"
                >
                  <span>View Public Page</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className={styles.editorSidebar}>
          {/* Card: Publishing & Status (Clear & Non-Confusing) */}
          <div className={styles.formCard}>
            <div className={styles.publishingStatusHeader}>
              <h2
                className={styles.formCardTitle}
                style={{ border: 'none', padding: 0 }}
              >
                Publishing & Status
              </h2>
              <span
                className={`${styles.liveStatusPill} ${
                  selectedStatus === 'published'
                    ? styles.liveStatusPillPublished
                    : selectedStatus === 'draft'
                      ? styles.liveStatusPillDraft
                      : selectedStatus === 'in_review'
                        ? styles.liveStatusPillReview
                        : styles.liveStatusPillArchived
                }`}
              >
                ●{' '}
                {selectedStatus === 'published'
                  ? 'Published'
                  : selectedStatus === 'draft'
                    ? 'Draft'
                    : selectedStatus === 'in_review'
                      ? 'In Review'
                      : 'Archived'}
              </span>
            </div>

            {/* Clear Primary & Secondary Actions */}
            <div className={styles.publishingActionGrid}>
              <button
                className={styles.primaryPublishBtn}
                disabled={isPending}
                onClick={() => triggerSaveWithStatus('published')}
                type="button"
              >
                {isPending && selectedStatus === 'published'
                  ? 'Publishing Story…'
                  : selectedStatus === 'published'
                    ? 'Update & Re-publish'
                    : 'Publish Story'}
              </button>

              <button
                className={styles.secondaryDraftBtn}
                disabled={isPending}
                onClick={() =>
                  triggerSaveWithStatus(
                    selectedStatus === 'in_review'
                      ? 'in_review'
                      : selectedStatus === 'archived'
                        ? 'archived'
                        : 'draft',
                  )
                }
                type="button"
              >
                {isPending && selectedStatus !== 'published'
                  ? 'Saving…'
                  : selectedStatus === 'in_review'
                    ? 'Save as In Review'
                    : selectedStatus === 'archived'
                      ? 'Save as Archived'
                      : selectedStatus === 'published'
                        ? 'Unpublish to Draft'
                        : 'Save as Draft'}
              </button>
            </div>

            {/* Status Dropdown Override */}
            <div style={{ marginTop: '0.25rem' }}>
              <FormPillDropdown
                label="Status Setting"
                name="status"
                onChange={(val) => setSelectedStatus(val)}
                options={[
                  {
                    value: 'draft',
                    label: 'Draft',
                    hint: 'Private draft',
                  },
                  {
                    value: 'in_review',
                    label: 'In Review',
                    hint: 'Editorial approval queue',
                  },
                  {
                    value: 'published',
                    label: 'Published',
                    hint: 'Live on public website',
                  },
                  {
                    value: 'archived',
                    label: 'Archived',
                    hint: 'Taken down from public',
                  },
                ]}
                value={selectedStatus}
              />
            </div>

            {/* Featured Article Selection */}
            <div className={styles.featuredToggleRow}>
              <div className={styles.featuredToggleCopy}>
                <span className={styles.featuredToggleTitle}>
                  Featured Article
                </span>
                <span className={styles.featuredToggleHint}>
                  {selectedStatus === 'published'
                    ? 'Pin as main spotlight story on /articles'
                    : 'Spotlight on /articles once published'}
                </span>
              </div>
              <button
                aria-checked={isFeatured}
                aria-label="Toggle featured article"
                className={`${styles.featuredSwitch} ${isFeatured ? styles.featuredSwitchActive : ''}`}
                onClick={() => setIsFeatured((prev) => !prev)}
                role="switch"
                type="button"
              >
                <span className={styles.featuredSwitchThumb} />
              </button>
              <input
                name="is_featured"
                type="hidden"
                value={isFeatured ? 'true' : 'false'}
              />
            </div>

            {/* Delete This Article */}
            {isEditing && (
              <div className={styles.deleteInlineWrap}>
                <button
                  className={styles.deleteArticleInlineBtn}
                  onClick={() => setIsDeleteDialogOpen(true)}
                  type="button"
                >
                  <OpgIconTrash size={16} />
                  <span>Delete This Article</span>
                </button>
              </div>
            )}
          </div>

          {/* Card: Taxonomy & Metadata */}
          <div className={styles.formCard}>
            <h2 className={styles.formCardTitle}>Taxonomy & Metadata</h2>

            <div>
              <FormPillDropdown
                label="Category"
                name="category_id"
                onChange={(val) => setSelectedCategoryId(Number(val))}
                options={categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                value={selectedCategoryId}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="article-author-input">
                Author
              </label>
              <input
                className={styles.input}
                id="article-author-input"
                list="article-author-suggestions"
                name="author_name"
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Outsourced Pro Global"
                type="text"
                value={authorName}
              />
              {authors.length > 0 && (
                <datalist id="article-author-suggestions">
                  {authors.map((author) => (
                    <option key={author.id} value={author.full_name} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Card: Collapsible SEO */}
          <div className={styles.formCard}>
            <button
              className={styles.formCardToggleBtn}
              onClick={() => setShowSeo((prev) => !prev)}
              type="button"
            >
              <span>Search Engine Optimization (SEO)</span>
              <span className={styles.accordionArrow}>
                {showSeo ? '▲' : '▼'}
              </span>
            </button>

            {showSeo && (
              <div className={styles.seoFieldStack}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>SEO Title</label>
                  <input
                    className={styles.input}
                    name="seo_title"
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Defaults to article title if blank"
                    type="text"
                    value={seoTitle}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    SEO Meta Description
                  </label>
                  <textarea
                    className={styles.textarea}
                    name="seo_description"
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Defaults to excerpt if blank"
                    rows={3}
                    value={seoDescription}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Floating Action Bar (Pure Black background, appears when unsaved changes occur) */}
      {isDirty && (
        <div className={styles.floatingActionBar}>
          <div className={styles.floatingBarStatus}>
            <span className={styles.floatingBarDot} />
            <span>You have unsaved changes</span>
          </div>
          <div className={styles.floatingBarActions}>
            <button
              className={styles.floatingDiscardBtn}
              onClick={() => setIsDiscardDialogOpen(true)}
              type="button"
            >
              Discard
            </button>
            <button
              className={styles.floatingDraftBtn}
              onClick={() => triggerSaveWithStatus('draft')}
              type="button"
            >
              Save as Draft
            </button>
            <button
              className={styles.floatingPublishBtn}
              onClick={() => triggerSaveWithStatus('published')}
              type="button"
            >
              {isPublishedLive ? 'Re-publish' : 'Publish Live'}
            </button>
          </div>
        </div>
      )}

      {/* Cover Image Selection Modal */}
      <CoverImageModal
        currentUrl={coverImageUrl}
        isOpen={isCoverModalOpen}
        onApply={(url) => setCoverImageUrl(url)}
        onClose={() => setIsCoverModalOpen(false)}
      />

      {/* Operation Feedback Alert Modal (Replaces browser alert with smooth minimal modal) */}
      <OperationAlertModal
        alert={operationAlert}
        onClose={() => setAlertDismissed(true)}
        onNavigateArticles={() => {
          setAlertDismissed(true)
          router.push('/admin/articles')
          router.refresh()
        }}
      />

      {/* Discard Confirmation Modal (Smooth minimal modal replacing window.confirm) */}
      <AdminConfirmDialog
        cancelText="Keep Editing"
        confirmText="Discard Changes"
        description="Are you sure you want to discard your edits and revert back to the original article state? All unsaved edits will be lost."
        isOpen={isDiscardDialogOpen}
        onClose={() => setIsDiscardDialogOpen(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Unsaved Changes"
        tone="warning"
      />

      {/* Delete Confirmation Modal for Safety */}
      {isEditing && article && (
        <AdminConfirmDialog
          cancelText="Cancel"
          confirmText="Delete Article"
          description={`Are you sure you want to permanently delete "${article.title}"? This action cannot be undone.`}
          formAction={async (formData) => {
            formData.set('articleId', article.id)
            formData.set('slug', article.slug)
            await deleteArticleAction(formData)
            startTransition(() => {
              router.push('/admin/articles')
              router.refresh()
            })
          }}
          icon={<OpgIconTrash size={24} />}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          title="Confirm Article Deletion"
          tone="danger"
        />
      )}
    </div>
  )
}
