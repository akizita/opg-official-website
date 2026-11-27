'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useState,
  useTransition,
  useMemo,
  type FormEvent,
  type ChangeEvent,
} from 'react'

import {
  createClientTestimonialAction,
  updateClientTestimonialAction,
  deleteClientTestimonialAction,
} from '@/app/admin/testimonials/client-actions'
import {
  ModalPillSelect,
  type ModalSelectOption,
} from '@/app/admin/testimonials/modal-pill-select'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconCheck,
  OpgIconClose,
  OpgIconEdit,
  OpgIconPlus,
  OpgIconSearch,
  OpgIconTrash,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import { ClientsRealtimeSync } from '@/components/ui/clients-realtime-sync'
import { PeekRating } from '@/components/ui/peek-rating'
import { RubberSegment, type RubberSegmentOption } from '@/components/ui/rubber-segment'
import type { Client, Testimonial } from '@/lib/content/clients'
import styles from '@/app/admin/testimonials/testimonials-admin.module.css'

const PHOTO_TAB_OPTIONS: RubberSegmentOption[] = [
  { value: 'upload', label: 'Upload File' },
  { value: 'url', label: 'Image URL' },
]

interface ClientTestimonialsManagerProps {
  testimonials: Testimonial[]
  clients: Client[]
  canManage: boolean
  canDelete: boolean
}

interface TestimonialFormData {
  id?: string
  client_id: string
  custom_company: string
  headline: string
  quote: string
  author_name: string
  author_role: string
  photo_url: string
  rating: number
  display_order: number
}

const DEFAULT_FORM: TestimonialFormData = {
  client_id: '',
  custom_company: '',
  headline: '',
  quote: '',
  author_name: '',
  author_role: '',
  photo_url: '',
  rating: 5,
  display_order: 0,
}

type ClientFilterType = 'all' | 'with-photo' | 'partners'

