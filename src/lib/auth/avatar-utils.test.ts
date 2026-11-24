import { describe, expect, it } from 'vitest'

import {
  buildAvatarCandidates,
  extractUserAvatarUrl,
  extractUserDisplayName,
  sanitizeAvatarUrl,
} from './avatar-utils'

describe('avatar-utils', () => {
  it('sanitizes valid http(s) and relative paths while rejecting unsafe schemes', () => {
    expect(sanitizeAvatarUrl(' https://example.com/photo.png ')).toBe(
      'https://example.com/photo.png',
    )
    expect(sanitizeAvatarUrl('/avatars/user.png')).toBe('/avatars/user.png')
    expect(sanitizeAvatarUrl('//evil.example/a.png')).toBeNull()
    expect(sanitizeAvatarUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeAvatarUrl('')).toBeNull()
  })

  it('extracts avatar url from user metadata, claims, or oauth identities', () => {
    expect(
      extractUserAvatarUrl(undefined, {
        user_metadata: { avatar_url: 'https://cdn.example/avatar.jpg' },
      }),
    ).toBe('https://cdn.example/avatar.jpg')

    expect(
      extractUserAvatarUrl(
        { picture: 'https://lh3.googleusercontent.com/photo.jpg' },
        null,
      ),
    ).toBe('https://lh3.googleusercontent.com/photo.jpg')

    expect(
      extractUserAvatarUrl(undefined, {
        identities: [
          {
            identity_data: {
              picture_url: 'https://cdn.example/oauth-avatar.png',
            },
          },
        ],
      }),
    ).toBe('https://cdn.example/oauth-avatar.png')
  })

  it('extracts display name cleanly', () => {
    expect(
      extractUserDisplayName(undefined, {
        identities: [{ identity_data: { full_name: 'Jane Doe' } }],
      }),
    ).toBe('Jane Doe')
  })

  it('builds deduplicated ordered avatar candidates including unavatar email lookups', () => {
    const candidates = buildAvatarCandidates({
      avatarUrl: 'https://cdn.example/custom.png',
      email: 'Recruitment@OPGlobal.com.hk',
      gravatarUrl: 'https://www.gravatar.com/avatar/abc?s=96&d=404',
    })

    expect(candidates).toEqual([
      'https://cdn.example/custom.png',
      'https://www.gravatar.com/avatar/abc?s=96&d=404',
      'https://unavatar.io/recruitment%40opglobal.com.hk?fallback=false',
      'https://unavatar.io/google/recruitment%40opglobal.com.hk?fallback=false',
      'https://unavatar.io/gravatar/recruitment%40opglobal.com.hk?fallback=false',
    ])
  })
})
