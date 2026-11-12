'use client'

import { useEffect, useState } from 'react'

import { PulseHeart } from '@/components/ui/pulse-heart'
import {
  recordArticleViewAction,
  setArticleLikeAction,
} from '@/app/articles/actions'

export type EngagementCounts = {
  like_count: number
  view_count: number
}

const VISITOR_KEY = 'opg.article.visitor'

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(VISITOR_KEY)
  if (existing) return existing

  const visitorId = window.crypto.randomUUID()
  window.localStorage.setItem(VISITOR_KEY, visitorId)
  return visitorId
}

export function ArticleEngagement({
  slug,
  initialCounts,
}: {
  slug: string
  initialCounts?: EngagementCounts
}) {
  const [counts, setCounts] = useState<EngagementCounts>({
    like_count: initialCounts?.like_count ?? 0,
    view_count: initialCounts?.view_count ?? 0,
  })
  const [liked, setLiked] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true

    // Sync persisted like state from local client storage
    queueMicrotask(() => {
      if (!active) return
      const likedKey = `opg.article.liked:${slug}`
      const hasLiked = window.localStorage.getItem(likedKey) === 'true'
      setLiked(hasLiked)
    })

    // Call server action to record view in Supabase backend
    async function recordView() {
      const res = await recordArticleViewAction(slug)
      if (active && res.success) {
        setCounts({
          view_count: res.view_count,
          like_count: res.like_count,
        })
      }
    }

    void recordView()

    return () => {
      active = false
    }
  }, [slug])

  async function handleToggleLike(nextLiked: boolean) {
    if (pending) return

    setPending(true)
    const visitorId = getVisitorId()
    const prevCounts = counts
    const prevLiked = liked

    // Optimistic UI update
    setLiked(nextLiked)
    setCounts((prev) => ({
      ...prev,
      like_count: Math.max(0, prev.like_count + (nextLiked ? 1 : -1)),
    }))

    try {
      const res = await setArticleLikeAction(slug, visitorId, nextLiked)
      if (res.success) {
        setCounts({
          view_count: res.view_count,
          like_count: res.like_count,
        })
        window.localStorage.setItem(`opg.article.liked:${slug}`, String(nextLiked))
      } else {
        // Rollback on server error
        setLiked(prevLiked)
        setCounts(prevCounts)
      }
    } catch {
      setLiked(prevLiked)
      setCounts(prevCounts)
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      aria-label="Article engagement"
      className="article-detail__engagement-panel"
    >
      <div className="article-detail__engagement-stats" aria-live="polite">
        {/* React Bits Pulse Heart Component */}
        <PulseHeart
          className="article-detail__pulse-heart"
          disabled={pending}
          likeCount={counts.like_count}
          liked={liked}
          onToggle={handleToggleLike}
          size={19}
        />

        {/* Real Live Views Display from Supabase Backend */}
        <div
          aria-label={`${counts.view_count.toLocaleString()} views`}
          className="article-detail__view-stat"
          role="status"
          title={`${counts.view_count.toLocaleString()} views`}
        >
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M2.2 12s3.6-6 9.8-6 9.8 6 9.8 6-3.6 6-9.8 6-9.8-6Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
          <strong>{counts.view_count.toLocaleString()}</strong>
        </div>
      </div>
    </section>
  )
}