export function ClientTestimonialsManager({
  testimonials,
  clients,
  canManage,
  canDelete,
}: ClientTestimonialsManagerProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ClientFilterType>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null)
  const [formData, setFormData] = useState<TestimonialFormData>(DEFAULT_FORM)
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload')
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Dropdown options with rounded corners and rich metadata
  const companyOptions: ModalSelectOption[] = useMemo(() => {
    const opts: ModalSelectOption[] = [
      {
        value: '',
        label: '-- Custom / Other Company --',
      },
    ]
    clients.forEach((c) => {
      const resolvedLogo =
        c.logo_url ||
        (c.name.toLowerCase().includes('northstar')
          ? '/images/clients/northstar.svg'
          : c.name.toLowerCase().includes('meridian')
            ? '/images/clients/meridian.svg'
            : c.name.toLowerCase().includes('harborline')
              ? '/images/clients/harborline.svg'
              : c.name.toLowerCase().includes('atlas')
                ? '/images/clients/atlas.svg'
                : c.name.toLowerCase().includes('veridian')
                  ? '/images/clients/veridian.svg'
                  : null)
      opts.push({
        value: c.id,
        label: c.name,
        logoUrl: resolvedLogo,
        badge: 'Partner',
      })
    })
    return opts
  }, [clients])

  // Filtered testimonials
  const filtered = useMemo(() => {
    return testimonials.filter((t) => {
      if (activeFilter === 'with-photo' && !t.photo_url) return false
      if (activeFilter === 'partners' && !t.client_id) return false
      if (!search.trim()) return true
      const query = search.toLowerCase()
      const company = (t.client?.name || t.author_company || '').toLowerCase()
      const author = (t.author_name || '').toLowerCase()
      const headline = (t.headline || '').toLowerCase()
      const quote = (t.quote || '').toLowerCase()
      return (
        company.includes(query) ||
        author.includes(query) ||
        headline.includes(query) ||
        quote.includes(query)
      )
    })
  }, [testimonials, search, activeFilter])

  // KPIs (Drafts removed -> 3 clean metrics)
  const stats = useMemo(() => {
    const total = testimonials.length
    const withPhoto = testimonials.filter((t) => Boolean(t.photo_url)).length
    const partnerLinked = testimonials.filter((t) => Boolean(t.client_id)).length
    const uniqueClients = new Set(
      testimonials
        .map((t) => t.client_id || t.author_company)
        .filter(Boolean),
    ).size
    return { total, withPhoto, partnerLinked, uniqueClients }
  }, [testimonials])

  const filterOptions: RubberSegmentOption[] = useMemo(
    () => [
      { value: 'all', label: 'All', badge: stats.total },
      { value: 'with-photo', label: 'With Photo', badge: stats.withPhoto },
      { value: 'partners', label: 'Partner Companies', badge: stats.partnerLinked },
    ],
    [stats.total, stats.withPhoto, stats.partnerLinked],
  )

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  function openAddModal() {
    setEditingItem(null)
    setFormData({
      ...DEFAULT_FORM,
      client_id: clients[0]?.id || '',
    })
    setPhotoInputMode('upload')
    setErrorMessage(null)
    setModalOpen(true)
  }

  function openEditModal(item: Testimonial) {
    setEditingItem(item)
    setFormData({
      id: item.id,
      client_id: item.client_id || '',
      custom_company: !item.client_id ? item.author_company || '' : '',
      headline: item.headline || '',
      quote: item.quote || '',
      author_name: item.author_name || '',
      author_role: item.author_role || '',
      photo_url: item.photo_url || '',
      rating: item.rating ?? 5,
      display_order: item.display_order ?? 0,
    })
    setPhotoInputMode(item.photo_url?.startsWith('data:') ? 'upload' : 'url')
    setErrorMessage(null)
    setModalOpen(true)
  }

  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file.')
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
        setFormData((prev) => ({ ...prev, photo_url: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.quote.trim()) {
      setErrorMessage('Feedback quote is required.')
      return
    }

    if (!formData.author_name.trim()) {
      setErrorMessage('Author name is required.')
      return
    }

    if (!formData.author_role.trim()) {
      setErrorMessage('Author position is required.')
      return
    }

    const payload = {
      client_id: formData.client_id || null,
      author_company: !formData.client_id ? formData.custom_company.trim() || null : null,
      headline: formData.headline.trim() || null,
      quote: formData.quote.trim(),
      author_name: formData.author_name.trim(),
      author_role: formData.author_role.trim(),
      photo_url: formData.photo_url.trim() || null,
      rating: formData.rating,
      status: 'published' as const,
      display_order: formData.display_order,
    }

    startTransition(async () => {
      try {
        if (editingItem) {
          const res = await updateClientTestimonialAction(editingItem.id, payload)
          if (!res.success) {
            setErrorMessage(res.error || 'Failed to update testimonial.')
            return
          }
          showToast('Client testimonial updated successfully.')
        } else {
          const res = await createClientTestimonialAction(payload)
          if (!res.success) {
            setErrorMessage(res.error || 'Failed to create testimonial.')
            return
          }
          showToast('Client testimonial created and published!')
        }

        setModalOpen(false)
        router.refresh()
      } catch {
        setErrorMessage('An unexpected error occurred while saving.')
      }
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        const res = await deleteClientTestimonialAction(deleteTarget.id)
        if (!res.success) {
          showToast(res.error || 'Could not delete testimonial.')
          return
        }
        showToast('Client testimonial deleted.')
        setDeleteTarget(null)
        router.refresh()
      } catch {
        showToast('An error occurred during deletion.')
      }
    })
  }

  // Selected client preview
  const selectedClient = clients.find((c) => c.id === formData.client_id)

  return (
    <div className={styles.clientManagerWrapper}>
      <ClientsRealtimeSync />
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification} role="status">
          <OpgIconCheck size={16} /> {toastMessage}
        </div>
      )}

      {/* Header with Inlined Action Button */}
      <div className={styles.pageHeaderRow}>
        <div className={styles.pageHeaderCopy}>
          <h1 className={styles.pageTitle}>Client Testimonials</h1>
          <p className={styles.pageSubtitle}>
            Manage executive partner endorsements and client testimonials
            displayed on the public /clients page carousel.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className={styles.headerActionBtn}
            onClick={openAddModal}
          >
            <OpgIconPlus size={15} /> Add Client Testimonial
          </button>
        )}
      </div>

      {/* Analytics KPI Row: 3 See-Through Glassmorphic Cards (Drafts removed) */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Client Endorsements</span>
          <span className={styles.kpiValue}>{stats.total}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active on Website</span>
          <span className={`${styles.kpiValue} ${styles.kpiValueSuccess}`}>
            {stats.total}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Partner Companies</span>
          <span className={styles.kpiValue}>{stats.uniqueClients}</span>
        </div>
      </div>

      {/* Toolbar: Search & React Bits Rubber Segment Filter */}
      <div className={styles.managerToolbar}>
        <div className={styles.searchWrap}>
          <OpgIconSearch size={18} />
          <input
            type="search"
            placeholder="Search company, author, title, or feedback…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <RubberSegment
            options={filterOptions}
            value={activeFilter}
            onChange={(val) => setActiveFilter(val as ClientFilterType)}
            ariaLabel="Client Testimonials Filter"
            layoutId="client-testimonials-filter-tab-thumb"
          />
        </div>
      </div>

      {/* Table of Client Testimonials: See-Through Glassmorphism */}
      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">✦</span>
            <h3>No client testimonials found</h3>
            <p>
              {testimonials.length === 0
                ? 'No client testimonials have been created yet. Click "Add Client Testimonial" to create one.'
                : 'No testimonials matched your search or category filter.'}
            </p>
            {(search || activeFilter !== 'all') && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  setSearch('')
                  setActiveFilter('all')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '25%' }}>Company</th>
                  <th scope="col" style={{ width: '45%' }}>Title &amp; Feedback</th>
                  <th scope="col" style={{ width: '22%' }}>Author</th>
                  {(canManage || canDelete) && (
                    <th scope="col" style={{ width: '8%', textAlign: 'right' }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const companyName = item.client?.name || item.author_company || 'Partner Enterprise'
                  const resolvedLogo =
                    item.client?.logo_url ||
                    (companyName.toLowerCase().includes('northstar')
                      ? '/images/clients/northstar.svg'
                      : companyName.toLowerCase().includes('meridian')
                        ? '/images/clients/meridian.svg'
                        : companyName.toLowerCase().includes('harborline')
                          ? '/images/clients/harborline.svg'
                          : companyName.toLowerCase().includes('atlas')
                            ? '/images/clients/atlas.svg'
                            : companyName.toLowerCase().includes('veridian')
                              ? '/images/clients/veridian.svg'
                              : null)

                  return (
                    <tr key={item.id} className={styles.tableRow}>
                      {/* Company Logo + Name */}
                      <td>
                        <div className={styles.companyCell}>
                          <div className={styles.companyLogoThumb}>
                            {resolvedLogo ? (
                              <Image
                                src={resolvedLogo}
                                alt={companyName}
                                width={28}
                                height={28}
                                className={styles.companyLogoImg}
                                unoptimized={resolvedLogo.startsWith('data:') || resolvedLogo.endsWith('.svg')}
                              />
                            ) : (
                              <span className={styles.companyInitials}>
                                {companyName.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className={styles.companyNameText}>{companyName}</span>
                        </div>
                      </td>

                      {/* Headline & Feedback */}
                      <td>
                        <div className={styles.quoteCell}>
                          {item.headline && (
                            <h4 className={styles.quoteHeadline}>{item.headline}</h4>
                          )}
                          <p className={styles.quoteBody}>&ldquo;{item.quote}&rdquo;</p>
                        </div>
                      </td>

                      {/* Author */}
                      <td>
                        <div className={styles.authorCell}>
                          {item.photo_url ? (
                            <Image
                              src={item.photo_url}
                              alt={item.author_name}
                              width={36}
                              height={36}
                              className={styles.authorAvatar}
                              unoptimized={item.photo_url.startsWith('data:') || item.photo_url.startsWith('/')}
                            />
                          ) : (
                            <span className={styles.authorAvatarPlaceholder}>
                              {item.author_name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <span className={styles.authorName}>{item.author_name}</span>
                            <span className={styles.authorRole}>{item.author_role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      {(canManage || canDelete) && (
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actionButtonsRow}>
                            {canManage && (
                              <button
                                type="button"
                                className={styles.actionIconBtn}
                                onClick={() => openEditModal(item)}
                                title="Edit testimonial"
                                aria-label={`Edit ${item.author_name} testimonial`}
                              >
                                <OpgIconEdit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                                onClick={() => setDeleteTarget(item)}
                                title="Delete testimonial"
                                aria-label={`Delete ${item.author_name} testimonial`}
                              >
                                <OpgIconTrash size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-testimonial-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isPending) setModalOpen(false)
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
                  <h2 id="client-testimonial-modal-title" className={styles.modalTitle}>
                    {editingItem ? 'Edit Client Testimonial' : 'Add Client Testimonial'}
                  </h2>
                  <p className={styles.modalSubtitle}>
                    Configure executive testimonials displayed on the public /clients page carousel.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseButton}
                  onClick={() => setModalOpen(false)}
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
                  {/* Company Selection Dropdown */}
                  <div className={styles.formField}>
                    <label htmlFor="client-company-select" className={styles.fieldLabel}>
                      Company (Client Organization) <span className={styles.requiredStar}>*</span>
                    </label>
                    <ModalPillSelect
                      id="client-company-select"
                      label="Select Company"
                      value={formData.client_id}
                      options={companyOptions}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_id: val,
                          custom_company: val ? '' : prev.custom_company,
                        }))
                      }
                      placement="bottom"
                      disabled={isPending}
                    />

                    {/* Company Preview Card if client selected */}
                    {selectedClient && (
                      <div className={styles.clientSelectedPreview}>
                        {selectedClient.logo_url && (
                          <Image
                            src={selectedClient.logo_url}
                            alt={selectedClient.name}
                            width={22}
                            height={22}
                            className={styles.clientPreviewLogo}
                            unoptimized={selectedClient.logo_url.startsWith('data:') || selectedClient.logo_url.endsWith('.svg')}
                          />
                        )}
                        <span className={styles.clientPreviewName}>{selectedClient.name}</span>
                        <span className={styles.clientPreviewTag}>Linked to client record</span>
                      </div>
                    )}

                    {/* Custom company text input if no client_id selected */}
                    {!formData.client_id && (
                      <div style={{ marginTop: '0.45rem' }}>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          placeholder="Enter company name (e.g. Northstar Labs)"
                          value={formData.custom_company}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              custom_company: e.target.value,
                            }))
                          }
                          disabled={isPending}
                        />
                      </div>
                    )}
                  </div>

                  {/* Testimonial Title (Headline) */}
                  <div className={styles.formField}>
                    <label htmlFor="client-headline" className={styles.fieldLabel}>
                      Testimonial Title <span className={styles.optionalNote}>(Displayed prominently on carousel)</span>
                    </label>
                    <input
                      id="client-headline"
                      type="text"
                      className={styles.fieldInput}
                      placeholder="e.g. Slashing Fintech OpEx & Model Backlog by 48%"
                      value={formData.headline}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          headline: e.target.value,
                        }))
                      }
                      maxLength={160}
                      disabled={isPending}
                    />
                  </div>

                  {/* Feedback Quote */}
                  <div className={styles.formField}>
                    <div className={styles.labelWithCounter}>
                      <label htmlFor="client-quote" className={styles.fieldLabel}>
                        Feedback / Endorsement Quote <span className={styles.requiredStar}>*</span>
                      </label>
                      <span className={styles.charCounter}>
                        {formData.quote.length} chars
                      </span>
                    </div>
                    <textarea
                      id="client-quote"
                      className={styles.fieldTextarea}
                      placeholder="The executive endorsement text describing the pod's impact, caliber, and results..."
                      rows={4}
                      value={formData.quote}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quote: e.target.value,
                        }))
                      }
                      required
                      disabled={isPending}
                    />
                  </div>

                  {/* Author Name and Position */}
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label htmlFor="client-author-name" className={styles.fieldLabel}>
                        Author Name <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        id="client-author-name"
                        type="text"
                        className={styles.fieldInput}
                        placeholder="e.g. Alistair Finch, CFA"
                        value={formData.author_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            author_name: e.target.value,
                          }))
                        }
                        required
                        disabled={isPending}
                      />
                    </div>

                    <div className={styles.formField}>
                      <label htmlFor="client-author-role" className={styles.fieldLabel}>
                        Position / Role <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        id="client-author-role"
                        type="text"
                        className={styles.fieldInput}
                        placeholder="e.g. Head of Quantitative Risk"
                        value={formData.author_role}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            author_role: e.target.value,
                          }))
                        }
                        required
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* Author Photo with React Bits RubberSegment Tab */}
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      Author Photo <span className={styles.optionalNote}>(Displayed on carousel card)</span>
                    </label>
                    <div className={styles.photoUploadArea}>
                      {formData.photo_url ? (
                        <div className={styles.photoPreviewWrapper}>
                          <Image
                            src={formData.photo_url}
                            alt="Author preview"
                            width={44}
                            height={44}
                            className={styles.photoThumbnail}
                            unoptimized={formData.photo_url.startsWith('data:') || formData.photo_url.startsWith('/')}
                          />
                          <div className={styles.photoPreviewMeta}>
                            <span className={styles.photoReadyBadge}>
                              <OpgIconCheck size={14} /> Photo loaded
                            </span>
                            <button
                              type="button"
                              className={styles.removePhotoBtn}
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, photo_url: '' }))
                              }
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
                            ariaLabel="Author photo upload method"
                            layoutId="client-photo-tab-thumb"
                            tone="light"
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
                                placeholder="https://example.com/executive-headshot.jpg"
                                value={formData.photo_url}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    photo_url: e.target.value.trim(),
                                  }))
                                }
                                disabled={isPending}
                              />
                              <p className={styles.fieldHelpText}>
                                Paste a direct link to the executive headshot or partner portrait.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Star Rating with React Bits PeekRating (Display order removed as requested) */}
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      Star Rating
                    </label>
                    <PeekRating
                      value={formData.rating}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          rating: val,
                        }))
                      }
                      disabled={isPending}
                      ariaLabel="Client testimonial star rating"
                    />
                  </div>

                  {/* Modal Actions */}
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setModalOpen(false)}
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
                        'Saving...'
                      ) : (
                        <>
                          <OpgIconCheck size={16} />{' '}
                          {editingItem ? 'Save Changes' : 'Publish Client Testimonial'}
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

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <AdminConfirmDialog
          isOpen={true}
          title="Delete Client Testimonial?"
          description={`Are you sure you want to delete the endorsement by "${deleteTarget.author_name}" (${deleteTarget.client?.name || deleteTarget.author_company || 'Client Partner'})? This action cannot be undone.`}
          confirmText={isPending ? 'Deleting...' : 'Delete Testimonial'}
          cancelText="Cancel"
          tone="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
