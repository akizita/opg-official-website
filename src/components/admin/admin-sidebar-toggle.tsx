'use client'

import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'opg-admin-sidebar-collapsed'
const CHANGE_EVENT = 'opg-admin-sidebar-change'
const COMPACT_QUERY = '(max-width: 70rem)'
let currentPreference: boolean | null = null

function getPreference() {
  if (currentPreference !== null) return currentPreference
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved !== null) return saved === 'true'
  } catch {
    // Use the responsive default when browser storage is unavailable.
  }
  return window.matchMedia(COMPACT_QUERY).matches
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(COMPACT_QUERY)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    currentPreference = null
    onChange()
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  media.addEventListener('change', onChange)

  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
    media.removeEventListener('change', onChange)
  }
}

export function AdminSidebarToggle() {
  const collapsed = useSyncExternalStore(subscribe, getPreference, () => null)

  const toggle = () => {
    const next = !getPreference()
    currentPreference = next
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // Keep the current page responsive even when storage is unavailable.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <button
      aria-label={
        collapsed === null
          ? 'Toggle sidebar'
          : collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
      }
      aria-pressed={collapsed ?? undefined}
      className="admin-shell__collapse-toggle"
      onClick={toggle}
      title={
        collapsed === null
          ? 'Toggle sidebar'
          : collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
      }
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <path d="M9 4v16" />
        <path d={collapsed ? 'm14 9 3 3-3 3' : 'm16 9-3 3 3 3'} />
      </svg>
    </button>
  )
}
