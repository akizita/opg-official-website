'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

function deriveInitials(displayName: string, email?: string | null) {
  const cleanName = displayName.trim()
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean)
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  const cleanEmail = (email ?? '').trim()
  if (cleanEmail) {
    const localParts = cleanEmail
      .split('@')[0]
      .split(/[._+-]+/)
      .filter(Boolean)
    if (localParts.length > 1) {
      return `${localParts[0][0]}${localParts[localParts.length - 1][0]}`.toUpperCase()
    }
    return (localParts[0] || '?').slice(0, 2).toUpperCase()
  }

  return '?'
}

export function AccountAvatar({
  avatarUrl,
  className = '',
  displayName,
  email,
  imgClassName = '',
  initials,
  initialsClassName = '',
  size = 38,
}: {
  avatarUrl?: string | null
  className?: string
  displayName: string
  email?: string | null
  imgClassName?: string
  initials?: string
  initialsClassName?: string
  size?: number
}) {
  const candidates = useMemo(() => {
    const list: string[] = []
    const trimmed = avatarUrl?.trim()
    if (trimmed) {
      list.push(trimmed)
    }
    const cleanEmail = (email ?? '').trim().toLowerCase()
    if (cleanEmail && cleanEmail.includes('@')) {
      const gravatarUrl = `https://unavatar.io/gravatar/${encodeURIComponent(cleanEmail)}?fallback=false`
      if (!list.includes(gravatarUrl)) {
        list.push(gravatarUrl)
      }
    }
    return list
  }, [avatarUrl, email])

  const candidateKey = candidates.join('|')
  const [prevKey, setPrevKey] = useState(candidateKey)
  const [attemptIndex, setAttemptIndex] = useState(0)

  if (prevKey !== candidateKey) {
    setPrevKey(candidateKey)
    setAttemptIndex(0)
  }

  const activeSrc = candidates[attemptIndex] ?? null
  const fallbackInitials = initials ?? deriveInitials(displayName, email)

  return (
    <span aria-hidden="true" className={className}>
      {activeSrc ? (
        <Image
          alt=""
          className={imgClassName}
          height={size}
          onError={() => setAttemptIndex((prev) => prev + 1)}
          referrerPolicy="no-referrer"
          src={activeSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '9999px',
            display: 'block',
          }}
          unoptimized
          width={size}
        />
      ) : initialsClassName ? (
        <span className={initialsClassName}>{fallbackInitials}</span>
      ) : (
        fallbackInitials
      )}
    </span>
  )
}
