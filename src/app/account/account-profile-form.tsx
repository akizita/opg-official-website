'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'

import { AccountAvatar } from '@/components/ui/account-avatar'

import {
  updateVisitorProfileAction,
  type VisitorProfileFormState,
} from './actions'
import styles from './account.module.css'

const initialProfileState: VisitorProfileFormState = {
  status: 'idle',
  message: '',
}

export function AccountProfileForm({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl: string | null
  displayName: string | null
  email: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    updateVisitorProfileAction,
    initialProfileState,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (state.status !== 'success') return
    window.dispatchEvent(new Event('opg:profile-updated'))
    router.refresh()
  }, [router, state])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setPreviewUrl((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous)
      }
      return file ? URL.createObjectURL(file) : null
    })
  }

  return (
    <form action={formAction} className={styles.profileForm}>
      <div className={styles.avatarSection}>
        <span className={styles.avatarCircle}>
          {previewUrl ? (
            <Image
              alt=""
              className={styles.avatarImg}
              height={56}
              src={previewUrl}
              unoptimized
              width={56}
            />
          ) : (
            <AccountAvatar
              avatarUrl={avatarUrl}
              displayName={displayName ?? email}
              email={email}
              size={56}
            />
          )}
        </span>
        <div className={styles.avatarControls}>
          <div className={styles.uploadRow}>
            <label className={styles.uploadButton} htmlFor="account-avatar">
              {previewUrl || avatarUrl ? 'Change photo' : 'Upload photo'}
            </label>
          </div>
          <p className={styles.hintText}>
            PNG, JPG, WebP, or GIF up to 2 MB.
          </p>
        </div>
        <input
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={styles.fileInput}
          id="account-avatar"
          name="avatar"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="account-full-name">
          Full name
        </label>
        <input
          autoComplete="name"
          className={styles.textInput}
          defaultValue={displayName ?? ''}
          id="account-full-name"
          maxLength={80}
          name="fullName"
          placeholder="Your full name"
          type="text"
        />
      </div>

      {state.message && (
        <p
          className={`${styles.statusMessage} ${
            state.status === 'error' ? styles.statusError : styles.statusSuccess
          }`}
          role="status"
        >
          {state.message}
        </p>
      )}

      <div>
        <button
          className="button button--primary"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving profile…' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
