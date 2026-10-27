'use client'

import { useState, type CSSProperties } from 'react'

export type AnalyticsPeriod = 'week' | 'month' | 'year'

export type TestimonialAnalyticsSummary = {
  period: AnalyticsPeriod
  submissions: number
  previous: number
  prospective: number
  past: number
  pending: number
  approved: number
  rejected: number
}
export type TestimonialTrendPoint = {
  period: AnalyticsPeriod
  index: number
  label: string
  count: number | null
}

const PERIODS: AnalyticsPeriod[] = ['week', 'month', 'year']
const number = new Intl.NumberFormat('en-SG')

function share(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function comparison(current: number, previous: number) {
  if (current === previous) return { label: 'No change', tone: 'neutral' }
  if (previous === 0) return { label: 'New activity', tone: 'up' }
  const percent = Math.round((Math.abs(current - previous) / previous) * 100)
  return {
    label: `${current > previous ? 'Up' : 'Down'} ${percent}%`,
    tone: current > previous ? 'up' : 'down',
  }
}

function TrendChart({
  points,
  period,
  total,
}: {
  points: TestimonialTrendPoint[] | null
  period: AnalyticsPeriod
  total: number
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  if (!points?.length) {
    return (
      <p className="candidate-review-analytics__trend-empty">
        Submission trend is temporarily unavailable.
      </p>
    )
  }

  const ordered = [...points].sort((a, b) => a.index - b.index)
  const maximum = Math.max(1, ...ordered.map((point) => point.count ?? 0))
  const plotted = ordered
    .filter((point) => point.count !== null)
    .map((point) => ({
      ...point,
      x: 28 + ((point.index + 1) / ordered.length) * 544,
      y: 138 - ((point.count ?? 0) / maximum) * 102,
    }))
  const last = plotted[plotted.length - 1]
  const hoveredPoint = plotted.find((point) => point.index === hoveredIndex)
  let line = plotted.length ? 'M 28 138' : ''
  for (let index = 0; index < plotted.length; index += 1) {
    const previousPoint = plotted[index - 1] ?? { x: 28, y: 138 }
    const point = plotted[index]
    line += ` Q ${previousPoint.x} ${previousPoint.y} ${(previousPoint.x + point.x) / 2} ${(previousPoint.y + point.y) / 2}`
  }
  if (last) {
    line += ` Q ${last.x} ${last.y} ${last.x} ${last.y}`
  }
  const area = last ? `${line} L ${last.x} 138 L 28 138 Z` : ''
  const ticks = [
    ...new Set(
      [0, 0.25, 0.5, 0.75, 1].map((part) =>
        Math.round(part * (ordered.length - 1)),
      ),
    ),
  ]

  return (
    <div className="candidate-review-analytics__trend">
      {hoveredPoint && (
        <div
          className="candidate-review-analytics__trend-tooltip"
          aria-hidden="true"
        >
          <strong>{hoveredPoint.label}</strong>
          <span>{number.format(hoveredPoint.count ?? 0)} submissions</span>
          <small>
            {share(hoveredPoint.count ?? 0, total)}% of this {period}
          </small>
        </div>
      )}
      <svg
        aria-label={`${period} submission trend in Singapore time: ${ordered
          .filter((point) => point.count !== null)
          .map((point) => `${point.label} ${point.count}`)
          .join(', ')}.`}
        className="candidate-review-analytics__trend-graph"
        role="img"
        viewBox="0 0 600 150"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="testimonial-trend-line" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="52%" stopColor="#f29f04" />
            <stop offset="100%" stopColor="#f2b705" />
          </linearGradient>
          <linearGradient
            id="testimonial-trend-fill"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#f29f04" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#f2b705" stopOpacity="0.015" />
          </linearGradient>
          <pattern
            height="7"
            id="testimonial-trend-upcoming"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width="7"
          >
            <line
              stroke="#b9a47d"
              strokeOpacity="0.18"
              x1="0"
              x2="0"
              y1="0"
              y2="7"
            />
          </pattern>
        </defs>
        {[36, 87, 138].map((y) => (
          <line
            className="candidate-review-analytics__trend-grid"
            key={y}
            x1="28"
            x2="572"
            y1={y}
            y2={y}
          />
        ))}
        {last && last.x < 572 && (
          <rect
            fill="url(#testimonial-trend-upcoming)"
            height="114"
            width={572 - last.x}
            x={last.x}
            y="24"
          />
        )}
        {area && <path d={area} fill="url(#testimonial-trend-fill)" />}
        {line && (
          <path
            className="candidate-review-analytics__trend-line"
            d={line}
            stroke="url(#testimonial-trend-line)"
          />
        )}
        {plotted.map((point, index) => (
          <g
            key={point.index}
            onMouseEnter={() => setHoveredIndex(point.index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <circle
              className={
                index === plotted.length - 1
                  ? 'candidate-review-analytics__trend-point is-latest'
                  : 'candidate-review-analytics__trend-point'
              }
              cx={point.x}
              cy={point.y}
              r={index === plotted.length - 1 ? 4.5 : 2.5}
            />
            <circle
              className="candidate-review-analytics__trend-hit"
              cx={point.x}
              cy={point.y}
              r="11"
              fill="transparent"
            >
              <title>{`${point.label}: ${point.count} submissions (${share(point.count ?? 0, total)}% of this ${period})`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div
        className="candidate-review-analytics__trend-axis"
        aria-hidden="true"
      >
        {ticks.map((index) => (
          <span key={index}>{ordered[index].label}</span>
        ))}
      </div>
    </div>
  )
}

export function TestimonialAnalytics({
  summaries,
  trends,
}: {
  summaries: TestimonialAnalyticsSummary[] | null
  trends: TestimonialTrendPoint[] | null
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month')
  const [hoveredKind, setHoveredKind] = useState<'prospective' | 'past' | null>(
    null,
  )
  const selected = summaries?.find((item) => item.period === period)
  const submissions = selected?.submissions ?? 0
  const previous = selected?.previous ?? 0
  const prospective = selected?.prospective ?? 0
  const past = selected?.past ?? 0
  const pending = selected?.pending ?? 0
  const rejected = selected?.rejected ?? 0
  const approved = selected?.approved ?? 0
  const prospectiveShare = share(prospective, submissions)
  const hoveredCount = hoveredKind === 'prospective' ? prospective : past
  const hoveredShare = share(hoveredCount, submissions)
  const change = comparison(submissions, previous)
  const points = trends?.filter((item) => item.period === period) ?? null

  return (
    <section
      className="candidate-review-analytics"
      aria-label="Testimonial analytics"
    >
      <article className="candidate-review-analytics__card candidate-review-analytics__card--activity">
        <div className="candidate-review-analytics__topline">
          <div>
            <span className="candidate-review-analytics__eyebrow">
              Activity
            </span>
            <h2>Testimonial overview</h2>
          </div>
          <div
            className="candidate-review-analytics__periods"
            role="group"
            aria-label="Analytics period"
          >
            {PERIODS.map((item) => (
              <button
                aria-pressed={period === item}
                className={period === item ? 'is-active' : undefined}
                key={item}
                onClick={() => {
                  setPeriod(item)
                  setHoveredKind(null)
                }}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <>
            <div
              className="candidate-review-analytics__headline"
              aria-live="polite"
            >
              <strong>{number.format(submissions)}</strong>
              <span>submitted this {period}</span>
              <span
                className={`candidate-review-analytics__change candidate-review-analytics__change--${change.tone}`}
              >
                {change.label}
              </span>
            </div>
            <TrendChart
              key={period}
              period={period}
              points={points}
              total={submissions}
            />
            <div
              className="candidate-review-analytics__status-strip"
              aria-label="Review status for the selected period"
            >
              {(
                [
                  ['pending', pending],
                  ['approved', approved],
                  ['rejected', rejected],
                ] as const
              ).map(([status, count]) => (
                <div
                  className={`candidate-review-analytics__status-item candidate-review-analytics__status-item--${status}`}
                  key={status}
                >
                  <span>{status}</span>
                  <strong>{number.format(count)}</strong>
                </div>
              ))}
            </div>
            <p className="candidate-review-analytics__note">
              Compared with the same point last {period}. Dates use Singapore
              time.
            </p>
          </>
        ) : (
          <p className="candidate-review-analytics__unavailable" role="status">
            Activity is temporarily unavailable. Submissions can still be
            reviewed below.
          </p>
        )}
      </article>

      <article className="candidate-review-analytics__card candidate-review-analytics__card--connection">
        <span className="candidate-review-analytics__eyebrow">
          Connection with OPG
        </span>
        <h2>Who is sharing?</h2>
        {selected ? (
          <>
            <p className="candidate-review-analytics__connection-intro">
              Candidate mix this {period}, across all review statuses.
            </p>
            <div
              className="candidate-review-analytics__connection-visual"
              key={period}
            >
              <div
                className={`candidate-review-analytics__donut${submissions === 0 ? ' is-empty' : ''}`}
                role="img"
                aria-label={`${prospective} prospective ${prospective === 1 ? 'candidate' : 'candidates'} (${prospectiveShare}%) and ${past} past ${past === 1 ? 'candidate' : 'candidates'} (${share(past, submissions)}%)`}
                onMouseMove={(event) => {
                  if (submissions === 0) return
                  const bounds = event.currentTarget.getBoundingClientRect()
                  const x = event.clientX - bounds.left - bounds.width / 2
                  const y = event.clientY - bounds.top - bounds.height / 2
                  if (Math.hypot(x, y) < bounds.width * 0.32) {
                    setHoveredKind(null)
                    return
                  }
                  const angle = ((Math.atan2(y, x) * 180) / Math.PI + 450) % 360
                  setHoveredKind(
                    angle < (prospective / submissions) * 360
                      ? 'prospective'
                      : 'past',
                  )
                }}
                onMouseLeave={() => setHoveredKind(null)}
                style={
                  {
                    '--prospective-share': `${prospectiveShare}%`,
                  } as CSSProperties
                }
              >
                <div className="candidate-review-analytics__donut-center">
                  <strong>
                    {number.format(hoveredKind ? hoveredCount : submissions)}
                  </strong>
                  <span>{hoveredKind ?? 'stories'}</span>
                  {hoveredKind && <small>{hoveredShare}%</small>}
                </div>
              </div>
              <div
                className="candidate-review-analytics__connection-legend"
                aria-label="Candidate mix"
              >
                {(
                  [
                    ['prospective', 'Prospective', prospective],
                    ['past', 'Past', past],
                  ] as const
                ).map(([kind, label, count]) => (
                  <button
                    className={`candidate-review-analytics__connection-key candidate-review-analytics__connection-key--${kind}`}
                    key={kind}
                    onFocus={() => setHoveredKind(kind)}
                    onBlur={() => setHoveredKind(null)}
                    onMouseEnter={() => setHoveredKind(kind)}
                    onMouseLeave={() => setHoveredKind(null)}
                    type="button"
                    aria-label={`${label}: ${number.format(count)} stories, ${share(count, submissions)}%`}
                  >
                    <span aria-hidden="true" />
                    <span>{label}</span>
                    <strong>{share(count, submissions)}%</strong>
                  </button>
                ))}
              </div>
            </div>
            {submissions === 0 && (
              <p className="candidate-review-analytics__connection-empty">
                No submissions in this period yet.
              </p>
            )}
          </>
        ) : (
          <p className="candidate-review-analytics__unavailable">
            Connection data is temporarily unavailable.
          </p>
        )}
      </article>
    </section>
  )
}
