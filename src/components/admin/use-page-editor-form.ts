'use client'

import {
  type FocusEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type { PagesWorkspaceTab } from '@/components/admin/pages-workspace'
import type { DocumentStatus } from '@/lib/content/page-documents'

export type EditorSaveState = 'dirty' | 'error' | 'saved' | 'saving'

type EditorActionResult = {
  errors?: Record<string, string>
  message?: string
  status?: DocumentStatus
  success?: boolean
  updatedAt?: string
  version?: number
}

function fieldError(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
) {
  const label =
    element.labels?.[0]?.querySelector('span')?.textContent?.trim() ||
    element.name.replace(/([A-Z])/g, ' $1').toLowerCase()
  if (element.validity.valueMissing) return `${label} is required.`
  if (
    element.validity.tooLong &&
    'maxLength' in element &&
    element.maxLength > 0
  ) {
    return `${label} must be ${element.maxLength} characters or fewer.`
  }
  if (element.validity.typeMismatch)
    return `Enter a valid ${label.toLowerCase()}.`
  return ''
}

function growTextArea(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export function usePageEditorForm<T extends Record<string, string>>({
  initialValues,
  result,
  status,
  tab,
  updatedAt,
  version,
}: {
  initialValues: T
  result: EditorActionResult
  status: DocumentStatus
  tab: PagesWorkspaceTab
  updatedAt: string | null
  version: number
}) {
  const keys = Object.keys(initialValues) as Array<keyof T>
  const formRef = useRef<HTMLFormElement>(null)
  const saveDraftRef = useRef<HTMLButtonElement>(null)
  const submittedValues = useRef<T | null>(null)
  const [savedValues, setSavedValues] = useState(initialValues)
  const [draft, setDraft] = useState(initialValues)
  const [phase, setPhase] = useState<'error' | 'idle' | 'saving'>('idle')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const dirty = keys.some((key) => draft[key] !== savedValues[key])
  const saveState: EditorSaveState =
    phase === 'error'
      ? 'error'
      : phase === 'saving'
        ? 'saving'
        : dirty
          ? 'dirty'
          : 'saved'

  const readValues = (form: HTMLFormElement): T => {
    const data = new FormData(form)
    return Object.fromEntries(
      keys.map((key) => [key, String(data.get(String(key)) || '')]),
    ) as T
  }

  const submitDraft = useCallback(() => {
    if (!['draft', 'changes_requested', 'unpublished'].includes(status)) return
    const form = formRef.current
    const button = saveDraftRef.current
    if (form && button && form.checkValidity()) form.requestSubmit(button)
  }, [status])

  useEffect(() => {
    if (result.success && result.updatedAt && submittedValues.current) {
      const submitted = submittedValues.current
      const timeout = window.setTimeout(() => {
        setSavedValues(submitted)
        submittedValues.current = null
        setPhase('idle')
      }, 0)
      return () => window.clearTimeout(timeout)
    } else if (result.success === false) {
      const timeout = window.setTimeout(() => setPhase('error'), 0)
      return () => window.clearTimeout(timeout)
    }
  }, [result])

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    form
      .querySelectorAll('textarea')
      .forEach((element) => growTextArea(element))
  }, [])

  useEffect(() => {
    if (
      !dirty ||
      phase !== 'idle' ||
      !['draft', 'changes_requested', 'unpublished'].includes(status)
    )
      return
    const timeout = window.setTimeout(submitDraft, 3000)
    return () => window.clearTimeout(timeout)
  }, [dirty, draft, phase, status, submitDraft])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's')
        return
      const form = formRef.current
      if (!form || form.closest('[hidden]')) return
      event.preventDefault()
      if (dirty) submitDraft()
    }
    const handleRetry = (event: Event) => {
      if (
        (event as CustomEvent<{ tab: PagesWorkspaceTab }>).detail?.tab ===
          tab &&
        dirty
      ) {
        submitDraft()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('opg-editor-retry', handleRetry)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('opg-editor-retry', handleRetry)
    }
  }, [dirty, submitDraft, tab])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('opg-editor-state', {
        detail: { dirty, saveState, status, tab, updatedAt, version },
      }),
    )
  }, [dirty, saveState, status, tab, updatedAt, version])

  const handleInput = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target
    setDraft(readValues(event.currentTarget))
    if (target instanceof HTMLTextAreaElement) growTextArea(target)
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      setFieldErrors((current) => {
        if (!current[target.name]) return current
        return { ...current, [target.name]: fieldError(target) }
      })
    }
    if (phase === 'error') setPhase('idle')
  }

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    const target = event.target
    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ))
      return
    if (!target.name) return
    setFieldErrors((current) => ({
      ...current,
      [target.name]: fieldError(target),
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    submittedValues.current = readValues(event.currentTarget)
    setPhase('saving')
  }

  const discard = (confirmed = false) => {
    if (
      !dirty ||
      (!confirmed &&
        !window.confirm('Discard your unsaved changes to this page?'))
    )
      return
    const form = formRef.current
    if (!form) return
    for (const key of keys) {
      const element = form.elements.namedItem(String(key))
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.value = savedValues[key]
        if (element instanceof HTMLTextAreaElement) growTextArea(element)
      }
    }
    setDraft({ ...savedValues })
    setFieldErrors({})
    setPhase('idle')
  }

  useEffect(() => {
    const onDiscard = (event: Event) => {
      if (
        (event as CustomEvent<{ tab: PagesWorkspaceTab }>).detail?.tab === tab
      )
        discard(true)
    }
    window.addEventListener('opg-editor-discard', onDiscard)
    return () => window.removeEventListener('opg-editor-discard', onDiscard)
  })

  return {
    dirty,
    discard,
    draft,
    fieldErrors,
    formRef,
    handleBlur,
    handleInput,
    handleSubmit,
    saveDraftRef,
    saveState,
  }
}
