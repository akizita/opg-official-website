type PlaceholderSection = {
  slug: string
  title: string
  audience: string
  description: string
}

export const placeholderSections: PlaceholderSection[] = [
  {
    slug: 'cookies',
    title: 'Cookie Notice',
    audience: 'Legal',
    description:
      'The official notice and consent controls are still being prepared.',
  },
]

export function getPlaceholderSection(slug: string) {
  return placeholderSections.find((section) => section.slug === slug)
}
