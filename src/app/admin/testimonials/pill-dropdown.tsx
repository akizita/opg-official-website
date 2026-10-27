'use client'

import { useEffect, useId, useRef, useState } from 'react'

type Option = { label: string; value: string }

export function PillDropdown({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Option[]
  value: string
}) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    function closeOutside(event: PointerEvent | FocusEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('focusin', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('focusin', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  function openAndFocus(direction: 'first' | 'last' = 'first') {
    setOpen(true)
    requestAnimationFrame(() => {
      const buttons =
        menuRef.current?.querySelectorAll<HTMLButtonElement>('button')
      const target =
        direction === 'last' ? buttons?.[buttons.length - 1] : buttons?.[0]
      target?.focus()
    })
  }

  return (
    <div className="candidate-review-pill-picker" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${label}: ${selected?.label ?? 'Choose'}`}
        className="candidate-review-pill-picker__trigger"
        onClick={() => (open ? setOpen(false) : openAndFocus())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openAndFocus(event.key === 'ArrowUp' ? 'last' : 'first')
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="candidate-review-pill-picker__copy">
          <small>{label}</small>
          <strong>{selected?.label ?? 'Choose'}</strong>
        </span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div
          aria-label={label}
          className="candidate-review-pill-picker__menu"
          id={menuId}
          onKeyDown={(event) => {
            const buttons = Array.from(
              event.currentTarget.querySelectorAll('button'),
            )
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            )
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              buttons[
                (index +
                  (event.key === 'ArrowDown' ? 1 : -1) +
                  buttons.length) %
                  buttons.length
              ]?.focus()
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              buttons[event.key === 'Home' ? 0 : buttons.length - 1]?.focus()
            }
          }}
          ref={menuRef}
          role="menu"
        >
          {options.map((option) => (
            <button
              aria-checked={value === option.value}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                triggerRef.current?.focus()
              }}
              role="menuitemradio"
              type="button"
            >
              <span>{option.label}</span>
              {value === option.value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
