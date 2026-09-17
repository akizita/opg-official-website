'use client'

import { type ReactNode, useEffect, useRef } from 'react'

type DialogProps = {
  actions?: ReactNode
  children: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Dialog({
  actions,
  children,
  description,
  isOpen,
  onClose,
  title,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Handle native cancel event (e.g. Esc key)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault()
    onClose()
  }

  // Handle click on backdrop to dismiss
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog) return

    const rect = dialog.getBoundingClientRect()
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width

    if (!isInDialog) {
      onClose()
    }
  }

  return (
    <dialog
      aria-describedby={description ? 'dialog-desc' : undefined}
      aria-labelledby="dialog-title"
      className="dialog-modal"
      onCancel={handleCancel}
      onClick={handleClick}
      ref={dialogRef}
    >
      <div className="dialog-modal__container">
        <header className="dialog-modal__header">
          <h2 id="dialog-title">{title}</h2>
          {description ? (
            <p id="dialog-desc" className="dialog-modal__description">
              {description}
            </p>
          ) : null}
          <button
            aria-label="Close dialog"
            className="dialog-modal__close-btn"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </header>

        <div className="dialog-modal__body">{children}</div>

        {actions ? (
          <footer className="dialog-modal__actions">{actions}</footer>
        ) : null}
      </div>
    </dialog>
  )
}

