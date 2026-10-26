'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type Audience = 'admin' | 'public'
type Connection = 'connecting' | 'live' | 'offline'

export function CandidateTestimonialsLive({
  audience,
  showStatus = true,
}: {
  audience: Audience
  showStatus?: boolean
}) {
  const router = useRouter()
  const [connection, setConnection] = useState<Connection>('connecting')

  useEffect(() => {
    const supabase = createClient()
    const topic = `candidate-testimonials-${audience}`
    let disposed = false
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let lastRefreshAt = 0
    let needsRefresh = false
    let channel: ReturnType<typeof supabase.channel> | undefined

    function scheduleRefresh() {
      if (disposed) return
      if (document.visibilityState === 'hidden') {
        needsRefresh = true
        return
      }
      if (refreshTimer) return
      refreshTimer = setTimeout(
        () => {
          refreshTimer = undefined
          if (!disposed) {
            lastRefreshAt = Date.now()
            router.refresh()
          }
        },
        Math.max(200, 3000 - (Date.now() - lastRefreshAt)),
      )
    }

    function catchUp() {
      if (document.visibilityState === 'visible') {
        if (needsRefresh) needsRefresh = false
        scheduleRefresh()
      }
    }

    async function subscribe() {
      if (audience === 'admin') {
        const { data, error } = await supabase.auth.getSession()
        if (disposed) return
        if (error || !data.session?.access_token) {
          setConnection('offline')
          return
        }
        await supabase.realtime.setAuth(data.session.access_token)
        if (disposed) return
      }

      channel = supabase
        .channel(topic, { config: { private: audience === 'admin' } })
        .on('broadcast', { event: 'changed' }, scheduleRefresh)
        .subscribe((status) => {
          if (disposed) return
          if (status === 'SUBSCRIBED') {
            setConnection('live')
            scheduleRefresh() // Catch up on changes made before connection.
          } else if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            setConnection('offline')
          }
        })
    }

    void subscribe().catch(() => {
      if (!disposed) setConnection('offline')
    })

    document.addEventListener('visibilitychange', catchUp)
    window.addEventListener('online', catchUp)
    return () => {
      disposed = true
      if (refreshTimer) clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', catchUp)
      window.removeEventListener('online', catchUp)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [audience, router])

  if (!showStatus) return null

  return (
    <span
      className={`candidate-live-status candidate-live-status--${connection}`}
      role="status"
    >
      <i aria-hidden="true" />
      {connection === 'live'
        ? 'Live updates'
        : connection === 'connecting'
          ? 'Connecting…'
          : 'Updates paused'}
    </span>
  )
}
