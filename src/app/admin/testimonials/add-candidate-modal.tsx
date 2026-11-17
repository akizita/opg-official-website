'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useTransition, type FormEvent, type ChangeEvent } from 'react'

import { createCandidateTestimonialAction } from '@/app/admin/testimonials/actions'
import {
  OpgIconCheck,
  OpgIconClose,
  OpgIconPlus,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import { PeekRating } from '@/components/ui/peek-rating'
import { RubberSegment, type RubberSegmentOption } from '@/components/ui/rubber-segment'
import styles from '@/app/admin/testimonials/testimonials-admin.module.css'

const PHOTO_TAB_OPTIONS: RubberSegmentOption[] = [
  { value: 'upload', label: 'Upload File' },
  { value: 'url', label: 'Image URL' },
]

interface AddCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function AddCandidateTestimonialModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCandidateModalProps) {
  const [authorName, setAuthorName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [quote, setQuote] = useState('')
  const [rating, setRating] = useState(5)
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size must be 2MB or smaller.')
      return
    }

    setErrorMessage(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        setPhotoData(result)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhotoData(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = authorName.trim()
    const trimmedQuote = quote.trim()

    if (trimmedName.length < 2) {
      setErrorMessage('Candidate name must be at least 2 characters.')
      return
    }

    if (trimmedQuote.length < 20) {
      setErrorMessage('Story feedback must be at least 20 characters.')
      return
    }

    startTransition(async () => {
      try {
        const result = await createCandidateTestimonialAction({
          author_name: trimmedName,
          quote: trimmedQuote,
          role_title: roleTitle.trim() || null,
          profile_photo_data: photoData,
          rating,
        })

        if (!result.success) {
          setErrorMessage(result.error || 'Could not save candidate testimonial.')
          return
        }

        // Reset fields
        setAuthorName('')
        setRoleTitle('')
        setQuote('')
        setRating(5)
        setPhotoData(null)
        onSuccess('Candidate testimonial successfully created and published!')
        onClose()
      } catch {
        setErrorMessage('An unexpected error occurred while saving.')
      }
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-candidate-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) onClose()
          }}
        >
          <motion.div
            className={styles.modalContainer}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 12,
              transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] },
            }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 id="add-candidate-modal-title" className={styles.modalTitle}>
                  Add Candidate Testimonial
                </h2>
                <p className={styles.modalSubtitle}>
                  Manually publish candidate stories gathered from external platforms or interviews.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={onClose}
                disabled={isPending}
                aria-label="Close modal"
              >
                <OpgIconClose size={18} />
              </button>
            </div>

            <div className={styles.modalScrollArea}>
              {errorMessage && (
                <div className={styles.modalAlertError} role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.modalForm}>
                {/* Candidate Name & Role */}
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="candidate-name" className={styles.fieldLabel}>
                      Candidate Name <span className={styles.requiredStar}>*</span>
                    </label>
                    <input
                      id="candidate-name"
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. Maria Santos"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      required
                      maxLength={100}
                      disabled={isPending}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="candidate-role" className={styles.fieldLabel}>
                      Placed Role / Title <span className={styles.optionalNote}>(Optional)</span>
                    </label>
                    <input
                      id="candidate-role"
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. Executive Assistant · Placed at SaaS scaleup"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      maxLength={120}
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* Feedback / Quote */}
                <div className={styles.formField}>
                  <div className={styles.labelWithCounter}>
                    <label htmlFor="candidate-quote" className={styles.fieldLabel}>
                      Candidate Feedback / Story <span className={styles.requiredStar}>*</span>
                    </label>
                    <span className={styles.charCounter}>
                      {quote.length}/1,200 chars
                    </span>
                  </div>
                  <textarea
                    id="candidate-quote"
                    className={styles.fieldTextarea}
                    placeholder="Paste or write the candidate's testimonial and experience working with OutPro Global..."
                    rows={4}
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    required
                    minLength={20}
                    maxLength={1200}
                    disabled={isPending}
                  />
                </div>

                {/* Row 1: Candidate Photo (Dedicated Full Row) */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Candidate Photo <span className={styles.optionalNote}>(Optional)</span>
                  </label>
                  <div className={styles.photoUploadArea}>
                    {photoData ? (
                      <div className={styles.photoPreviewWrapper}>
                        <Image
                          src={photoData}
                          alt="Candidate photo preview"
                          width={44}
                          height={44}
                          className={styles.photoThumbnail}
                          unoptimized
                        />
                        <div className={styles.photoPreviewMeta}>
                          <span className={styles.photoReadyBadge}>
                            <OpgIconCheck size={14} /> Photo loaded
                          </span>
                          <button
                            type="button"
                            className={styles.removePhotoBtn}
                            onClick={handleRemovePhoto}
                            disabled={isPending}
                          >
                            Change / Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.photoTabContainer}>
                        <RubberSegment
                          options={PHOTO_TAB_OPTIONS}
                          value={photoInputMode}
                          onChange={(val) => setPhotoInputMode(val as 'upload' | 'url')}
                          ariaLabel="Candidate photo upload method"
                          layoutId="candidate-photo-tab-thumb"
                        />

                        {photoInputMode === 'upload' ? (
                          <label className={styles.uploadBoxFull}>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              onChange={handlePhotoUpload}
                              disabled={isPending}
                            />
                            <div className={styles.uploadIconWrap}>
                              <OpgIconUpload size={20} />
                            </div>
                            <div>
                              <span className={styles.uploadLead}>Click to upload photo</span>
                              <span className={styles.uploadSub}>PNG, JPG or WebP (max 2MB)</span>
                            </div>
                          </label>
                        ) : (
                          <div className={styles.urlInputWrap}>
                            <input
                              type="url"
                              className={styles.fieldInput}
                              placeholder="https://example.com/candidate-photo.jpg"
                              value={photoData || ''}
                              onChange={(e) => setPhotoData(e.target.value.trim() || null)}
                              disabled={isPending}
                            />
                            <p className={styles.fieldHelpText}>
                              Paste a direct image link from LinkedIn, portfolio, or CDN.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Rating (Dedicated Full Row with React Bits PeekRating) */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Star Rating
                  </label>
                  <PeekRating
                    value={rating}
                    onChange={(val) => setRating(val)}
                    disabled={isPending}
                    ariaLabel="Candidate rating"
                  />
                  <p className={styles.fieldHelpText} style={{ marginTop: '0.45rem' }}>
                    External stories are automatically approved and ready for public display.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={onClose}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimaryBlack}
                    disabled={isPending}
                  >
                    {isPending ? (
                      'Publishing Testimonial...'
                    ) : (
                      <>
                        <OpgIconPlus size={16} /> Save &amp; Publish Testimonial
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
