import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isAdminNotificationSoundEnabled,
  playAdminNotificationSound,
  setAdminNotificationSoundEnabled,
} from './admin-notification-sound'

function createStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    clear: () => store.clear(),
  }
}

describe('admin-notification-sound', () => {
  const storage = createStorageMock()
  let oscillatorStarts: number[] = []
  let contextState: 'running' | 'suspended' | 'closed' = 'running'

  beforeEach(() => {
    storage.clear()
    oscillatorStarts = []
    contextState = 'running'

    const listeners = new Map<string, Set<EventListener>>()
    const windowMock = {
      localStorage: storage,
      addEventListener: (type: string, cb: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set())
        listeners.get(type)?.add(cb)
      },
      removeEventListener: (type: string, cb: EventListener) => {
        listeners.get(type)?.delete(cb)
      },
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((cb) => cb(event))
        return true
      },
      AudioContext: class {
        get state() {
          return contextState
        }
        currentTime = 1
        destination = {}
        resume = vi.fn(async () => {
          contextState = 'running'
        })
        createOscillator = vi.fn(() => ({
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: (when: number) => oscillatorStarts.push(when),
          stop: vi.fn(),
        }))
        createGain = vi.fn(() => ({
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        }))
      },
    }

    vi.stubGlobal('window', windowMock)
    vi.stubGlobal('Event', class {
      type: string
      constructor(type: string) {
        this.type = type
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('defaults sound alerts to enabled and persists mute preferences', () => {
    expect(isAdminNotificationSoundEnabled()).toBe(true)

    setAdminNotificationSoundEnabled(false)
    expect(isAdminNotificationSoundEnabled()).toBe(false)

    setAdminNotificationSoundEnabled(true)
    expect(isAdminNotificationSoundEnabled()).toBe(true)
  })

  it('plays distinct chimes for contact and testimonial notifications and respects mute', async () => {
    const playedContact = await playAdminNotificationSound('contact')
    expect(playedContact).toBe(true)
    expect(oscillatorStarts).toHaveLength(2)

    oscillatorStarts = []
    const playedTestimonial = await playAdminNotificationSound('testimonial')
    expect(playedTestimonial).toBe(true)
    expect(oscillatorStarts).toHaveLength(3)

    oscillatorStarts = []
    const playedReplySuccess = await playAdminNotificationSound('reply_success')
    expect(playedReplySuccess).toBe(true)
    expect(oscillatorStarts).toHaveLength(2)

    oscillatorStarts = []
    const playedReplyError = await playAdminNotificationSound('reply_error')
    expect(playedReplyError).toBe(true)
    expect(oscillatorStarts).toHaveLength(2)

    setAdminNotificationSoundEnabled(false)
    oscillatorStarts = []
    expect(await playAdminNotificationSound('contact')).toBe(false)
    expect(oscillatorStarts).toHaveLength(0)

    expect(
      await playAdminNotificationSound('contact', { force: true }),
    ).toBe(true)
    expect(oscillatorStarts).toHaveLength(2)
  })
})
