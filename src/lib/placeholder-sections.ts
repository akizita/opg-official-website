type PlaceholderSection = {
  slug: string
  title: string
  audience: string
  description: string
}

export const placeholderSections: PlaceholderSection[] = [
  {
    slug: 'privacy',
    title: 'Privacy Notice',
    audience: 'Legal',
    description:
      'The official notice must be approved by OPG before publication.',
  },
  {
    slug: 'cookies',
    title: 'Cookie Notice',
    audience: 'Legal',
    description:
      'The official notice and consent controls are still being prepared.',
  },
  {
    slug: 'terms',
    title: 'Terms',
    audience: 'Legal',
    description:
      'The official terms must be approved by OPG before publication.',
  },
]

export function getPlaceholderSection(slug: string) {
  return placeholderSections.find((section) => section.slug === slug)
}
