'use client'

import Image from 'next/image'
import { useMemo, useState, type CSSProperties } from 'react'

import {
  buildAvatarCandidates,
  deriveAvatarInitials,
} from '@/lib/auth/avatar-utils'

export type UserAvatarProps = {
  alt?: string
  className?: string
  email?: string | null
  fallbackSrc?: string | null
  imgClassName?: string
  initials?: string
  initialsClassName?: string
  name: string
  size?: number
  src?: string | null
  style?: CSSProperties
}

/**
 * Reusable circular avatar component with Google/OAuth URL support (`no-referrer`),
 * multi-candidate fallback, and deterministic initials fallback on empty/broken URLs.
 */
export function UserAvatar({
  alt,
  className = '',
  email,
  fallbackSrc,
  imgClassName = '',
  initials,
  initialsClassName = '',
  name,
  size = 36,
  src,
  style,
}: UserAvatarProps) {
  const candidates = useMemo(
    () =>
      buildAvatarCandidates({
        avatarUrl: src,
        email,
        gravatarUrl: fallbackSrc,
      }),
    [email, fallbackSrc, src],
  )

  const candidateKey = candidates.join('|')
  const [prevKey, setPrevKey] = useState(candidateKey)
  const [attemptIndex, setAttemptIndex] = useState(0)

  if (prevKey !== candidateKey) {
    setPrevKey(candidateKey)
    setAttemptIndex(0)
  }

  const activeSrc = candidates[attemptIndex] ?? null
  const fallbackInitials = initials ?? deriveAvatarInitials(name, email)
  const resolvedAlt = alt ?? (name.trim() || email?.trim() || 'User avatar')

  return (
    <span className={className} style={style}>
      {activeSrc ? (
        <Image
          alt={resolvedAlt}
          className={imgClassName}
          height={size}
          onError={() => setAttemptIndex((prev) => prev + 1)}
          onLoad={(event) => {
            if (event.currentTarget.naturalWidth === 0) {
              setAttemptIndex((prev) => prev + 1)
            }
          }}
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
      ) : (
        <span
          aria-label={resolvedAlt}
          className={initialsClassName}
          style={
            initialsClassName
              ? undefined
              : {
                  alignItems: 'center',
                  display: 'inline-flex',
                  fontSize: `${Math.max(11, Math.round(size * 0.36))}px`,
                  fontWeight: 700,
                  height: '100%',
                  justifyContent: 'center',
                  lineHeight: 1,
                  width: '100%',
                }
          }
        >
          {fallbackInitials}
        </span>
      )}
    </span>
  )
}
