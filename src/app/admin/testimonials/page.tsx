import type { Metadata } from 'next'
import Link from 'next/link'
import { TestimonialHeaderActions } from '@/app/admin/testimonials/testimonial-header-actions'
import { TestimonialRetryButton } from '@/app/admin/testimonials/testimonial-retry-button'

import {
  TestimonialAnalytics,
  type AnalyticsPeriod,
  type TestimonialAnalyticsSummary,
  type TestimonialTrendPoint,
} from '@/app/admin/testimonials/testimonial-analytics'
import {
  TestimonialsInbox,
  type CandidateSubmission,
  type ReviewFilter,
  type ReviewStatus,
} from '@/app/admin/testimonials/testimonials-inbox'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canArchive, canPublish, canViewContent } from '@/lib/auth/permissions'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'
import { CandidateTestimonialsLive } from '@/components/ui/candidate-testimonials-live'

export const metadata: Metadata = {
  title: 'Candidate Testimonials | OPG Admin',
}

export const dynamic = 'force-dynamic'

type SubmissionRecord = Omit<
  CandidateSubmission,
  | 'profile_photo_url'
  | 'submitted_at_list_label'
  | 'submitted_at_label'
  | 'reviewed_at_label'
> & {
  profile_photo_path?: string | null
  profile_photo_data?: string | null
}
type AnalyticsRecord = {
  period: string
  submission_count: number | string
  previous_count: number | string
  prospective_count: number | string
  past_count: number | string
  pending_count: number | string
  approved_count: number | string
  rejected_count: number | string
}
type TrendRecord = {
  period: string
  bucket_index: number
  bucket_start: string
  submission_count: number | string | null
}
type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>
}

const PAGE_SIZE = 20
const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected', 'all']
const trendLabelFormats: Record<AnalyticsPeriod, Intl.DateTimeFormat> = {
  week: new Intl.DateTimeFormat('en-SG', {
    weekday: 'short',
    timeZone: 'Asia/Singapore',
  }),
  month: new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    timeZone: 'Asia/Singapore',
  }),
  year: new Intl.DateTimeFormat('en-SG', {
    month: 'short',
    timeZone: 'Asia/Singapore',
  }),
}
const listDateFormat = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Singapore',
})
const detailDateFormat = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Singapore',
})

function reviewUrl(status: ReviewStatus, page = 1) {
  const params = new URLSearchParams()
  if (status !== 'pending') params.set('status', status)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `/admin/testimonials${query ? `?${query}` : ''}`
}

