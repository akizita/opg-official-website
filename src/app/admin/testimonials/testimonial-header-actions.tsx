'use client'

import Link from 'next/link'

import type { CandidateSubmission } from '@/app/admin/testimonials/testimonials-inbox'

function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function TestimonialHeaderActions({
  submissions,
}: {
  submissions: CandidateSubmission[]
}) {
  function exportCsv() {
    const heading = ['Candidate', 'Role / Company', 'Connection', 'Status', 'Submitted (SGT)', 'Story']
    const rows = submissions.map((item) => [
      item.author_name,
      item.role_title ?? '',
      item.relationship,
      item.status,
      item.submitted_at_label,
      item.quote,
    ])
    const csv = `\uFEFF${[heading, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'candidate-testimonials.csv'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <div className="candidate-review-heading__actions">
      <button
        aria-label="Export the loaded submissions as CSV"
        className="candidate-review-heading__export"
        disabled={submissions.length === 0}
        onClick={exportCsv}
        type="button"
      >
        Export CSV
      </button>
      <Link href="/testimonials" rel="noopener noreferrer" target="_blank">
        View public testimonials <span aria-hidden="true">↗</span>
      </Link>
    </div>
  )
}
