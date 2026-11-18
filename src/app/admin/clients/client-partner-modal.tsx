'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from 'react'

import {
  OpgIconCheck,
  OpgIconChevron,
  OpgIconClose,
  OpgIconPlus,
  OpgIconTrash,
  OpgIconUpload,
} from '@/components/icons/opg-icons'
import {
  SocialPlatformIcon,
  detectSocialPlatform,
  PLATFORM_CONFIG,
} from '@/components/icons/social-platform-icons'
import { RubberSegment, type RubberSegmentOption } from '@/components/ui/rubber-segment'
import type { Client, ClientInput, SocialLinkItem } from '@/lib/content/clients'
import styles from '@/app/admin/clients/clients-admin.module.css'

const LOGO_TAB_OPTIONS: RubberSegmentOption[] = [
  { value: 'url', label: 'URL' },
  { value: 'upload', label: 'Upload a photo' },
]

const SOCIAL_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
  { value: 'discord', label: 'Discord' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'threads', label: 'Threads' },
  { value: 'medium', label: 'Medium' },
  { value: 'custom', label: 'Custom Channel' },
] as const

const QUICK_ADD_PLATFORMS = ['linkedin', 'x', 'facebook', 'instagram', 'youtube', 'github']

function extractInitialSocialLinks(client?: Client | null): SocialLinkItem[] {
  if (client?.social_links && client.social_links.length > 0) {
    return client.social_links.map((s) => ({
      platform: s.platform || 'custom',
      url: s.url || '',
      label: s.label,
    }))
  }

  const list: SocialLinkItem[] = []
  if (client?.linkedin_url) list.push({ platform: 'linkedin', url: client.linkedin_url })
  if (client?.x_url) list.push({ platform: 'x', url: client.x_url })
  if (client?.facebook_url) list.push({ platform: 'facebook', url: client.facebook_url })
  if (client?.instagram_url) list.push({ platform: 'instagram', url: client.instagram_url })
  return list
}

