'use client'

import { useEffect, useSyncExternalStore } from 'react'

import styles from './brand-loader.module.css'
import { brandLoaderCoordinator } from './loading-coordinator'
import { OpgLogoMark } from './opg-logo-mark'

export function BrandLoaderOverlay() {
  useEffect(() => {
    return brandLoaderCoordinator.registerHost()
  }, [])

  const state = useSyncExternalStore(
    brandLoaderCoordinator.subscribe,
    brandLoaderCoordinator.getSnapshot,
    brandLoaderCoordinator.getServerSnapshot,
  )

  if (!state.visible) {
    return null
  }

  const overlayClass = [
    styles.brandOverlay,
    state.compact ? styles.brandOverlayCompact : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      aria-busy={!state.exiting}
      aria-hidden={state.exiting ? 'true' : undefined}
      aria-live="polite"
      className={overlayClass}
      data-exiting={state.exiting ? 'true' : undefined}
      key={state.cycleId}
      role="status"
    >
      <div className={styles.markFrame} aria-hidden="true">
        <OpgLogoMark
          className={styles.logoSvg}
          fillClassName={styles.logoFill}
          outlineClassName={styles.logoOutline}
          shineClassName={styles.logoShine}
          size={64}
        />
      </div>
      <span className="sr-only">{state.label}</span>
    </div>
  )
}
