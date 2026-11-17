'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState, type KeyboardEvent } from 'react'

import styles from './peek-rating.module.css'

export interface PeekRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  labels?: string[]
  showTip?: boolean
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  size?: number
  activeColor?: string
  ariaLabel?: string
  className?: string
}

const DEFAULT_LABELS: Record<number, string> = {
  1: '1 Star · Needs Work',
  2: '2 Stars · Fair',
  3: '3 Stars · Good',
  4: '4 Stars · Great',
  5: '5 Stars · Excellent',
}

export function PeekRating({
  value,
  onChange,
  max = 5,
  labels,
  showTip = true,
  disabled = false,
  readOnly = false,
  allowClear = false,
  size = 22,
  activeColor = '#f59e0b',
  ariaLabel = 'Star Rating',
  className = '',
}: PeekRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [lastClicked, setLastClicked] = useState<number | null>(null)

  const activeRating = hovered !== null ? hovered : value

  function handleSelect(star: number) {
    if (disabled || readOnly) return
    if (allowClear && value === star) {
      setLastClicked(null)
      onChange?.(0)
      return
    }
    setLastClicked(star)
    onChange?.(star)
  }

  function handleKeyDown(e: KeyboardEvent, star: number) {
    if (disabled || readOnly) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(max, (value || 0) + 1)
      handleSelect(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const prev = Math.max(1, (value || 1) - 1)
      handleSelect(prev)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(star)
    }
  }

  function getTooltipText(starNum: number): string {
    if (labels && labels[starNum - 1]) {
      return labels[starNum - 1]
    }
    return DEFAULT_LABELS[starNum] || `${starNum} Stars`
  }

  return (
    <div
      className={`${styles.peekContainer} ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
      onMouseLeave={() => setHovered(null)}
    >
      <div className={styles.starsRow}>
        {Array.from({ length: max }, (_, index) => {
          const starNumber = index + 1
          const isFilled = starNumber <= activeRating
          const isHovered = hovered === starNumber
          const isUnderPointer = hovered !== null && starNumber <= hovered
          const isPopped = lastClicked === starNumber

          return (
            <motion.button
              key={starNumber}
              type="button"
              role="radio"
              aria-checked={value === starNumber}
              aria-label={`${starNumber} of ${max} stars`}
              disabled={disabled || readOnly}
              className={styles.starButton}
              onClick={() => handleSelect(starNumber)}
              onMouseEnter={() => !disabled && !readOnly && setHovered(starNumber)}
              onKeyDown={(e) => handleKeyDown(e, starNumber)}
              animate={{
                y: isUnderPointer ? -5 : 0,
                scale: isPopped ? [1, 1.35, 1] : isHovered ? 1.2 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 20,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`${styles.starIcon} ${
                  isFilled ? styles.starIconFilled : styles.starIconEmpty
                }`}
                style={{
                  width: size,
                  height: size,
                  ...(isFilled && activeColor
                    ? { fill: activeColor, stroke: activeColor }
                    : {}),
                }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>

              {/* Floating Tooltip Tip */}
              <AnimatePresence>
                {showTip && isHovered && (
                  <motion.div
                    className={styles.ratingTip}
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 2, scale: 0.9 }}
                    transition={{ duration: 0.14 }}
                  >
                    {getTooltipText(starNumber)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      <span className={styles.ratingLabelText} aria-hidden="true">
        {activeRating > 0 ? `${activeRating} of ${max} Stars` : 'Rate'}
      </span>
    </div>
  )
}

export default PeekRating
