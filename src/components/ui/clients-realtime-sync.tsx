'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

const CLIENTS_BROADCAST_CHANNEL = 'opg-clients-sync'
const SUPABASE_CLIENTS_REALTIME_TOPIC = 'clients-realtime-sync'

/**
 * Broadcasts client roster mutations across tabs and Supabase Realtime listeners
 * so /clients, /admin/clients, and /admin/testimonials update without manual refresh.
 */
export function notifyClientsChanged() {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(CLIENTS_BROADCAST_CHANNEL)
      bc.postMessage({ ts: Date.now() })
      bc.close()
    } catch {
      // BroadcastChannel unavailable
    }
  }

  try {
    const supabase = createClient()
    const channel = supabase.channel(SUPABASE_CLIENTS_REALTIME_TOPIC)
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

export function ClientsRealtimeSync({
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
        bc = new BroadcastChannel(CLIENTS_BROADCAST_CHANNEL)
        bc.onmessage = triggerRefresh
      } catch {
        bc = null
      }
    }

    const channel = supabase
      .channel(SUPABASE_CLIENTS_REALTIME_TOPIC)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
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
      window.removeEventListener('focus', handleVisibilityOrFocus)
      window.removeEventListener('online', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      if (bc) {
        try {
          bc.close()
        } catch {
          // Ignore close error
        }
      }
      void supabase.removeChannel(channel)
    }
  }, [router, onRemoteChange])

  return null
}