export default async function AdminTestimonialsPage({
  searchParams,
}: PageProps) {
  const { profile } = await requireAdminSession({ requireAal2: true })

  if (!canViewContent(profile.roleKey)) {
    return (
      <section className="admin-page candidate-review-page">
        <div className="container">
          <h1>Candidate testimonials</h1>
          <p>
            Your role does not have permission to view candidate submissions.
          </p>
          <Link href="/admin">Return to dashboard</Link>
        </div>
      </section>
    )
  }

  const requested = await searchParams
  const status: ReviewStatus = STATUSES.includes(
    requested.status as ReviewStatus,
  )
    ? (requested.status as ReviewStatus)
    : 'pending'
  const requestedPage = Number(requested.page)
  const pageNumber =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const supabase = await createClient()
  const [countsResult, analyticsResult, trendResult] = await Promise.all([
    Promise.all(
      (['pending', 'approved', 'rejected'] as const).map((item) =>
        supabase
          .from('candidate_testimonials')
          .select('id', { count: 'exact', head: true })
          .eq('status', item),
      ),
    ),
    supabase.rpc('get_candidate_testimonial_analytics'),
    supabase.rpc('get_candidate_testimonial_trend'),
  ])
  const analytics: TestimonialAnalyticsSummary[] | null = analyticsResult.error
    ? null
    : ((analyticsResult.data ?? []) as AnalyticsRecord[])
        .filter((item) => ['week', 'month', 'year'].includes(item.period))
        .map((item) => ({
          period: item.period as AnalyticsPeriod,
          submissions: Number(item.submission_count),
          previous: Number(item.previous_count),
          prospective: Number(item.prospective_count),
          past: Number(item.past_count),
          pending: Number(item.pending_count),
          approved: Number(item.approved_count),
          rejected: Number(item.rejected_count),
        }))
  const trends: TestimonialTrendPoint[] | null = trendResult.error
    ? null
    : ((trendResult.data ?? []) as TrendRecord[])
        .filter((item) => ['week', 'month', 'year'].includes(item.period))
        .map((item) => ({
          period: item.period as AnalyticsPeriod,
          index: item.bucket_index,
          label: trendLabelFormats[item.period as AnalyticsPeriod].format(
            new Date(item.bucket_start),
          ),
          count:
            item.submission_count === null
              ? null
              : Number(item.submission_count),
        }))
  const countError = countsResult.find((result) => result.error)?.error
  const counts = {
    pending: countsResult[0].count ?? 0,
    approved: countsResult[1].count ?? 0,
    rejected: countsResult[2].count ?? 0,
  }
  const total = counts.pending + counts.approved + counts.rejected
  const activeCount = status === 'all' ? total : counts[status]
  const lastPage = Math.max(1, Math.ceil(activeCount / PAGE_SIZE))
  const page = Math.min(pageNumber, lastPage)
  const filters: ReviewFilter[] = STATUSES.map((value) => ({
    value,
    label:
      value === 'all'
        ? 'All submissions'
        : value[0].toUpperCase() + value.slice(1),
    count: value === 'all' ? total : counts[value],
    href: reviewUrl(value),
  }))

  let submissions: CandidateSubmission[] = []
  let listError = countError
  if (!countError) {
    async function loadSubmissions(photoMode: 'inline' | 'storage' | 'legacy') {
      const columns =
        'id, author_name, email, relationship, role_title, rating, quote, publication_consent, status, submitted_at, reviewed_at'
      const photoColumns =
        photoMode === 'inline'
          ? ', profile_photo_path, profile_photo_data'
          : photoMode === 'storage'
            ? ', profile_photo_path'
            : ''
      let query = supabase
        .from('candidate_testimonials')
        .select(`${columns}${photoColumns}`)
        .order('submitted_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      if (status !== 'all') query = query.eq('status', status)
      return query
    }

    let result = await loadSubmissions('inline')
    if (result.error?.code === '42703')
      result = await loadSubmissions('storage')
    if (result.error?.code === '42703') result = await loadSubmissions('legacy')
    listError = result.error

    const records = (result.data ?? []) as unknown as SubmissionRecord[]
    const paths = records.flatMap((item) =>
      item.profile_photo_path ? [item.profile_photo_path] : [],
    )
    const privileged = paths.length ? createPrivilegedClient() : null
    const signedUrls = new Map<string, string>()
    if (privileged) {
      const { data: signed } = await privileged.storage
        .from('candidate-profile-photos')
        .createSignedUrls(paths, 3600)
      signed?.forEach((item, index) => {
        if (item.signedUrl) signedUrls.set(paths[index], item.signedUrl)
      })
    }
    submissions = records.map((record) => {
      const {
        profile_photo_path: path,
        profile_photo_data: data,
        ...item
      } = record
      return {
        ...item,
        submitted_at_list_label: listDateFormat.format(
          new Date(item.submitted_at),
        ),
        submitted_at_label: detailDateFormat.format(
          new Date(item.submitted_at),
        ),
        reviewed_at_label: item.reviewed_at
          ? detailDateFormat.format(new Date(item.reviewed_at))
          : 'Not reviewed',
        profile_photo_url:
          (path ? signedUrls.get(path) : null) ??
          (data ? `data:image/webp;base64,${data}` : null),
      }
    })
  }

  return (
    <section className="admin-page candidate-review-page">
      <div className="container">
        <CandidateTestimonialsLive audience="admin" showStatus={false} />
        <div className="candidate-review-heading">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="candidate-review-breadcrumbs"
            >
              <Link href="/admin">Admin</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Testimonials</span>
            </nav>
            <h1>Testimonial management</h1>
            <p>
              Track candidate feedback, review incoming stories, and manage
              which testimonials appear on the public website.
            </p>
          </div>
          <TestimonialHeaderActions submissions={submissions} />
        </div>

        <TestimonialAnalytics
          activeStatus={status}
          summaries={analytics}
          trends={trends}
        />

        <div className="candidate-review-table-card">
          <div className="candidate-review-list-heading">
            <div>
              <h2>Submissions</h2>
              <span>
                {listError
                  ? 'Unable to load the selected list'
                  : submissions.length > 0
                    ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + submissions.length} of ${activeCount}`
                    : `No ${status === 'all' ? '' : `${status} `}submissions yet`}
              </span>
            </div>
          </div>
          {listError ? (
            <div className="candidate-review-empty" role="alert">
              <span aria-hidden="true">!</span>
              <h3>Could not load submissions</h3>
              <p>
                The list is temporarily unavailable. Try again to reload it.
              </p>
              <TestimonialRetryButton />
            </div>
          ) : (
            <>
              <TestimonialsInbox
                canDelete={canArchive(profile.roleKey)}
                canReview={canPublish(profile.roleKey)}
                filters={filters}
                key={`${status}:${page}`}
                status={status}
                submissions={submissions}
              />
              {lastPage > 1 && (
                <nav
                  aria-label="Submission pages"
                  className="candidate-review-pagination"
                >
                  {page > 1 ? (
                    <Link href={reviewUrl(status, page - 1)}>← Previous</Link>
                  ) : (
                    <span />
                  )}
                  <span>
                    Page {page} of {lastPage}
                  </span>
                  {page < lastPage ? (
                    <Link href={reviewUrl(status, page + 1)}>Next →</Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
