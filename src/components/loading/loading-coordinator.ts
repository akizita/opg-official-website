const FLASH_DELAY_MS = 150
const INITIAL_HYDRATION_WINDOW_MS = 400
const MIN_ANIMATION_MS = 2350
const REDUCED_MOTION_MIN_MS = 450
const EXIT_FADE_MS = 250

export interface LoaderOverlaySnapshot {
  visible: boolean
  exiting: boolean
  compact: boolean
  label: string
  cycleId: number
}

const DEFAULT_SNAPSHOT: LoaderOverlaySnapshot = {
  visible: false,
  exiting: false,
  compact: false,
  label: 'Loading page',
  cycleId: 0,
}

class BrandLoaderCoordinator {
  private listeners = new Set<() => void>()
  private hostListeners = new Set<() => void>()
  private activeTokens = new Set<symbol>()
  private hostCount = 0
  private hostMountedAt: number | null = null
  private minHoldDone = false
  private minHoldTimer: ReturnType<typeof setTimeout> | null = null
  private exitTimer: ReturnType<typeof setTimeout> | null = null
  private snapshot: LoaderOverlaySnapshot = DEFAULT_SNAPSHOT

  getDelayMs() {
    if (
      this.hostMountedAt !== null &&
      Date.now() - this.hostMountedAt < INITIAL_HYDRATION_WINDOW_MS
    ) {
      return 0
    }
    return FLASH_DELAY_MS
  }

  hasOverlayHost = () => {
    return this.hostCount > 0
  }

  getServerHasOverlayHost = () => {
    return false
  }

  subscribeHost = (listener: () => void) => {
    this.hostListeners.add(listener)
    return () => {
      this.hostListeners.delete(listener)
    }
  }

  registerHost = () => {
    this.hostCount += 1
    if (this.hostMountedAt === null) {
      this.hostMountedAt = Date.now()
    }
    this.emitHost()
    return () => {
      this.hostCount = Math.max(0, this.hostCount - 1)
      if (this.hostCount === 0) {
        this.hostMountedAt = null
      }
      this.emitHost()
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): LoaderOverlaySnapshot => {
    return this.snapshot
  }

  getServerSnapshot = (): LoaderOverlaySnapshot => {
    return DEFAULT_SNAPSHOT
  }

  acquire(
    token: symbol,
    options?: {
      label?: string
      compact?: boolean
      reducedMotion?: boolean
    },
  ) {
    this.activeTokens.add(token)

    if (this.exitTimer) {
      clearTimeout(this.exitTimer)
      this.exitTimer = null
    }

    const nextLabel = options?.label ?? this.snapshot.label
    const nextCompact = Boolean(options?.compact)

    if (!this.snapshot.visible || this.snapshot.exiting) {
      if (this.minHoldTimer) {
        clearTimeout(this.minHoldTimer)
      }
      this.minHoldDone = false
      const holdMs = options?.reducedMotion
        ? REDUCED_MOTION_MIN_MS
        : MIN_ANIMATION_MS

      this.snapshot = {
        visible: true,
        exiting: false,
        compact: nextCompact,
        label: nextLabel,
        cycleId: this.snapshot.cycleId + 1,
      }
      this.emit()

      this.minHoldTimer = setTimeout(() => {
        this.minHoldTimer = null
        this.minHoldDone = true
        this.maybeStartExit()
      }, holdMs)
      return
    }

    if (
      this.snapshot.label !== nextLabel ||
      this.snapshot.compact !== nextCompact
    ) {
      this.snapshot = {
        ...this.snapshot,
        label: nextLabel,
        compact: nextCompact,
      }
      this.emit()
    }
  }

  release(token: symbol) {
    if (!this.activeTokens.has(token)) return
    this.activeTokens.delete(token)
    this.maybeStartExit()
  }

  resetForTests() {
    this.activeTokens.clear()
    this.hostMountedAt = null
    this.minHoldDone = false
    if (this.minHoldTimer) {
      clearTimeout(this.minHoldTimer)
      this.minHoldTimer = null
    }
    if (this.exitTimer) {
      clearTimeout(this.exitTimer)
      this.exitTimer = null
    }
    this.snapshot = DEFAULT_SNAPSHOT
    this.emit()
  }

  private maybeStartExit() {
    if (
      this.activeTokens.size > 0 ||
      !this.minHoldDone ||
      !this.snapshot.visible ||
      this.snapshot.exiting
    ) {
      return
    }

    this.snapshot = {
      ...this.snapshot,
      exiting: true,
    }
    this.emit()

    this.exitTimer = setTimeout(() => {
      this.exitTimer = null
      if (this.activeTokens.size > 0) return
      this.snapshot = {
        ...this.snapshot,
        visible: false,
        exiting: false,
      }
      this.emit()
    }, EXIT_FADE_MS)
  }

  private emit() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private emitHost() {
    for (const listener of this.hostListeners) {
      listener()
    }
  }
}

export const brandLoaderCoordinator = new BrandLoaderCoordinator()
