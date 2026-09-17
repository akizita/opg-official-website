type PlaceholderSection = {
  slug: string
  title: string
  audience: string
  description: string
}

export const placeholderSections: PlaceholderSection[] = [
  {
    slug: 'about',
    title: 'About OPG',
    audience: 'Company',
    description: 'Company background and mission content is awaiting approval.',
  },
  {
    slug: 'services',
    title: 'Services',
    audience: 'Organizations',
    description: 'The approved service list and detail pages will appear here.',
  },
  {
    slug: 'clients',
    title: 'Clients',
    audience: 'Organizations',
    description: 'Client stories and display permissions are being prepared.',
  },
  {
    slug: 'careers',
    title: 'Careers',
    audience: 'Talent',
    description:
      'Open roles and the approved external application channel will appear here.',
  },
  {
    slug: 'articles',
    title: 'Articles',
    audience: 'Resources',
    description: 'Published articles, categories, and tags will appear here.',
  },
  {
    slug: 'faqs',
    title: 'FAQs',
    audience: 'Resources',
    description: 'Approved answers to common questions will appear here.',
  },
  {
    slug: 'search',
    title: 'Search',
    audience: 'Resources',
    description:
      'Search becomes available after published content is connected.',
  },
  {
    slug: 'contact',
    title: 'Contact OPG',
    audience: 'Organizations',
    description:
      'The inquiry form is pending privacy approval and abuse-control setup.',
  },
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
