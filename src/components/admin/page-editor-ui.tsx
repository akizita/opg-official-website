'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { StatusBadge } from '@/components/ui/status-badge'
import type { DocumentStatus } from '@/lib/content/page-documents'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { EditorSaveState } from '@/components/admin/use-page-editor-form'

type EditorIconName = 'check' | 'content' | 'essentials' | 'search' | 'values'

function EditorIcon({ name }: { name: EditorIconName }) {
  const paths: Record<EditorIconName, ReactNode> = {
    essentials: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    content: (
      <>
        <path d="M4 19.5V5.7A1.7 1.7 0 0 1 5.7 4H18v15H5.5A1.5 1.5 0 0 0 4 20.5" />
        <path d="M8 8h6M8 12h7" />
      </>
    ),
    values: (
      <>
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

export function PageEditorSectionHeading({
  description,
  eyebrow,
  icon,
  id,
  title,
}: {
  description: string
  eyebrow: string
  icon: Exclude<EditorIconName, 'check'>
  id: string
  title: string
}) {
  return (
    <header className="content-form__section-heading">
      <span className="content-form__section-icon">
        <EditorIcon name={icon} />
      </span>
      <span className="content-form__section-copy">
        <span>{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        <small>{description}</small>
      </span>
    </header>
  )
}

export function CharacterCounter({
  current,
  maximum,
  recommended,
}: {
  current: number
  maximum: number
  recommended?: number
}) {
  const ratio = current / (recommended ?? maximum)
  const tone =
    current >= maximum ? 'danger' : ratio >= 0.8 ? 'warning' : 'default'

  return (
    <span className={`field-counter field-counter--${tone}`}>
      {current} / {recommended ?? maximum}
      {recommended ? ' recommended' : ''}
    </span>
  )
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'Not saved yet'

  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  )
  if (elapsedSeconds < 60) return 'Just now'

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`

  const elapsedDays = Math.floor(elapsedHours / 24)
  if (elapsedDays < 30) return `${elapsedDays}d ago`

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function exactTime(value: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleString()
}

export function SaveStatusIndicator({
  onRetry,
  saveState,
  updatedAt,
}: {
  onRetry: () => void
  saveState: EditorSaveState
  updatedAt: string | null
}) {
  const [, setMinute] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(
      () => setMinute((minute) => minute + 1),
      60_000,
    )
    return () => window.clearInterval(timer)
  }, [])
  const label =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'dirty'
        ? 'Unsaved changes'
        : saveState === 'error'
          ? 'Save failed – Retry'
          : updatedAt
            ? `Saved ${formatRelativeTime(updatedAt).toLowerCase()}`
            : 'Not saved yet'

  return (
    <span
      aria-live="polite"
      className="cms-page-header__save-state"
      data-save-state={saveState}
      suppressHydrationWarning
      title={exactTime(updatedAt)}
    >
      <span aria-hidden="true" />
      {saveState === 'error' ? (
        <button onClick={onRetry} type="button">
          {label}
        </button>
      ) : (
        label
      )}
    </span>
  )
}

export function AdminPageHeader({
  description,
  pageName,
}: {
  description: string
  pageName: string
}) {
  return (
    <header className="cms-page-header">
      <div className="cms-page-header__copy">
        <p>Website CMS</p>
        <h1>{pageName}</h1>
        <p className="cms-page-header__description">{description}</p>
      </div>
    </header>
  )
}

export type EditorSectionLink = {
  id: string
  label: string
  status: 'complete' | 'error' | 'incomplete' | 'optional'
}

export function revealEditorField(targetId: string) {
  window.dispatchEvent(
    new CustomEvent('opg-editor-reveal', { detail: { targetId } }),
  )
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId)
      if (!target) return
      const tabs = document.querySelector('.pages-workspace__tabs')
      const offset = Math.max(
        88,
        (tabs?.getBoundingClientRect().bottom ?? 0) + 20,
      )
      window.scrollTo({
        top: window.scrollY + target.getBoundingClientRect().top - offset,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
      if (
        !target.hasAttribute('tabindex') &&
        !/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName)
      ) {
        target.setAttribute('tabindex', '-1')
      }
      target.focus({ preventScroll: true })
    })
  })
}

export function PageSectionNavigator({
  page,
  sections,
}: {
  page: 'about' | 'clients' | 'home' | 'careers' | 'articles' | 'contact'
  sections: EditorSectionLink[]
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const pendingSection = useRef<string | null>(null)
  const sectionIds = sections.map((section) => section.id).join('|')

  useEffect(() => {
    const update = () => {
      if (pendingSection.current) return
      const visible = sections.filter((section) => {
        const element = document.getElementById(section.id)
        return (
          element &&
          element.getClientRects().length > 0 &&
          element.getBoundingClientRect().top <= 180
        )
      })
      setActiveId(visible.at(-1)?.id ?? sections[0]?.id ?? '')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [sectionIds, sections])

  const setAll = (expanded: boolean) => {
    window.dispatchEvent(
      new CustomEvent('opg-editor-expand', { detail: { page, expanded } }),
    )
  }

  const jumpToSection = (id: string) => {
    pendingSection.current = id
    setActiveId(id)
    revealEditorField(id)
    window.setTimeout(() => {
      if (pendingSection.current === id) pendingSection.current = null
    }, 650)
  }

  return (
    <nav aria-label="Page sections" className="cms-section-nav">
      <div className="cms-section-nav__heading">
        <p>On this page</p>
        <div>
          <button onClick={() => setAll(true)} type="button">
            Expand all
          </button>
          <button onClick={() => setAll(false)} type="button">
            Collapse all
          </button>
        </div>
      </div>
      <label className="cms-section-nav__select">
        <span>Jump to section</span>
        <select
          onChange={(event) => {
            jumpToSection(event.target.value)
          }}
          value={activeId}
        >
          {sections.map((section, index) => (
            <option key={section.id} value={section.id}>
              {String(index + 1).padStart(2, '0')} · {section.label}
            </option>
          ))}
        </select>
      </label>
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <button
              aria-current={activeId === section.id ? 'location' : undefined}
              data-status={section.status}
              onClick={() => {
                jumpToSection(section.id)
              }}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span>{section.label}</span>
              <span
                aria-label={
                  section.status === 'complete'
                    ? 'Has content'
                    : section.status === 'incomplete'
                      ? 'No content'
                      : section.status === 'error'
                        ? 'Has errors'
                        : 'Optional'
                }
                className="cms-section-nav__status"
              />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function SectionCard({
  children,
  complete,
  defaultOpen = true,
  description,
  eyebrow,
  errorCount = 0,
  icon,
  id,
  summary,
  title,
}: {
  children: ReactNode
  complete: boolean
  defaultOpen?: boolean
  description: string
  eyebrow: string
  errorCount?: number
  icon: Exclude<EditorIconName, 'check'>
  id: string
  summary?: string
  title: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = `${id}-content`

  useEffect(() => {
    const stored = window.localStorage.getItem(`opg-editor-section:${id}`)
    if (stored !== null) window.setTimeout(() => setOpen(stored === 'open'), 0)

    const reveal = (event: Event) => {
      const targetId = (event as CustomEvent<{ targetId: string }>).detail
        ?.targetId
      const target = targetId ? document.getElementById(targetId) : null
      if (target && document.getElementById(id)?.contains(target)) setOpen(true)
    }
    const expand = (event: Event) => {
      const detail = (event as CustomEvent<{ expanded: boolean; page: string }>)
        .detail
      if (detail?.page === id.split('-')[0]) {
        setOpen(detail.expanded)
        window.localStorage.setItem(
          `opg-editor-section:${id}`,
          detail.expanded ? 'open' : 'closed',
        )
      }
    }
    window.addEventListener('opg-editor-reveal', reveal)
    window.addEventListener('opg-editor-expand', expand)
    return () => {
      window.removeEventListener('opg-editor-reveal', reveal)
      window.removeEventListener('opg-editor-expand', expand)
    }
  }, [id])

  const toggle = () => {
    const next = !open
    setOpen(next)
    window.localStorage.setItem(
      `opg-editor-section:${id}`,
      next ? 'open' : 'closed',
    )
  }

  return (
    <section className="content-form__section cms-section-card" id={id}>
      <button
        aria-controls={contentId}
        aria-expanded={open}
        className="cms-section-card__trigger"
        onClick={toggle}
        type="button"
      >
        <span className="content-form__section-icon">
          <EditorIcon name={icon} />
        </span>
        <span className="cms-section-card__copy">
          <span className="cms-section-card__title-row">
            <span id={`${id}-title`} role="heading" aria-level={2}>
              {title}
            </span>
            {/optional|search/i.test(eyebrow) ? <small>Optional</small> : null}
          </span>
          <span className="cms-section-card__description">
            {open ? description : summary || description}
          </span>
        </span>
        <span
          className="cms-section-card__status"
          data-status={
            errorCount ? 'error' : complete ? 'complete' : 'incomplete'
          }
        >
          {errorCount
            ? `${errorCount} error${errorCount === 1 ? '' : 's'}`
            : complete
              ? 'Has content'
              : /optional|search/i.test(eyebrow)
                ? 'Optional'
                : 'Empty'}
        </span>
        <svg
          aria-hidden="true"
          className="cms-section-card__chevron"
          viewBox="0 0 24 24"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      <div
        aria-hidden={!open}
        className="cms-section-card__content"
        data-open={open}
        id={contentId}
        inert={!open}
      >
        <div className="cms-section-card__content-inner">{children}</div>
      </div>
    </section>
  )
}

export function FieldGroup({
  children,
  description,
  title,
}: {
  children: ReactNode
  description?: string
  title: string
}) {
  return (
    <div className="cms-field-group">
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function InheritedSections({
  id,
  manageHref,
  sections,
}: {
  id: string
  manageHref?: string
  sections: string[]
}) {
  return (
    <section className="cms-inherited-sections" id={id}>
      <div>
        <p>Managed elsewhere</p>
        <h2>Other sections on this page</h2>
        <span>
          These public-page sections use content from other CMS collections or
          site components. They are shown here for context and cannot be edited
          in this page form.
        </span>
        {manageHref ? (
          <Link className="cms-inherited-sections__link" href={manageHref}>
            View client collection ↗
          </Link>
        ) : null}
      </div>
      <ul>
        {sections.map((section) => (
          <li key={section}>
            <span aria-hidden="true" />
            {section}
            <small>Read-only</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

function validMediaSource(value: string) {
  return value.startsWith('/') || /^https?:\/\//i.test(value)
}

export function MediaPicker({
  inputId,
  value,
}: {
  inputId: string
  value: string
}) {
  const updateInput = (nextValue: string) => {
    const input = document.getElementById(inputId)
    if (!(input instanceof HTMLInputElement)) return
    input.value = nextValue
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus()
  }

  const removeImage = () => {
    if (!window.confirm('Remove this social preview image URL?')) return
    updateInput('')
  }

  return (
    <div className="cms-media-picker">
      <div className="cms-media-picker__preview">
        {validMediaSource(value) ? (
          // This is a user-entered preview URL, so it cannot be constrained to
          // Next Image's build-time remote-host allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={value} />
        ) : (
          <span>No image selected</span>
        )}
      </div>
      <div className="cms-media-picker__details">
        <strong>Social preview image</strong>
        <p>Recommended size: 1200 × 630 pixels.</p>
        <div>
          <button onClick={() => updateInput(value)} type="button">
            {value ? 'Replace URL' : 'Add image URL'}
          </button>
          {value ? (
            <button onClick={removeImage} type="button">
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="content-form__actions cms-sticky-actions">{children}</div>
  )
}

export function PageDetailsCard({
  dirty,
  editorName,
  hasSavedDraft,
  onRetry,
  publishedAt,
  publishedUrl,
  saveState,
  status,
  updatedAt,
  version,
}: {
  dirty: boolean
  editorName: string
  hasSavedDraft: boolean
  onRetry: () => void
  publishedAt: string | null
  publishedUrl: string
  saveState: EditorSaveState
  status: DocumentStatus
  updatedAt: string | null
  version: number
}) {
  return (
    <aside aria-label="Page details" className="page-editor-rail">
      <section className="page-editor-rail__card page-editor-rail__card--summary">
        <p className="page-editor-rail__eyebrow">Page details</p>
        <div className="page-editor-rail__current-state">
          <div className="page-editor-rail__state-line">
            <StatusBadge
              className={
                dirty && status === 'published' ? 'status-badge--pending' : ''
              }
              label={
                dirty && status === 'published'
                  ? 'Unpublished changes'
                  : undefined
              }
              status={status}
            />
            <span>Version {version}</span>
          </div>
          <SaveStatusIndicator
            onRetry={onRetry}
            saveState={saveState}
            updatedAt={updatedAt}
          />
        </div>
        <dl className="page-editor-status__details">
          <div>
            <dt>Last edited</dt>
            <dd title={exactTime(updatedAt)} suppressHydrationWarning>
              {formatRelativeTime(updatedAt)}
            </dd>
          </div>
          <div>
            <dt>Last edited by</dt>
            <dd>{editorName}</dd>
          </div>
          <div>
            <dt>Published URL</dt>
            <dd>
              <a href={publishedUrl} rel="noopener noreferrer" target="_blank">
                View page ↗
              </a>
            </dd>
          </div>
          <div>
            <dt>Last published</dt>
            <dd title={exactTime(publishedAt)} suppressHydrationWarning>
              {formatRelativeTime(publishedAt)}
            </dd>
          </div>
        </dl>
      </section>
      {hasSavedDraft ? (
        <section className="page-editor-rail__card page-editor-draft-card">
          <div className="page-editor-draft-card__heading">
            <span aria-hidden="true">
              <EditorIcon name="content" />
            </span>
            <div>
              <p className="page-editor-rail__eyebrow">Drafts</p>
              <h2>Current saved draft</h2>
            </div>
          </div>
          <p>
            Continue editing the latest saved version. Publishing will make
            these changes visible on the website.
          </p>
          <dl>
            <div>
              <dt>Version</dt>
              <dd>{version}</dd>
            </div>
            <div>
              <dt>Saved</dt>
              <dd title={exactTime(updatedAt)} suppressHydrationWarning>
                {formatRelativeTime(updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </aside>
  )
}

export function SearchSnippetPreview({
  description,
  title,
  url,
}: {
  description: string
  title: string
  url: string
}) {
  return (
    <div aria-label="Search result preview" className="cms-search-snippet">
      <span>Search result preview</span>
      <small>{url}</small>
      <strong>{title.trim() || 'Page title'}</strong>
      <p>
        {description.trim() ||
          'Add a meta description to preview your search result.'}
      </p>
    </div>
  )
}

export type EditorPermissions = {
  canEditDraft: boolean
  canPublish: boolean
  canRequestChanges: boolean
  canSubmitReview: boolean
}

export function PageEditorActions({
  dirty,
  onDiscard,
  permissions,
  status,
}: {
  dirty: boolean
  onDiscard: () => void
  permissions: EditorPermissions
  status: DocumentStatus
}) {
  const { pending } = useFormStatus()

  return (
    <StickyActionBar>
      <div className="cms-sticky-actions__secondary">
        {permissions.canEditDraft ? (
          <button
            className="button button--secondary"
            disabled={
              pending ||
              !dirty ||
              !['draft', 'changes_requested', 'unpublished'].includes(status)
            }
            name="intent"
            title={
              status === 'published'
                ? 'Use Update Live Page to save published content.'
                : undefined
            }
            type="submit"
            value="save_draft"
          >
            Save Draft
          </button>
        ) : null}
        {dirty ? (
          <button
            className="cms-sticky-actions__discard"
            disabled={pending}
            onClick={() => onDiscard()}
            type="button"
          >
            Discard changes
          </button>
        ) : null}
        {permissions.canSubmitReview && status !== 'in_review' ? (
          <button
            className="button button--secondary"
            disabled={pending}
            name="intent"
            type="submit"
            value="submit_review"
          >
            Submit for Review
          </button>
        ) : null}
        {permissions.canRequestChanges && status === 'in_review' ? (
          <button
            className="button button--secondary"
            disabled={pending}
            name="intent"
            type="submit"
            value="request_changes"
          >
            Request Changes
          </button>
        ) : null}
      </div>
      {permissions.canPublish ? (
        <div className="cms-sticky-actions__primary">
          {status === 'published' ? (
            <button
              className="cms-sticky-actions__unpublish"
              disabled={pending}
              name="intent"
              type="submit"
              value="unpublish"
            >
              Unpublish
            </button>
          ) : null}
          <button
            className="button button--primary"
            disabled={pending || (status === 'published' && !dirty)}
            name="intent"
            type="submit"
            value="publish"
          >
            {status === 'published' ? 'Update Live Page' : 'Publish Page'}
          </button>
        </div>
      ) : null}
    </StickyActionBar>
  )
}

export function PageEditorToast({
  message,
  variant = 'success',
}: {
  message: string
  variant?: 'error' | 'success'
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 4000)
    return () => window.clearTimeout(timeout)
  }, [])

  if (!visible) return null

  return (
    <div
      className={`page-editor-toast page-editor-toast--${variant}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <span aria-hidden="true">
        {variant === 'error' ? '!' : <EditorIcon name="check" />}
      </span>
      {message}
    </div>
  )
}
