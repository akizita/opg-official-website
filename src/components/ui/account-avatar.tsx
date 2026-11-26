'use client'

import { UserAvatar } from '@/components/ui/user-avatar'

export function AccountAvatar({
  avatarUrl,
  className = '',
  displayName,
  email,
  gravatarUrl,
  imgClassName = '',
  initials,
  initialsClassName = '',
  size = 38,
}: {
  avatarUrl?: string | null
  className?: string
  displayName: string
  email?: string | null
  gravatarUrl?: string | null
  imgClassName?: string
  initials?: string
  initialsClassName?: string
  size?: number
}) {
  return (
    <UserAvatar
      className={className}
      email={email}
      fallbackSrc={gravatarUrl}
      imgClassName={imgClassName}
      initials={initials}
      initialsClassName={initialsClassName}
      name={displayName}
      size={size}
      src={avatarUrl}
    />
  )
}
