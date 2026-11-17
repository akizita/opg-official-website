'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OpgIconPlus } from '@/components/icons/opg-icons'
import { AddCandidateTestimonialModal } from '@/app/admin/testimonials/add-candidate-modal'
import styles from '@/app/admin/testimonials/testimonials-admin.module.css'

export function CandidateTestimonialsHeader({ canAdd }: { canAdd: boolean }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <>
      <div className={styles.pageHeaderRow}>
        <div className={styles.pageHeaderCopy}>
          <h1 className={styles.pageTitle}>Candidate Testimonials</h1>
          <p className={styles.pageSubtitle}>
            Review incoming stories submitted through the candidate testimonials
            page, approve or reject submissions, or manually add stories from
            external sources.
          </p>
        </div>
        {canAdd && (
          <button
            type="button"
            className={styles.headerActionBtn}
            onClick={() => setIsOpen(true)}
          >
            <OpgIconPlus size={15} /> Add Candidate Testimonial
          </button>
        )}
      </div>

      <AddCandidateTestimonialModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(msg) => {
          setToast(msg)
          setTimeout(() => setToast(null), 4000)
          router.refresh()
        }}
      />
      {toast && (
        <div className={styles.toastNotification} role="status">
          {toast}
        </div>
      )}
    </>
  )
}
