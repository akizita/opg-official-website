import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SiteAccountMenu } from '@/components/site/site-account-menu'
import { UserAvatar } from '@/components/ui/user-avatar'
import { sanitizeAvatarUrl } from '@/lib/auth/avatar-utils'

describe('UserAvatar & profile avatars', () => {
  it('renders a Google photo with no-referrer and user alt text when src is valid', () => {
    const html = renderToString(
      createElement(UserAvatar, {
        name: 'Aki Zita',
        email: 'aki@example.com',
        size: 36,
        src: 'https://lh3.googleusercontent.com/a/photo-123',
      }),
    )

    expect(html).toContain('referrerPolicy="no-referrer"')
    expect(html).toContain('alt="Aki Zita"')
    expect(html).toContain('https://lh3.googleusercontent.com/a/photo-123')
  })

  it('falls back cleanly to user initials when src is missing or invalid', () => {
    const emptyHtml = renderToString(
      createElement(UserAvatar, {
        name: 'Aki Zita',
        size: 32,
        src: null,
      }),
    )
    const unsafeHtml = renderToString(
      createElement(UserAvatar, {
        name: 'Oliver Reynolds',
        size: 32,
        src: 'javascript:alert(1)',
      }),
    )

    expect(emptyHtml).not.toContain('<img')
    expect(emptyHtml).toContain('AZ')
    expect(unsafeHtml).not.toContain('<img')
    expect(unsafeHtml).toContain('OR')
  })

  it('preserves safe base64 image data URLs while rejecting unsafe protocols', () => {
    expect(
      sanitizeAvatarUrl('data:image/webp;base64,UklGRhIAAABXRUJQVlA4'),
    ).toBe('data:image/webp;base64,UklGRhIAAABXRUJQVlA4')
    expect(sanitizeAvatarUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull()
  })

  it('renders Google photo in SiteAccountMenu and initials when absent', () => {
    const withPhotoHtml = renderToString(
      createElement(SiteAccountMenu, {
        avatarUrl: 'https://lh3.googleusercontent.com/a/top-right-avatar',
        displayName: 'Aki Zita',
        email: 'aki@example.com',
      }),
    )
    const withoutPhotoHtml = renderToString(
      createElement(SiteAccountMenu, {
        avatarUrl: null,
        displayName: 'Aki Zita',
        email: 'aki@example.com',
      }),
    )

    expect(withPhotoHtml).toContain(
      'https://lh3.googleusercontent.com/a/top-right-avatar',
    )
    expect(withPhotoHtml).toContain('alt="Aki Zita"')
    expect(withPhotoHtml).toContain('aki@example.com')
    expect(withoutPhotoHtml).toContain('AZ')
    expect(withoutPhotoHtml).not.toContain('<img')
  })
})
