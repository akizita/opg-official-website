'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RubberSegment } from '@/components/ui/rubber-segment'

export function TestimonialsTabNavigation({
  candidateCount,
  clientCount,
  activeTab,
}: {
  candidateCount: number
  clientCount: number
  activeTab: 'candidate' | 'client'
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const options = [
    {
      value: 'candidate',
      label: 'Candidate Testimonials',
      badge: candidateCount,
    },
    {
      value: 'client',
      label: 'Client Testimonials',
      badge: clientCount,
    },
  ]

  function handleTabChange(tab: string) {
    if (tab === activeTab) return
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      if (tab === 'client') {
        params.delete('status')
        params.delete('page')
      }
      router.push(`/admin/testimonials?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div style={{ marginBottom: '1.35rem' }}>
      <RubberSegment
        options={options}
        value={activeTab}
        onChange={handleTabChange}
        ariaLabel="Testimonial Categories"
        layoutId="testimonials-main-tab-thumb"
      />
    </div>
  )
}
