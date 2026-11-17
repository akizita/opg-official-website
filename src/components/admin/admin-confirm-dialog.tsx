'use client'

import {
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'

import { OpgIconDanger, OpgIconWarning } from '@/components/icons/opg-icons'

import styles from './admin-confirm-dialog.module.css'

export type ConfirmDialogTone = 'danger' | 'warning' | 'primary'

export type AdminConfirmDialogProps = {
  cancelText?: string
  children?: ReactNode
  confirmText?: string
  description?: ReactNode
  disabled?: boolean
  formAction?: (formData: FormData) => void | Promise<void>
  icon?: ReactNode
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void | Promise<void>
  title: string
  tone?: ConfirmDialogTone
}

function DefaultWarningIcon() {
  return <OpgIconWarning size={24} />
}

function DefaultDangerIcon() {
  return <OpgIconDanger size={24} />
}

export function AdminConfirmDialog({
  cancelText = 'Cancel',
  children,
  confirmText = 'Confirm',
  description,
  disabled = false,
  formAction,
  icon,
  isOpen,
  onClose,
  onConfirm,
  title,
  tone = 'warning',
}: AdminConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBusy = disabled || isPending || isSubmitting

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
        // Focus the cancel button to protect against accidental Enter keystrokes
        requestAnimationFrame(() => {
          cancelBtnRef.current?.focus()
        })
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Native ESC key handler
  const handleCancel = (e: SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault()
    if (!isBusy) {
      onClose()
    }
  }

  // Handle backdrop click
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (isBusy) return
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const clickedInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom

    if (!clickedInside) {
      onClose()
    }
  }

  const handleClientConfirm = () => {
    if (isBusy || !onConfirm) return

    startTransition(async () => {
      try {
        await onConfirm()
      } catch (err) {
        console.error('Confirmation action error:', err)
      }
    })
  }

  const handleFormSubmit = () => {
    setIsSubmitting(true)
  }

  if (!isOpen) return null

  const resolvedIcon =
    icon || (tone === 'danger' ? <DefaultDangerIcon /> : <DefaultWarningIcon />)

  const iconToneClass =
    tone === 'danger'
      ? styles.iconDanger
      : tone === 'primary'
        ? styles.iconPrimary
        : styles.iconWarning

  const btnToneClass =
    tone === 'danger'
      ? styles.btnConfirmDanger
      : tone === 'primary'
        ? styles.btnConfirmPrimary
        : styles.btnConfirmWarning

  return (
    <dialog
      aria-describedby={description ? 'admin-confirm-desc' : undefined}
      aria-labelledby="admin-confirm-title"
      aria-modal="true"
      className={styles.dialog}
      onCancel={handleCancel}
      onClick={handleDialogClick}
      ref={dialogRef}
      role="alertdialog"
    >
      <div className={styles.card} ref={cardRef}>
        <div className={`${styles.icon} ${iconToneClass}`}>{resolvedIcon}</div>

        <h2 className={styles.title} id="admin-confirm-title">
          {title}
        </h2>

        {description && (
          <div className={styles.desc} id="admin-confirm-desc">
            {typeof description === 'string' ? <p>{description}</p> : description}
          </div>
        )}

        {children && <div style={{ marginBottom: '1.25rem' }}>{children}</div>}

        <div className={styles.actions}>
          <button
            className={styles.btnCancel}
            disabled={isBusy}
            onClick={onClose}
            ref={cancelBtnRef}
            type="button"
          >
            {cancelText}
          </button>

          {formAction ? (
            <form action={formAction} onSubmit={handleFormSubmit}>
              <button
                className={`${styles.btnConfirm} ${btnToneClass}`}
                disabled={isBusy}
                type="submit"
              >
                {isBusy ? 'Processing…' : confirmText}
              </button>
            </form>
          ) : (
            <button
              className={`${styles.btnConfirm} ${btnToneClass}`}
              disabled={isBusy}
              onClick={handleClientConfirm}
              type="button"
            >
              {isBusy ? 'Processing…' : confirmText}
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}
