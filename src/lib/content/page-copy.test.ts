import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  ABOUT_COPY_SECTIONS,
  ARTICLES_COPY_SECTIONS,
  CAREERS_COPY_SECTIONS,
  CLIENTS_COPY_SECTIONS,
  CONTACT_COPY_SECTIONS,
  HOME_COPY_SECTIONS,
  getPageCopy,
  pageCopyBlocks,
} from '@/lib/content/page-copy'

const pages = [
  { name: 'home', sections: HOME_COPY_SECTIONS, files: ['src/app/page.tsx'] },
  {
    name: 'about',
    sections: ABOUT_COPY_SECTIONS,
    files: [
      'src/app/about/page.tsx',
      'src/components/ui/about-services-section.tsx',
      'src/components/ui/mission-vision-section.tsx',
      'src/components/ui/about-team-showcase.tsx',
      'src/components/ui/about-cta-card.tsx',
    ],
  },
  {
    name: 'clients',
    sections: CLIENTS_COPY_SECTIONS,
    files: [
      'src/app/clients/page.tsx',
      'src/components/ui/clients-globe-hero.tsx',
      'src/components/ui/clients-partner-profiles.tsx',
    ],
  },
  {
    name: 'careers',
    sections: CAREERS_COPY_SECTIONS,
    files: ['src/app/careers/page.tsx'],
  },
  {
    name: 'articles',
    sections: ARTICLES_COPY_SECTIONS,
    files: ['src/app/articles/page.tsx'],
  },
  {
    name: 'contact',
    sections: CONTACT_COPY_SECTIONS,
    files: ['src/app/contact/page.tsx', 'src/app/contact/contact-form.tsx'],
  },
]

describe('marketing page copy contracts', () => {
  it.each(pages)(
    '$name has one field per rendered copy key',
    ({ sections, files }) => {
      const keys = sections.flatMap((section) =>
        section.fields.map((field) => field.key),
      )
      expect(new Set(keys).size).toBe(keys.length)
      const referenced = files.flatMap((file) => {
        const source = readFileSync(resolve(process.cwd(), file), 'utf8')
        return [...source.matchAll(/\bcopy\??\.([A-Za-z]\w*)/g)].map(
          (match) => match[1],
        )
      })
      for (const key of referenced) {
        expect(keys, `Missing CMS field for copy.${key}`).toContain(key)
      }
    },
  )

  it.each(pages)(
    '$name copy survives a document round trip',
    ({ sections }) => {
      const defaults = getPageCopy([], sections)
      expect(Object.values(defaults).every(Boolean)).toBe(true)
      expect(getPageCopy(pageCopyBlocks(defaults), sections)).toEqual(defaults)
      expect(getPageCopy(null, sections)).toEqual(defaults)
    },
  )
})
