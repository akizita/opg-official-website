'use client'

import { useEffect } from 'react'

import styles from './brand-loader.module.css'
import { brandLoaderCoordinator } from './loading-coordinator'

export interface BrandLoaderProps {
  label?: string
  compact?: boolean
  exiting?: boolean
  className?: string
}

export function BrandLoader({
  label = 'Loading page',
  compact = false,
  className = '',
}: BrandLoaderProps) {
  useEffect(() => {
    // Never compete with the Home page video splash screen
    if (document.documentElement.hasAttribute('data-splash-active')) {
      return
    }

    const token = Symbol('brand-loader')
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const delayMs = brandLoaderCoordinator.getDelayMs()

    if (delayMs === 0) {
      brandLoaderCoordinator.acquire(token, {
        label,
        compact,
        reducedMotion,
      })
      return () => {
        brandLoaderCoordinator.release(token)
      }
    }

    const delayTimer = window.setTimeout(() => {
      if (document.documentElement.hasAttribute('data-splash-active')) {
        return
      }
      brandLoaderCoordinator.acquire(token, {
        label,
        compact,
        reducedMotion,
      })
    }, delayMs)

    return () => {
      window.clearTimeout(delayTimer)
      brandLoaderCoordinator.release(token)
    }
  }, [compact, label])

  const placeholderClass = [
    styles.brandLoaderPlaceholder,
    compact ? styles.brandLoaderCompact : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section aria-busy="true" className={placeholderClass} role="status">
      <span className="sr-only">{label}</span>
    </section>
  )
}
