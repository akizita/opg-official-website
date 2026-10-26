import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { TestimonialReviewControls } from '@/app/admin/testimonials/review-controls'
import { CandidateTestimonialsLive } from '@/components/ui/candidate-testimonials-live'
import { requireAdminSession } from '@/lib/auth/admin-session'
import { canPublish, canViewContent } from '@/lib/auth/permissions'
import { createClient, createPrivilegedClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Candidate Testimonials | OPG Admin',
}

export const dynamic = 'force-dynamic'

type ReviewStatus = 'all' | 'pending' | 'approved' | 'rejected'
type CandidateSubmission = {
  id: string
  author_name: string
  email: string
  relationship: 'prospective' | 'past'
  role_title: string | null
  rating: number | null
  quote: string
  publication_consent: boolean
  status: Exclude<ReviewStatus, 'all'>
  submitted_at: string
  reviewed_at: string | null
  profile_photo_path?: string | null
  profile_photo_data?: string | null
  profile_photo_url?: string | null
}
type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>
}

const PAGE_SIZE = 20
const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected', 'all']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Singapore',
  }).format(new Date(value))
}

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
  const countsResult = await Promise.all(
    (['pending', 'approved', 'rejected'] as const).map((item) =>
      supabase
        .from('candidate_testimonials')
        .select('id', { count: 'exact', head: true })
        .eq('status', item),
    ),
  )
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

  let submissions: CandidateSubmission[] = []
  let listError = countError
  if (!countError) {
    async function loadSubmissions(photoMode: 'inline' | 'storage' | 'legacy') {
      if (photoMode === 'inline') {
        let query = supabase
          .from('candidate_testimonials')
          .select(
            'id, author_name, email, relationship, role_title, rating, quote, publication_consent, status, submitted_at, reviewed_at, profile_photo_path, profile_photo_data',
          )
          .order('submitted_at', { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
        if (status !== 'all') query = query.eq('status', status)
        return query
      }
      if (photoMode === 'storage') {
        let query = supabase
          .from('candidate_testimonials')
          .select(
            'id, author_name, email, relationship, role_title, rating, quote, publication_consent, status, submitted_at, reviewed_at, profile_photo_path',
          )
          .order('submitted_at', { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
        if (status !== 'all') query = query.eq('status', status)
        return query
      }
      let query = supabase
        .from('candidate_testimonials')
        .select(
          'id, author_name, email, relationship, role_title, rating, quote, publication_consent, status, submitted_at, reviewed_at',
        )
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
    submissions = (result.data ?? []) as CandidateSubmission[]
    const paths = submissions.flatMap((item) =>
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
    submissions = submissions.map((item) => ({
      ...item,
      profile_photo_url:
        (item.profile_photo_path
          ? signedUrls.get(item.profile_photo_path)
          : null) ??
        (item.profile_photo_data
          ? `data:image/webp;base64,${item.profile_photo_data}`
          : null),
    }))
  }

  return (
    <section className="admin-page candidate-review-page">
      <div className="container">
        <nav aria-label="Admin Breadcrumb" className="admin-breadcrumb">
          <ol>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Candidate testimonials</li>
          </ol>
        </nav>

        <div className="candidate-review-heading">
          <div>
            <p className="eyebrow">Candidate voices</p>
            <h1>Testimonial management</h1>
            <p>
              Review stories submitted through the website. Approved stories
              appear on the public Testimonials page; rejected stories stay
              private.
            </p>
          </div>
          <div className="candidate-review-heading__actions">
            <CandidateTestimonialsLive audience="admin" />
            <Link className="candidate-review-public-link" href="/testimonials">
              View public page <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <nav
          aria-label="Filter candidate testimonials"
          className="candidate-review-filters"
        >
          {STATUSES.map((item) => {
            const count = item === 'all' ? total : counts[item]
            return (
              <Link
                aria-current={status === item ? 'page' : undefined}
                className="candidate-review-filter"
                href={reviewUrl(item)}
                key={item}
              >
                <span>{item === 'all' ? 'All submissions' : item}</span>
                <strong>{count}</strong>
              </Link>
            )
          })}
        </nav>

        {listError ? (
          <div className="candidate-review-empty" role="alert">
            <h2>Could not load submissions</h2>
            <p>Refresh this page to try again.</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="candidate-review-empty">
            <span aria-hidden="true">“ ”</span>
            <h2>
              {status === 'pending'
                ? 'Review queue is clear'
                : 'No stories here yet'}
            </h2>
            <p>
              {status === 'pending'
                ? 'New candidate testimonials will appear here for review.'
                : 'Submissions matching this filter will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="candidate-review-list-heading">
              <h2>
                {status === 'all' ? 'All submissions' : `${status} stories`}
              </h2>
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {(page - 1) * PAGE_SIZE + submissions.length} of {activeCount}
              </span>
            </div>
            <div className="candidate-review-list">
              {submissions.map((item) => (
                <article
                  className="candidate-review-card"
                  id={`testimonial-${item.id}`}
                  key={item.id}
                >
                  <div className="candidate-review-card__person">
                    <span
                      className="candidate-review-card__avatar"
                      aria-hidden="true"
                    >
                      {item.profile_photo_url ? (
                        <Image
                          alt=""
                          height={48}
                          src={item.profile_photo_url}
                          unoptimized
                          width={48}
                        />
                      ) : (
                        <svg fill="none" viewBox="0 0 40 40" aria-hidden="true">
                          <circle cx="20" cy="15" r="6" fill="currentColor" />
                          <path
                            d="M8 34c0-6.6 5.4-11 12-11s12 4.4 12 11"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </span>
                    <div>
                      <h3>{item.author_name}</h3>
                      <p>
                        {item.relationship === 'past'
                          ? 'Past candidate'
                          : 'Prospective candidate'}
                        {item.role_title ? ` · ${item.role_title}` : ''}
                      </p>
                    </div>
                    <a href={`mailto:${item.email}`}>{item.email}</a>
                  </div>
                  <div className="candidate-review-card__story">
                    <div className="candidate-review-card__meta">
                      <span
                        className={`candidate-review-status candidate-review-status--${item.status}`}
                      >
                        {item.status}
                      </span>
                      <span>Submitted {formatDate(item.submitted_at)}</span>
                      {item.rating !== null && (
                        <span aria-label={`${item.rating} out of 5 stars`}>
                          {'★'.repeat(item.rating)}
                          {'☆'.repeat(5 - item.rating)}
                        </span>
                      )}
                    </div>
                    <blockquote>{item.quote}</blockquote>
                    <div className="candidate-review-card__footer">
                      <p>
                        {item.publication_consent
                          ? 'Publication consent given'
                          : 'Publication consent missing'}
                        {item.reviewed_at
                          ? ` · Reviewed ${formatDate(item.reviewed_at)}`
                          : ''}
                      </p>
                      {item.status === 'pending' &&
                        canPublish(profile.roleKey) &&
                        item.publication_consent && (
                          <TestimonialReviewControls id={item.id} />
                        )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
    </section>
  )
}
