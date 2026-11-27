'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

const TEAM_BROADCAST_CHANNEL = 'opg-team-sync'
const SUPABASE_TEAM_REALTIME_TOPIC = 'team-realtime-sync'

/**
 * Broadcasts team roster mutations across tabs and Supabase Realtime listeners
 * so Home, About, /admin/team, and /admin/articles update without manual refresh.
 */
export function notifyTeamChanged() {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(TEAM_BROADCAST_CHANNEL)
      bc.postMessage({ ts: Date.now() })
      bc.close()
    } catch {
      // BroadcastChannel unavailable
    }
  }

  try {
    const supabase = createClient()
    const channel = supabase.channel(SUPABASE_TEAM_REALTIME_TOPIC)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel
          .send({
            type: 'broadcast',
            event: 'changed',
            payload: { ts: Date.now() },
          })
          .finally(() => {
            void supabase.removeChannel(channel)
          })
      }
    })
  } catch {
    // Ignore transient realtime notification errors
  }
}

export function TeamRealtimeSync({
  onRemoteChange,
}: {
  onRemoteChange?: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let disposed = false
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let bc: BroadcastChannel | null = null

    const triggerRefresh = () => {
      if (disposed) return
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return
      }
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined
        if (disposed) return
        if (onRemoteChange) {
          onRemoteChange()
        } else {
          router.refresh()
        }
      }, 120)
    }

    const handleVisibilityOrFocus = () => {
      if (disposed) return
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return
      }
      triggerRefresh()
    }

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(TEAM_BROADCAST_CHANNEL)
        bc.onmessage = triggerRefresh
      } catch {
        bc = null
      }
    }

    const channel = supabase
      .channel(SUPABASE_TEAM_REALTIME_TOPIC)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        triggerRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        triggerRefresh,
      )
      .on('broadcast', { event: 'changed' }, triggerRefresh)
      .subscribe()

    window.addEventListener('focus', handleVisibilityOrFocus)
    window.addEventListener('online', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)

    return () => {
      disposed = true
      if (refreshTimer) clearTimeout(refreshTimer)
      if (bc) {
        try {
          bc.close()
        } catch {
          // ignore
        }
      }
      window.removeEventListener('focus', handleVisibilityOrFocus)
      window.removeEventListener('online', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      void supabase.removeChannel(channel)
    }
  }, [onRemoteChange, router])

  return null
}
