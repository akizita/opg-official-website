'use client'

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import styles from './masonry.module.css'

export interface MasonryItem {
  id: string | number
  img: string
  name: string
  role: string
  department?: string
  bio?: string
  height?: number
  width?: number
  alt?: string
}

export interface MasonryProps {
  items: MasonryItem[]
  columns?: number | 'auto'
  gap?: number
  lightbox?: boolean
  showLabels?: boolean
  className?: string
  onItemClick?: (item: MasonryItem) => void
}

// Warm placeholder blur data URL
const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCAxMDAiPjxyZWN0IHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmVkYjMiLz48L3N2Zz4='

export function Masonry({
  items,
  columns = 3,
  lightbox = true,
  showLabels = false,
  className = '',
  onItemClick,
}: MasonryProps) {
  const [activeColumns, setActiveColumns] = useState<number>(
    typeof columns === 'number' ? columns : 3,
  )
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  // Responsive column determination
  useEffect(() => {
    function updateColumns() {
      if (typeof columns === 'number') {
        const w = window.innerWidth
        if (w < 640) {
          setActiveColumns(2)
        } else if (w < 1024) {
          setActiveColumns(Math.min(columns, 2))
        } else {
          setActiveColumns(columns)
        }
      } else {
        const w = window.innerWidth
        if (w < 640) {
          setActiveColumns(2)
        } else if (w < 1024) {
          setActiveColumns(2)
        } else {
          setActiveColumns(3)
        }
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [columns])

  // Distribute items across columns in round-robin order
  const columnData = useMemo(() => {
    const cols: MasonryItem[][] = Array.from({ length: activeColumns }, () => [])
    items.forEach((item, index) => {
      cols[index % activeColumns].push(item)
    })
    return cols
  }, [items, activeColumns])

  // Lightbox navigation
  const openLightbox = useCallback(
    (item: MasonryItem) => {
      const idx = items.findIndex((i) => i.id === item.id)
      if (idx !== -1) {
        setSelectedItemIndex(idx)
      }
      onItemClick?.(item)
    },
    [items, onItemClick],
  )

  const closeLightbox = useCallback(() => {
    setSelectedItemIndex(null)
  }, [])

  const nextLightboxItem = useCallback(() => {
    if (selectedItemIndex !== null) {
      setSelectedItemIndex((prev) => (prev! + 1) % items.length)
    }
  }, [selectedItemIndex, items.length])

  const prevLightboxItem = useCallback(() => {
    if (selectedItemIndex !== null) {
      setSelectedItemIndex(
        (prev) => (prev! - 1 + items.length) % items.length,
      )
    }
  }, [selectedItemIndex, items.length])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (selectedItemIndex === null) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowRight') {
        nextLightboxItem()
      } else if (e.key === 'ArrowLeft') {
        prevLightboxItem()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItemIndex, closeLightbox, nextLightboxItem, prevLightboxItem])

  const activeItem =
    selectedItemIndex !== null ? items[selectedItemIndex] : null

  return (
    <div className={`${styles.masonryContainer} ${className}`.trim()}>
      <div className={styles.masonryGrid}>
        {columnData.map((colItems, colIdx) => (
          <div key={`col-${colIdx}`} className={styles.masonryColumn}>
            {colItems.map((item, itemIdx) => {
              const itemHeight = item.height || 140
              return (
                <motion.div
                  aria-label={`View details for ${item.name}, ${item.role}`}
                  className={styles.masonryCard}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 14 }
                  }
                  key={item.id}
                  onClick={() => (lightbox ? openLightbox(item) : onItemClick?.(item))}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      if (lightbox) openLightbox(item)
                      else onItemClick?.(item)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  transition={{
                    duration: 0.4,
                    delay: itemIdx * 0.05 + colIdx * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  viewport={{ once: true, margin: '-30px' }}
                  whileInView={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0 }
                  }
                >
                  <div
                    className={styles.imageWrapper}
                    style={{ height: `${itemHeight}px` }}
                  >
                    {showLabels && item.department && (
                      <span className={styles.topBadge}>{item.department}</span>
                    )}

                    <Image
                      alt={item.alt || `${item.name} - ${item.role}`}
                      blurDataURL={BLUR_DATA_URL}
                      className={styles.cardImage}
                      fill
                      placeholder="blur"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      src={item.img}
                    />

                    {/* Gradient overlay with Name and Role if showLabels enabled */}
                    {showLabels && (
                      <div className={styles.cardOverlay}>
                        <h4 className={styles.cardName}>{item.name}</h4>
                        <p className={styles.cardRole}>{item.role}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Accessible Interactive Lightbox Modal */}
      {lightbox && activeItem && (
        <div
          aria-label="Image Preview Lightbox"
          aria-modal="true"
          className={styles.lightboxBackdrop}
          onClick={closeLightbox}
          role="dialog"
        >
          <div
            className={styles.lightboxCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close dialog"
              className={styles.lightboxCloseBtn}
              onClick={closeLightbox}
              type="button"
            >
              ✕
            </button>

            {items.length > 1 && (
              <>
                <button
                  aria-label="Previous employee"
                  className={`${styles.lightboxNavBtn} ${styles.lightboxNavPrev}`}
                  onClick={prevLightboxItem}
                  type="button"
                >
                  ‹
                </button>
                <button
                  aria-label="Next employee"
                  className={`${styles.lightboxNavBtn} ${styles.lightboxNavNext}`}
                  onClick={nextLightboxItem}
                  type="button"
                >
                  ›
                </button>
              </>
            )}

            <div className={styles.lightboxImageWrap}>
              <Image
                alt={activeItem.name}
                className={styles.lightboxImage}
                fill
                priority
                src={activeItem.img}
              />
            </div>

            <div className={styles.lightboxContent}>
              {activeItem.department && (
                <span className={styles.lightboxBadge}>
                  {activeItem.department}
                </span>
              )}
              <h3 className={styles.lightboxTitle}>{activeItem.name}</h3>
              <p className={styles.lightboxRole}>{activeItem.role}</p>
              {activeItem.bio && (
                <p className={styles.lightboxBio}>{activeItem.bio}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
