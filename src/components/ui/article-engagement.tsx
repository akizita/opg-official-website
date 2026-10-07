'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type EngagementCounts = {
  like_count: number
  view_count: number
}

const VISITOR_KEY = 'opg.article.visitor'

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_KEY)
  if (existing) return existing

  const visitorId = window.crypto.randomUUID()
  window.localStorage.setItem(VISITOR_KEY, visitorId)
  return visitorId
}

function toCounts(value: unknown): EngagementCounts | null {
  if (!value || typeof value !== 'object') return null

  const row = value as Record<string, unknown>
  if (
    typeof row.like_count !== 'number' ||
    typeof row.view_count !== 'number'
  ) {
    return null
  }

  return {
    like_count: row.like_count,
    view_count: row.view_count,
  }
}

export function ArticleEngagement({ slug }: { slug: string }) {
  const [counts, setCounts] = useState<EngagementCounts>({
    like_count: 0,
    view_count: 0,
  })
  const [liked, setLiked] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    const likedKey = `opg.article.liked:${slug}`
    const viewedKey = `opg.article.viewed:${slug}`

    async function loadEngagement() {
      const hasLiked = window.localStorage.getItem(likedKey) === 'true'
      const hasViewed = window.sessionStorage.getItem(viewedKey) === 'true'
      const response = hasViewed
        ? await supabase
            .from('article_engagement')
            .select('view_count, like_count')
            .eq('article_slug', slug)
            .maybeSingle()
        : await supabase
            .rpc('record_article_view', { p_article_slug: slug })
            .single()

      if (!hasViewed && !response.error) {
        window.sessionStorage.setItem(viewedKey, 'true')
      }

      const nextCounts = toCounts(response.data)
      if (active) {
        setLiked(hasLiked)
        if (nextCounts) setCounts(nextCounts)
      }
    }

    void loadEngagement()

    return () => {
      active = false
    }
  }, [slug])

  async function handleLike() {
    if (pending) return

    setPending(true)
    const nextLiked = !liked
    const supabase = createClient()
    const { data, error } = await supabase
      .rpc('set_article_like', {
        p_article_slug: slug,
        p_liked: nextLiked,
        p_visitor_id: getVisitorId(),
      })
      .single()

    const nextCounts = toCounts(data)
    if (!error && nextCounts) {
      setCounts(nextCounts)
      setLiked(nextLiked)
      window.localStorage.setItem(
        `opg.article.liked:${slug}`,
        String(nextLiked),
      )
    }

    setPending(false)
  }

  return (
    <section
      aria-label="Article engagement"
      className="article-detail__engagement-panel"
    >
      <div className="article-detail__engagement-stats" aria-live="polite">
        <button
          aria-label={`${liked ? 'Unlike' : 'Like'} this article, ${counts.like_count.toLocaleString()} likes`}
          aria-pressed={liked}
          className={`article-detail__like-button ${liked ? 'article-detail__like-button--active' : ''}`}
          disabled={pending}
          onClick={handleLike}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
          <strong>{counts.like_count.toLocaleString()}</strong>
        </button>

        <div
          aria-label={`${counts.view_count.toLocaleString()} views`}
          className="article-detail__view-stat"
          role="img"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2.2 12s3.6-6 9.8-6 9.8 6 9.8 6-3.6 6-9.8 6-9.8-6-9.8-6Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
          <strong>{counts.view_count.toLocaleString()}</strong>
        </div>
      </div>
    </section>
  )
}
