'use client'

import { motion } from 'framer-motion'
import styles from './rubber-segment.module.css'

export interface RubberSegmentOption {
  value: string
  label: string
  badge?: number | string
}

export interface RubberSegmentProps {
  options: RubberSegmentOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  ariaLabel?: string
  layoutId?: string
  tone?: 'dark' | 'light'
}

export function RubberSegment({
  options,
  value,
  onChange,
  className = '',
  ariaLabel = 'Segmented options',
  layoutId = 'rubber-segment-thumb',
  tone = 'dark',
}: RubberSegmentProps) {
  const isLight = tone === 'light'

  return (
    <div
      className={`${styles.rubberContainer} ${isLight ? styles.rubberContainerLight : ''} ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.rubberItem} ${isLight ? styles.rubberItemLight : ''} ${
              isActive ? (isLight ? styles.rubberItemActiveLight : styles.rubberItemActive) : ''
            }`}
            onClick={() => onChange(option.value)}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className={isLight ? styles.rubberThumbLight : styles.rubberThumb}
                transition={{
                  type: 'spring',
                  stiffness: 460,
                  damping: 28,
                  mass: 0.8,
                }}
              />
            )}
            <span className={styles.rubberItemContent}>
              <span>{option.label}</span>
              {option.badge !== undefined && (
                <span
                  className={`${styles.rubberBadge} ${
                    isActive ? styles.rubberBadgeActive : ''
                  }`}
                >
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
