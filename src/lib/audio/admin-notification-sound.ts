'use client'

import { useSyncExternalStore } from 'react'

export type AdminNotificationSoundKind =
  | 'contact'
  | 'testimonial'
  | 'reply_success'
  | 'reply_error'

const SOUND_PREF_KEY = 'opg-admin-sound-enabled'
const SOUND_PREF_EVENT = 'opg-admin-sound-pref-changed'

type ToneSpec = {
  delaySeconds: number
  durationSeconds: number
  frequency: number
  gain: number
}

const CHIME_PATTERNS: Record<AdminNotificationSoundKind, readonly ToneSpec[]> =
  {
    contact: [
      { delaySeconds: 0, durationSeconds: 0.24, frequency: 587.33, gain: 0.14 },
      {
        delaySeconds: 0.11,
        durationSeconds: 0.34,
        frequency: 880,
        gain: 0.16,
      },
    ],
    testimonial: [
      { delaySeconds: 0, durationSeconds: 0.2, frequency: 659.25, gain: 0.13 },
      {
        delaySeconds: 0.1,
        durationSeconds: 0.22,
        frequency: 830.61,
        gain: 0.14,
      },
      {
        delaySeconds: 0.2,
        durationSeconds: 0.36,
        frequency: 987.77,
        gain: 0.15,
      },
    ],
    reply_success: [
      {
        delaySeconds: 0,
        durationSeconds: 0.16,
        frequency: 783.99,
        gain: 0.13,
      },
      {
        delaySeconds: 0.09,
        durationSeconds: 0.32,
        frequency: 1046.5,
        gain: 0.15,
      },
    ],
    reply_error: [
      {
        delaySeconds: 0,
        durationSeconds: 0.18,
        frequency: 349.23,
        gain: 0.14,
      },
      {
        delaySeconds: 0.12,
        durationSeconds: 0.28,
        frequency: 261.63,
        gain: 0.15,
      },
    ],
  }

let sharedAudioContext: AudioContext | null = null

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const win = window as unknown as {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
  }
  return win.AudioContext || win.webkitAudioContext || null
}

function getOrCreateAudioContext(): AudioContext | null {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext
  }
  const Ctor = getAudioContextConstructor()
  if (!Ctor) return null
  try {
    sharedAudioContext = new Ctor()
    return sharedAudioContext
  } catch {
    return null
  }
}

export function isAdminNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) !== 'false'
  } catch {
    return true
  }
}

export function getAdminNotificationSoundPrefServerSnapshot(): boolean {
  return true
}

export function setAdminNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false')
  } catch {
    // Ignore storage access errors in restricted environments
  }
  window.dispatchEvent(new Event(SOUND_PREF_EVENT))
}

export function subscribeAdminNotificationSoundPref(
  onStoreChange: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SOUND_PREF_KEY) {
      onStoreChange()
    }
  }
  window.addEventListener('storage', handleStorage)
  window.addEventListener(SOUND_PREF_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(SOUND_PREF_EVENT, onStoreChange)
  }
}

export function useAdminNotificationSound(): boolean {
  return useSyncExternalStore(
    subscribeAdminNotificationSoundPref,
    isAdminNotificationSoundEnabled,
    getAdminNotificationSoundPrefServerSnapshot,
  )
}

export function unlockAdminAudio(): void {
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {})
  }
}

/**
 * Lazily unlocks the browser Web Audio context on the first user gesture so
 * realtime contact and testimonial alerts play reliably when events arrive.
 */
export function registerAdminAudioUnlock(): () => void {
  if (typeof document === 'undefined') return () => {}

  const unlock = () => {
    unlockAdminAudio()
  }

  document.addEventListener('pointerdown', unlock, { passive: true })
  document.addEventListener('keydown', unlock, { passive: true })

  return () => {
    document.removeEventListener('pointerdown', unlock)
    document.removeEventListener('keydown', unlock)
  }
}

export async function playAdminNotificationSound(
  kind: AdminNotificationSoundKind,
  options?: { force?: boolean },
): Promise<boolean> {
  if (!options?.force && !isAdminNotificationSoundEnabled()) {
    return false
  }

  const ctx = getOrCreateAudioContext()
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    if (ctx.state !== 'running') {
      return false
    }

    const baseTime = ctx.currentTime + 0.01
    for (const tone of CHIME_PATTERNS[kind]) {
      const start = baseTime + tone.delaySeconds
      const end = start + tone.durationSeconds

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(tone.frequency, start)

      gainNode.gain.setValueAtTime(0.0001, start)
      gainNode.gain.exponentialRampToValueAtTime(tone.gain, start + 0.018)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, end)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(start)
      oscillator.stop(end + 0.02)
    }

    return true
  } catch {
    return false
  }
}
