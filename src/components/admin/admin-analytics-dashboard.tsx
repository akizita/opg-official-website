import Link from 'next/link'
import type { ReactNode } from 'react'

import type { AdminProfile } from '@/lib/auth/admin-session'
import { canViewContent, canViewInquiries } from '@/lib/auth/permissions'
import { CandidateTestimonialsLive } from '@/components/ui/candidate-testimonials-live'
import { featuredArticles } from '@/lib/content/featured-articles'
import { createClient } from '@/lib/supabase/server'

export type AnalyticsPeriod = 'month' | 'week'

type AdminAnalyticsDashboardProps = {
  period: AnalyticsPeriod
  profile: AdminProfile
}

type DailyVisit = {
  visit_count: number
  visit_date: string
}

type DailyArticleEngagement = {
  engagement_date: string
  like_count: number
  view_count: number
}

type ArticleEngagement = {
  article_slug: string
  like_count: number
  view_count: number
}

type ArticleRecord = {
  slug: string
  title: string
}

type InquiryRecord = {
  email: string
  full_name: string
  id: string
  status: string
  subject: string
  submitted_at: string
}

type TestimonialRecord = {
  author_name: string
  id: string
  relationship: 'prospective' | 'past'
  submitted_at: string
}

type MetricIcon = 'contacts' | 'likes' | 'visits' | 'views'

const DAY_IN_MS = 86_400_000

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfUtcMonth(date: Date, offset = 0) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1),
  )
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const controlX = (previous.x + point.x) / 2
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function MetricIconGraphic({ name }: { name: MetricIcon }) {
  const paths: Record<MetricIcon, ReactNode> = {
    visits: (
      <>
        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
        <circle cx="12" cy="12" r="2.6" />
      </>
    ),
    views: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="M7 15V12M12 15V9M17 15v-4" />
      </>
    ),
    likes: (
      <path d="M20.8 8.2c0 5-8.8 10.5-8.8 10.5S3.2 13.2 3.2 8.2A4.2 4.2 0 0 1 12 6.3a4.2 4.2 0 0 1 8.8 1.9Z" />
    ),
    contacts: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
  }

  return (
    <span className="admin-analytics-metric__icon">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {paths[name]}
      </svg>
    </span>
  )
}