interface SocialPlatformDropdownProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function SocialPlatformDropdown({
  value,
  onChange,
  disabled = false,
}: SocialPlatformDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: PointerEvent | FocusEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('focusin', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('focusin', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const selectedPlatform =
    SOCIAL_PLATFORMS.find((p) => p.value === value) || {
      value,
      label: PLATFORM_CONFIG[value]?.label || value,
    }

  return (
    <div
      className={styles.platformSelectWrap}
      ref={rootRef}
      style={{ zIndex: isOpen ? 50 : 2 }}
    >
      <button
        type="button"
        className={`${styles.platformSelectTrigger} ${
          isOpen ? styles.platformSelectTriggerOpen : ''
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select social media platform"
      >
        <span className={styles.platformSelectIcon}>
          <SocialPlatformIcon platform={value} size={15} />
        </span>
        <span className={styles.platformSelectLabel}>
          {selectedPlatform.label}
        </span>
        <span
          className={`${styles.platformSelectChevron} ${
            isOpen ? styles.platformSelectChevronOpen : ''
          }`}
          aria-hidden="true"
        >
          <OpgIconChevron size={12} />
        </span>
      </button>

      {isOpen && (
        <div className={styles.platformDropdownMenu} role="listbox">
          {SOCIAL_PLATFORMS.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.platformDropdownOption} ${
                  isSelected ? styles.platformDropdownOptionActive : ''
                }`}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
              >
                <span className={styles.platformDropdownOptionIcon}>
                  <SocialPlatformIcon platform={opt.value} size={15} />
                </span>
                <span className={styles.platformDropdownOptionLabel}>
                  {opt.label}
                </span>
                {isSelected && (
                  <span className={styles.platformDropdownOptionCheck}>
                    <OpgIconCheck size={13} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export interface ClientPartnerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: ClientInput) => Promise<boolean>
  initialData?: Client | null
  isPending?: boolean
}

export function ClientPartnerModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
}: ClientPartnerModalProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '')
  const [typeOfCompany, setTypeOfCompany] = useState(initialData?.type_of_company || '')
  const [heroDomain, setHeroDomain] = useState(initialData?.hero_domain || '')
  const [tagline, setTagline] = useState(initialData?.tagline || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [operationalBase, setOperationalBase] = useState(initialData?.operational_base || '')
  const [dedicatedCapability, setDedicatedCapability] = useState(initialData?.dedicated_capability || '')
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url || '')
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>(() =>
    extractInitialSocialLinks(initialData),
  )

  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>(
    initialData?.logo_url?.startsWith('data:') ? 'upload' : 'url',
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image or SVG file.')
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
        setLogoUrl(result)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleAddSocialLink(platform = 'linkedin') {
    setSocialLinks((prev) => [...prev, { platform, url: '' }])
  }

  function handleUpdateSocialLink(index: number, field: 'platform' | 'url', value: string) {
    setSocialLinks((prev) => {
      const next = [...prev]
      if (field === 'url') {
        // Auto-detect platform if user pastes a recognized URL and current platform is custom or empty
        const detected = detectSocialPlatform(value)
        if (detected !== 'custom' && next[index].platform === 'custom') {
          next[index] = { ...next[index], url: value, platform: detected }
          return next
        }
      }
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function handleRemoveSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Company name is required.')
      return
    }

    if (!logoUrl.trim()) {
      setErrorMessage('Company logo is required.')
      return
    }

    const cleanSocial = socialLinks
      .filter((s) => s.url.trim().length > 0)
      .map((s) => ({
        platform: s.platform.trim().toLowerCase(),
        url: s.url.trim(),
        label: s.label?.trim() || undefined,
      }))

    const payload: ClientInput = {
      name: name.trim(),
      logo_url: logoUrl.trim(),
      type_of_company: typeOfCompany.trim() || null,
      hero_domain: heroDomain.trim() || null,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      operational_base: operationalBase.trim() || null,
      dedicated_capability: dedicatedCapability.trim() || null,
      website_url: websiteUrl.trim() || null,
      social_links: cleanSocial.length > 0 ? cleanSocial : null,
      // Backward compatibility columns
      linkedin_url: cleanSocial.find((s) => s.platform === 'linkedin')?.url || null,
      facebook_url: cleanSocial.find((s) => s.platform === 'facebook')?.url || null,
      instagram_url: cleanSocial.find((s) => s.platform === 'instagram')?.url || null,
      x_url: cleanSocial.find((s) => s.platform === 'x' || s.platform === 'twitter')?.url || null,
      display_order: initialData?.display_order ?? 0,
      is_visible: initialData ? initialData.is_visible : true,
      display_permission: true,
    }

    const success = await onSave(payload)
    if (!success) {
      setErrorMessage('Failed to save client partner. Please check inputs.')
    }
  }

  return (
    <motion.div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-partner-modal-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <motion.div
        className={styles.modalContainer}
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 10,
          transition: { duration: 0.16, ease: [0.32, 0, 0.67, 0] },
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <h2 id="client-partner-modal-title" className={styles.modalTitle}>
              {initialData ? 'Edit Client Partner' : 'Add Client Partner'}
            </h2>
            <p className={styles.modalSubtitle}>
              Configure brand identity, hero section badge, and public partner directory profile.
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

        {/* Scrollable Form Body */}
        <div className={styles.modalScrollArea}>
          {errorMessage && (
            <div className={styles.modalAlertError} role="alert">
              {errorMessage}
            </div>
          )}

          <form id="client-partner-form" onSubmit={handleSubmit} className={styles.modalForm}>
            {/* Card 1: Brand & Hero Showcase */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <span className={styles.formCardEyebrow}>Hero &amp; Identity</span>
                <h3 className={styles.formCardTitle}>Company Identity</h3>
              </div>

              <div className={styles.formField}>
                <label htmlFor="partner-name" className={styles.fieldLabel}>
                  Company Name <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="partner-name"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Northstar Labs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              {/* Logo Selection Area with Inlined Compact Tab */}
              <div className={styles.formField}>
                <div className={styles.logoLabelWithTabRow}>
                  <label className={styles.fieldLabel} style={{ margin: 0 }}>
                    Company Logo <span className={styles.requiredStar}>*</span>
                  </label>
                  <div className={styles.compactLogoTabWrap}>
                    <RubberSegment
                      options={LOGO_TAB_OPTIONS}
                      value={logoInputMode}
                      onChange={(val) => setLogoInputMode(val as 'url' | 'upload')}
                      ariaLabel="Company logo input method"
                      layoutId="client-logo-tab-thumb"
                      tone="light"
                    />
                  </div>
                </div>

                <div className={styles.logoFieldWrapper}>

                  {logoInputMode === 'upload' ? (
                    <div className={styles.logoUploadContainer}>
                      {logoUrl && logoUrl.startsWith('data:') ? (
                        <div className={styles.photoPreviewWrapper}>
                          <Image
                            src={logoUrl}
                            alt="Logo preview"
                            width={42}
                            height={42}
                            className={styles.photoThumbnail}
                            unoptimized
                          />
                          <div className={styles.photoPreviewMeta}>
                            <span className={styles.photoReadyBadge}>
                              <OpgIconCheck size={14} /> Photo loaded
                            </span>
                            <label className={styles.reuploadLabel}>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="sr-only"
                                onChange={handleLogoUpload}
                                disabled={isPending}
                              />
                              Replace Photo
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className={styles.uploadBoxFull}>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="sr-only"
                            onChange={handleLogoUpload}
                            disabled={isPending}
                          />
                          <div className={styles.uploadIconWrap}>
                            <OpgIconUpload size={18} />
                          </div>
                          <div>
                            <span className={styles.uploadLead}>Click to upload photo</span>
                            <span className={styles.uploadSub}>PNG, JPG, WebP or SVG (max 2MB)</span>
                          </div>
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className={styles.urlInputWrap}>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="/images/clients/northstar.svg or https://..."
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value.trim())}
                        disabled={isPending}
                      />
                      {logoUrl && (
                        <div className={styles.urlPreviewRow}>
                          <Image
                            src={logoUrl}
                            alt="Logo preview"
                            width={32}
                            height={32}
                            className={styles.photoThumbnailSmall}
                            unoptimized={logoUrl.startsWith('data:') || logoUrl.endsWith('.svg')}
                          />
                          <span className={styles.urlPreviewText}>Logo Loaded</span>
                        </div>
                      )}
                      <p className={styles.fieldHelpText}>
                        Direct URL or path to the partner brand logo.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2-Column Row: Type of Company + Hero Domain */}
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="partner-type" className={styles.fieldLabel}>
                    Type of Company <span className={styles.optionalNote}>(Badge tag)</span>
                  </label>
                  <input
                    id="partner-type"
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Enterprise Software"
                    value={typeOfCompany}
                    onChange={(e) => setTypeOfCompany(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="partner-hero-domain" className={styles.fieldLabel}>
                    Hero Card Domain <span className={styles.optionalNote}>(Card subtitle)</span>
                  </label>
                  <input
                    id="partner-hero-domain"
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Enterprise SaaS"
                    value={heroDomain}
                    onChange={(e) => setHeroDomain(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Operational Profile Details */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <span className={styles.formCardEyebrow}>Directory Profile</span>
                <h3 className={styles.formCardTitle}>Operational Profile</h3>
              </div>

              <div className={styles.formField}>
                <label htmlFor="partner-tagline" className={styles.fieldLabel}>
                  Tagline <span className={styles.optionalNote}>(Directory headline)</span>
                </label>
                <input
                  id="partner-tagline"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="e.g. Cloud-native enterprise workflow intelligence"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="partner-description" className={styles.fieldLabel}>
                  Description <span className={styles.optionalNote}>(Company overview)</span>
                </label>
                <textarea
                  id="partner-description"
                  className={styles.fieldTextarea}
                  placeholder="Describe the company, its focus, and how OPG powers their operational scale..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label htmlFor="partner-base" className={styles.fieldLabel}>
                    Operational Base
                  </label>
                  <input
                    id="partner-base"
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. North America (San Francisco, CA)"
                    value={operationalBase}
                    onChange={(e) => setOperationalBase(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="partner-capability" className={styles.fieldLabel}>
                    Dedicated Capability
                  </label>
                  <input
                    id="partner-capability"
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Full-Stack Engineering &amp; QA Automation Pod"
                    value={dedicatedCapability}
                    onChange={(e) => setDedicatedCapability(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Online Presence & Dynamic Social Channels */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <span className={styles.formCardEyebrow}>Links &amp; Channels</span>
                <h3 className={styles.formCardTitle}>Online Presence</h3>
              </div>

              {/* Primary Website URL */}
              <div className={styles.formField}>
                <label htmlFor="partner-website" className={styles.fieldLabel}>
                  Official Website URL
                </label>
                <div className={styles.inputWithIconWrap}>
                  <span className={styles.inputIconPrefix} aria-hidden="true">
                    <SocialPlatformIcon platform="website" size={16} />
                  </span>
                  <input
                    id="partner-website"
                    type="url"
                    className={`${styles.fieldInput} ${styles.fieldInputWithIcon}`}
                    placeholder="https://company.example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Dynamic Social Media Section */}
              <div className={styles.socialChannelsSection}>
                <div className={styles.socialChannelsHeader}>
                  <div>
                    <span className={styles.fieldLabel} style={{ marginBottom: '0.15rem' }}>
                      Social Media Channels
                    </span>
                    <p className={styles.fieldHelpText}>
                      Connect any platform or profile link. Icons are automatically assigned.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.addSocialChannelBtn}
                    onClick={() => handleAddSocialLink('linkedin')}
                    disabled={isPending}
                  >
                    <OpgIconPlus size={14} /> Add Channel
                  </button>
                </div>

                {/* Quick Add Preset Chips */}
                <div className={styles.quickAddChipsRow}>
                  <span className={styles.quickAddLabel}>Quick add:</span>
                  {QUICK_ADD_PLATFORMS.map((plat) => {
                    const alreadyHas = socialLinks.some((s) => s.platform === plat)
                    return (
                      <button
                        key={plat}
                        type="button"
                        className={`${styles.quickAddChip} ${alreadyHas ? styles.quickAddChipActive : ''}`}
                        onClick={() => handleAddSocialLink(plat)}
                        disabled={isPending || alreadyHas}
                        title={alreadyHas ? `${plat} already added` : `Add ${plat}`}
                      >
                        <SocialPlatformIcon platform={plat} size={13} />
                        <span>{PLATFORM_CONFIG[plat]?.label || plat}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Social Channel Items List */}
                {socialLinks.length === 0 ? (
                  <div className={styles.socialEmptyNotice}>
                    <span>No additional social channels added yet. Click &quot;Add Channel&quot; or use the quick-add chips above.</span>
                  </div>
                ) : (
                  <div className={styles.socialLinksList}>
                    {socialLinks.map((item, index) => {
                      const cfg = PLATFORM_CONFIG[item.platform] || PLATFORM_CONFIG.custom
                      return (
                        <div key={index} className={styles.socialLinkRow}>
                          {/* Custom Pill-shaped Platform Dropdown with Icons & Rounded Selection */}
                          <SocialPlatformDropdown
                            value={item.platform}
                            onChange={(val) =>
                              handleUpdateSocialLink(index, 'platform', val)
                            }
                            disabled={isPending}
                          />

                          {/* URL Input */}
                          <div className={styles.socialUrlInputWrap}>
                            <input
                              type="url"
                              className={styles.fieldInput}
                              placeholder={cfg.placeholder}
                              value={item.url}
                              onChange={(e) =>
                                handleUpdateSocialLink(index, 'url', e.target.value)
                              }
                              disabled={isPending}
                              aria-label={`${cfg.label} URL`}
                            />
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            className={styles.removeSocialBtn}
                            onClick={() => handleRemoveSocialLink(index)}
                            disabled={isPending}
                            title="Remove channel"
                            aria-label={`Remove ${cfg.label} link`}
                          >
                            <OpgIconTrash size={15} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Action Footer */}
        <div className={styles.modalFooter}>
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
            form="client-partner-form"
            className={styles.btnPrimary}
            disabled={isPending}
          >
            {isPending ? 'Saving...' : initialData ? 'Update Client Partner' : 'Save & Publish Partner'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
