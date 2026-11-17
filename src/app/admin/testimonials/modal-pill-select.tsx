'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'

import { OpgIconCheck, OpgIconChevron } from '@/components/icons/opg-icons'
import styles from '@/app/admin/testimonials/testimonials-admin.module.css'

export interface ModalSelectOption {
  value: string
  label: string
  logoUrl?: string | null
  badge?: string
  stars?: number
}

interface ModalPillSelectProps {
  id?: string
  label?: string
  value: string
  options: ModalSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  placement?: 'bottom' | 'top'
  disabled?: boolean
  className?: string
}

export function ModalPillSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  placement = 'bottom',
  disabled = false,
  className,
}: ModalPillSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleSelect(val: string) {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.customSelectWrap} ${className || ''}`}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={label}
        className={styles.customSelectTrigger}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className={styles.customSelectValue}>
          {selectedOption ? (
            <div className={styles.selectOptionRow}>
              {selectedOption.logoUrl && (
                <Image
                  src={selectedOption.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className={styles.selectOptionLogo}
                  unoptimized={
                    selectedOption.logoUrl.startsWith('data:') ||
                    selectedOption.logoUrl.endsWith('.svg')
                  }
                />
              )}
              {selectedOption.stars ? (
                <span className={styles.selectOptionStars} aria-hidden="true">
                  {'★'.repeat(selectedOption.stars)}
                  {'☆'.repeat(5 - selectedOption.stars)}
                </span>
              ) : null}
              <span className={styles.selectOptionName}>
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className={styles.selectOptionBadge}>
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className={styles.selectOptionPlaceholder}>
              {placeholder}
            </span>
          )}
        </div>
        <span
          className={`${styles.selectChevron} ${
            isOpen ? styles.selectChevronOpen : ''
          }`}
          aria-hidden="true"
        >
          <OpgIconChevron size={14} />
        </span>
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="listbox"
          aria-label={label || 'Select an option'}
          className={`${styles.customSelectMenu} ${
            placement === 'top' ? styles.customSelectMenuTop : ''
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.customSelectOption} ${
                  isSelected ? styles.customSelectOptionActive : ''
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                <div className={styles.selectOptionRow}>
                  {opt.logoUrl && (
                    <Image
                      src={opt.logoUrl}
                      alt=""
                      width={20}
                      height={20}
                      className={styles.selectOptionLogo}
                      unoptimized={
                        opt.logoUrl.startsWith('data:') ||
                        opt.logoUrl.endsWith('.svg')
                      }
                    />
                  )}
                  {opt.stars ? (
                    <span className={styles.selectOptionStars} aria-hidden="true">
                      {'★'.repeat(opt.stars)}
                      {'☆'.repeat(5 - opt.stars)}
                    </span>
                  ) : null}
                  <span className={styles.selectOptionName}>{opt.label}</span>
                  {opt.badge && (
                    <span className={styles.selectOptionBadge}>{opt.badge}</span>
                  )}
                </div>
                {isSelected && (
                  <OpgIconCheck size={14} className={styles.selectCheckIcon} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