function VisitChart({
  data,
}: {
  data: Array<{ label: string; value: number }>
}) {
  const width = 720
  const height = 265
  const leftPadding = 46
  const rightPadding = 20
  const topPadding = 34
  const bottomPadding = 42
  const chartHeight = height - topPadding - bottomPadding
  const chartWidth = width - leftPadding - rightPadding
  const maximum = Math.max(...data.map((point) => point.value), 1)
  const points = data.map((point, index) => {
    const x =
      leftPadding +
      (data.length === 1
        ? chartWidth / 2
        : (index / (data.length - 1)) * chartWidth)
    const y = topPadding + chartHeight - (point.value / maximum) * chartHeight
    return { ...point, x, y }
  })
  const linePath = buildSmoothPath(points)
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? leftPadding} ${topPadding + chartHeight} L ${points[0]?.x ?? leftPadding} ${topPadding + chartHeight} Z`
  const labelStep = Math.max(1, Math.ceil(data.length / 7))
  const peak = data.some((point) => point.value > 0)
    ? points.reduce(
        (highest, point) => (point.value > highest.value ? point : highest),
        points[0]!,
      )
    : null

  return (
    <div className="admin-visit-chart">
      <svg
        aria-label="Website visits over the selected period"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="visitArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f2a204" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#f2a204" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="visitLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#e68f00" />
            <stop offset="100%" stopColor="#ffd65c" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = topPadding + chartHeight * ratio
          return (
            <g key={ratio}>
              <line
                className="admin-visit-chart__grid"
                x1={leftPadding}
                x2={width - rightPadding}
                y1={y}
                y2={y}
              />
              <text
                className="admin-visit-chart__axis"
                textAnchor="end"
                x={leftPadding - 9}
                y={y + 3}
              >
                {Math.round(maximum * (1 - ratio))}
              </text>
            </g>
          )
        })}

        {peak && (
          <line
            className="admin-visit-chart__peak-line"
            x1={peak.x}
            x2={peak.x}
            y1={topPadding - 4}
            y2={topPadding + chartHeight}
          />
        )}
        <path d={areaPath} fill="url(#visitArea)" />
        <path
          className="admin-visit-chart__line"
          d={linePath}
          stroke="url(#visitLine)"
        />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              className="admin-visit-chart__dot-halo"
              cx={point.x}
              cy={point.y}
              r="7"
            />
            <circle
              className="admin-visit-chart__dot"
              cx={point.x}
              cy={point.y}
              r="3.2"
            />
            {(index % labelStep === 0 || index === points.length - 1) && (
              <text
                className="admin-visit-chart__label"
                textAnchor="middle"
                x={point.x}
                y={height - 12}
              >
                {point.label}
              </text>
            )}
            {point === peak && (
              <g className="admin-visit-chart__peak">
                <rect
                  height="24"
                  rx="8"
                  width="48"
                  x={Math.min(Math.max(point.x - 24, 4), width - 52)}
                  y={Math.max(point.y - 34, 1)}
                />
                <text
                  textAnchor="middle"
                  x={Math.min(Math.max(point.x, 28), width - 28)}
                  y={Math.max(point.y - 18, 17)}
                >
                  {point.value}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

export async function AdminAnalyticsDashboard({
  period,
  profile,
}: AdminAnalyticsDashboardProps) {
  const canReadContent = canViewContent(profile.roleKey)
  const canReadInquiries = canViewInquiries(profile.roleKey)
  const supabase = await createClient()
  const now = new Date()
  const currentMonthStart = startOfUtcMonth(now)
  const previousMonthStart = startOfUtcMonth(now, -1)
  const periodDays = period === 'week' ? 7 : 30
  const chartStart = new Date(now.getTime() - (periodDays - 1) * DAY_IN_MS)

  const [
    visitResult,
    dailyEngagementResult,
    articleEngagementResult,
    articlesResult,
    inquiryAnalyticsResult,
    recentInquiriesResult,
    testimonialsResult,
  ] = await Promise.all([
    canReadContent
      ? supabase
          .from('site_visit_daily')
          .select('visit_date, visit_count')
          .order('visit_date', { ascending: true })
      : Promise.resolve({ data: [] }),
    canReadContent
      ? supabase
          .from('article_engagement_daily')
          .select('engagement_date, view_count, like_count')
          .gte('engagement_date', toDateKey(previousMonthStart))
      : Promise.resolve({ data: [] }),
    canReadContent
      ? supabase
          .from('article_engagement')
          .select('article_slug, view_count, like_count')
      : Promise.resolve({ data: [] }),
    canReadContent
      ? supabase.from('articles').select('slug, title')
      : Promise.resolve({ data: [] }),
    canReadInquiries
      ? supabase
          .from('contact_inquiries')
          .select('submitted_at')
          .gte('submitted_at', previousMonthStart.toISOString())
      : Promise.resolve({ data: [] }),
    canReadInquiries
      ? supabase
          .from('contact_inquiries')
          .select('id, full_name, email, subject, status, submitted_at')
          .eq('status', 'new')
          .order('submitted_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    canReadContent
      ? supabase
          .from('candidate_testimonials')
          .select('id, author_name, relationship, submitted_at')
          .eq('status', 'pending')
          .order('submitted_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ])

  const visits = (visitResult.data ?? []) as DailyVisit[]
  const dailyEngagement = (dailyEngagementResult.data ??
    []) as DailyArticleEngagement[]
  const articleEngagement = (articleEngagementResult.data ??
    []) as ArticleEngagement[]
  const databaseArticles = (articlesResult.data ?? []) as ArticleRecord[]
  const inquiryAnalytics = (inquiryAnalyticsResult.data ?? []) as Array<{
    submitted_at: string
  }>
  const recentInquiries = (recentInquiriesResult.data ?? []) as InquiryRecord[]
  const testimonials = (testimonialsResult.data ?? []) as TestimonialRecord[]

  const totalVisits = visits.reduce((total, row) => total + row.visit_count, 0)
  const currentMonthKey = toDateKey(currentMonthStart)
  const monthlyViews = dailyEngagement
    .filter((row) => row.engagement_date >= currentMonthKey)
    .reduce((total, row) => total + row.view_count, 0)
  const monthlyLikes = dailyEngagement
    .filter((row) => row.engagement_date >= currentMonthKey)
    .reduce((total, row) => total + row.like_count, 0)
  const monthlyInquiries = inquiryAnalytics.filter(
    (row) => row.submitted_at >= currentMonthStart.toISOString(),
  ).length

  const visitsByDate = new Map(
    visits.map((row) => [row.visit_date, row.visit_count]),
  )
  const visitSeries = Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(chartStart.getTime() + index * DAY_IN_MS)
    const key = toDateKey(date)
    return {
      label: new Intl.DateTimeFormat('en-SG', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }).format(date),
      value: visitsByDate.get(key) ?? 0,
    }
  })

  const titleBySlug = new Map<string, string>()
  featuredArticles.forEach((article) =>
    titleBySlug.set(article.slug, article.title),
  )
  databaseArticles.forEach((article) =>
    titleBySlug.set(article.slug, article.title),
  )
  articleEngagement.forEach((engagement) => {
    if (!titleBySlug.has(engagement.article_slug)) {
      titleBySlug.set(engagement.article_slug, engagement.article_slug)
    }
  })

  const engagementBySlug = new Map(
    articleEngagement.map((row) => [row.article_slug, row]),
  )
  const articleAnalytics = Array.from(titleBySlug, ([slug, title]) => {
    const engagement = engagementBySlug.get(slug)
    return {
      likes: engagement?.like_count ?? 0,
      slug,
      title,
      views: engagement?.view_count ?? 0,
    }
  }).sort(
    (left, right) => right.views + right.likes - (left.views + left.likes),
  )
  const maximumArticleValue = Math.max(
    ...articleAnalytics.flatMap((article) => [article.views, article.likes]),
    1,
  )

  const monthlyLabel = new Intl.DateTimeFormat('en-SG', {
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <section className="admin-page admin-analytics">
      <div className="admin-analytics__aurora" aria-hidden="true" />
      <div className="admin-analytics__inner">
        <header className="admin-analytics__welcome">
          <div>
            <p>Overview</p>
            <h1>Good day, {profile.displayName}</h1>
            <span>Here is what is happening across the OPG website.</span>
          </div>
          <time dateTime={now.toISOString()}>{monthlyLabel}</time>
        </header>

        <section
          className="admin-analytics__metrics"
          aria-label="Monthly overview"
        >
          <article className="admin-analytics-metric">
            <MetricIconGraphic name="visits" />
            <span>Website visits</span>
            <strong>{formatCompact(totalVisits)}</strong>
            <small>All-time first-party sessions</small>
          </article>
          <article className="admin-analytics-metric">
            <MetricIconGraphic name="views" />
            <span>Article views</span>
            <strong>{formatCompact(monthlyViews)}</strong>
            <small>Views during {monthlyLabel}</small>
          </article>
          <article className="admin-analytics-metric">
            <MetricIconGraphic name="likes" />
            <span>Article likes</span>
            <strong>{formatCompact(monthlyLikes)}</strong>
            <small>New likes during {monthlyLabel}</small>
          </article>
          <article className="admin-analytics-metric admin-analytics-metric--gold">
            <MetricIconGraphic name="contacts" />
            <span>Contacts & inquiries</span>
            <strong>{formatCompact(monthlyInquiries)}</strong>
            <small>Received during {monthlyLabel}</small>
          </article>
        </section>

        <section className="admin-analytics__charts">
          <article className="admin-glass-panel admin-analytics__visits-panel">
            <header className="admin-analytics__panel-heading">
              <div>
                <p>Traffic analytics</p>
                <h2>Website visits</h2>
                <span>
                  {period === 'week' ? 'Last 7 days' : 'Last 30 days'} ·{' '}
                  {visitSeries.reduce((total, point) => total + point.value, 0)}{' '}
                  visits
                </span>
              </div>
              <nav aria-label="Website analytics period">
                <Link
                  aria-current={period === 'week' ? 'page' : undefined}
                  href="/admin?period=week"
                  scroll={false}
                >
                  Week
                </Link>
                <Link
                  aria-current={period === 'month' ? 'page' : undefined}
                  href="/admin?period=month"
                  scroll={false}
                >
                  Month
                </Link>
              </nav>
            </header>
            <VisitChart data={visitSeries} />
          </article>

          <article className="admin-glass-panel admin-analytics__articles-panel">
            <header className="admin-analytics__panel-heading">
              <div>
                <p>Content performance</p>
                <h2>Article comparison</h2>
                <span>Lifetime first-party engagement</span>
              </div>
              <span className="admin-analytics__legend">
                <i /> Views <i /> Likes
              </span>
            </header>

            <div className="admin-article-analytics">
              {articleAnalytics.length > 0 ? (
                articleAnalytics.map((article) => (
                  <div
                    className="admin-article-analytics__row"
                    key={article.slug}
                  >
                    <Link href={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                    <div className="admin-article-analytics__bars">
                      <span>
                        <i
                          style={{
                            width: `${(article.views / maximumArticleValue) * 100}%`,
                          }}
                        />
                        <b>{article.views.toLocaleString()}</b>
                      </span>
                      <span>
                        <i
                          style={{
                            width: `${(article.likes / maximumArticleValue) * 100}%`,
                          }}
                        />
                        <b>{article.likes.toLocaleString()}</b>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-analytics__empty">
                  Article engagement will appear after publication.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="admin-review-grid" aria-label="Review queues">
          <article className="admin-glass-panel admin-review-card">
            <header className="admin-review-card__heading">
              <div>
                <span className="admin-review-card__icon admin-review-card__icon--inbox">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <rect height="14" rx="2" width="18" x="3" y="5" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </span>
                <div>
                  <p>Communications</p>
                  <h2>Inbox</h2>
                </div>
              </div>
              {canReadInquiries && (
                <Link href="/admin/inquiries">View all</Link>
              )}
            </header>

            <div className="admin-review-card__list">
              {recentInquiries.length > 0 ? (
                recentInquiries.map((inquiry) => (
                  <Link
                    className="admin-review-card__item"
                    href={`/admin/inquiries/${inquiry.id}`}
                    key={inquiry.id}
                  >
                    <span className="admin-review-card__avatar">
                      {inquiry.full_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="admin-review-card__copy">
                      <strong>{inquiry.subject}</strong>
                      <small>{inquiry.full_name}</small>
                    </span>
                    <span className="admin-review-card__meta">
                      <time dateTime={inquiry.submitted_at}>
                        {formatReviewDate(inquiry.submitted_at)}
                      </time>
                      <i>{inquiry.status}</i>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="admin-review-card__empty">
                  <strong>Inbox clear</strong>
                  <span>New contact submissions will appear here.</span>
                </div>
              )}
            </div>
          </article>

          <article className="admin-glass-panel admin-review-card">
            <header className="admin-review-card__heading">
              <div>
                <span className="admin-review-card__icon admin-review-card__icon--testimonial">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M7 10h4v4H7zM13 10h4v4h-4z" />
                    <path d="M5 5h14v14H5z" />
                  </svg>
                </span>
                <div>
                  <p>Social proof</p>
                  <h2>Testimonials</h2>
                </div>
              </div>
              {canReadContent && (
                <Link href="/admin/testimonials">View all</Link>
              )}
            </header>

            <div className="admin-review-card__list">
              {canReadContent && (
                <CandidateTestimonialsLive
                  audience="admin"
                  showStatus={false}
                />
              )}
              {testimonials.length > 0 ? (
                testimonials.map((testimonial) => (
                  <Link
                    className="admin-review-card__item"
                    href={`/admin/testimonials?status=pending#testimonial-${testimonial.id}`}
                    key={testimonial.id}
                  >
                    <span className="admin-review-card__avatar admin-review-card__avatar--gold">
                      {testimonial.author_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="admin-review-card__copy">
                      <strong>{testimonial.author_name}</strong>
                      <small>
                        {testimonial.relationship === 'past'
                          ? 'Past candidate'
                          : 'Prospective candidate'}
                      </small>
                    </span>
                    <span className="admin-review-card__meta">
                      <time dateTime={testimonial.submitted_at}>
                        {formatReviewDate(testimonial.submitted_at)}
                      </time>
                      <i>Pending</i>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="admin-review-card__empty">
                  <strong>No pending reviews</strong>
                  <span>Submitted testimonials will appear here.</span>
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </section>
  )
}
