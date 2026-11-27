'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

const ARTICLES_BROADCAST_CHANNEL = 'opg-articles-sync'
const SUPABASE_REALTIME_TOPIC = 'articles-realtime-sync'

/**
 * Broadcasts an article mutation to other open browser tabs and Supabase Realtime listeners
 * so /articles, /articles/[slug], and /admin/articles update without manual refresh.
 */
export function notifyArticlesChanged(slug?: string) {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(ARTICLES_BROADCAST_CHANNEL)
      bc.postMessage({ slug: slug || null, ts: Date.now() })
      bc.close()
    } catch {
      // BroadcastChannel unsupported or closed
    }
  }

  try {
    const supabase = createClient()
    const channel = supabase.channel(SUPABASE_REALTIME_TOPIC)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel
          .send({
            type: 'broadcast',
            event: 'changed',
            payload: { slug: slug || null },
          })
          .finally(() => {
            void supabase.removeChannel(channel)
          })
      }
    })
  } catch {
    // Ignore transient realtime notification failures
  }
}

export function ArticlesRealtimeSync({
  onRemoteChange,
  slugFilter,
}: {
  onRemoteChange?: () => void
  slugFilter?: string
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
        bc = new BroadcastChannel(ARTICLES_BROADCAST_CHANNEL)
        bc.onmessage = (event: MessageEvent<{ slug?: string | null }>) => {
          const eventSlug = event.data?.slug
          if (!slugFilter || !eventSlug || eventSlug === slugFilter) {
            triggerRefresh()
          }
        }
      } catch {
        bc = null
      }
    }

    const channel = supabase
      .channel(`${SUPABASE_REALTIME_TOPIC}-${slugFilter || 'all'}`)
      .on(
        'postgres_changes',
        slugFilter
          ? {
              event: '*',
              schema: 'public',
              table: 'articles',
              filter: `slug=eq.${slugFilter}`,
            }
          : { event: '*', schema: 'public', table: 'articles' },
        triggerRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        triggerRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'authors' },
        triggerRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'article_category_mappings' },
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
  }, [onRemoteChange, router, slugFilter])

  return null
}
