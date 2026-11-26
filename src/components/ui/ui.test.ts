import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AboutCtaCard } from './about-cta-card'
import { AboutServicesSection } from './about-services-section'
import { AboutTeamShowcase, TEAM_MEMBERS } from './about-team-showcase'
import { Aurora } from './aurora'
import { ColorBends } from './color-bends'
import { DepthCarousel } from './depth-carousel'
import {
  GLOBAL_DESTINATIONS,
  OffshoreMapSection,
  PHILIPPINES_HQ,
} from './offshore-map'
import { Masonry } from './masonry'
import { DEFAULT_OPG_LIGHT_LOGO_URL, TextLoop } from './text-loop'
import { HomeCandidateTestimonialsSection } from '@/components/home/home-candidate-testimonials-section'
import { HomeInitialScrollGuard } from '@/components/home/home-initial-scroll-guard'
import { TEAM_MEMBERS_11 } from '@/components/home/home-team-masonry-section'
import type { RichTextBlock } from './rich-text'
import type { ContentStatus } from './status-badge'

describe('UI Base Components contracts', () => {
  it('validates supported content statuses', () => {
    const statuses: ContentStatus[] = [
      'draft',
      'in_review',
      'changes_requested',
      'published',
      'unpublished',
      'archived',
      'active',
      'inactive',
    ]
    expect(statuses).toHaveLength(8)
  })

  it('validates structured rich text block formats', () => {
    const blocks: RichTextBlock[] = [
      { type: 'paragraph', content: 'Intro text' },
      { type: 'heading', level: 2, content: 'Section title' },
      { type: 'list', ordered: false, items: ['Item 1', 'Item 2'] },
      { type: 'blockquote', content: 'Quote text', citation: 'Author' },
      { type: 'callout', variant: 'info', content: 'Important note' },
    ]
    expect(blocks).toHaveLength(5)
    expect(blocks[0].type).toBe('paragraph')
  })

  it('exports the Aurora background component', () => {
    expect(typeof Aurora).toBe('function')
  })

  it('exports the AboutCtaCard component', () => {
    expect(typeof AboutCtaCard).toBe('function')
  })

  it('exports the AboutServicesSection component', () => {
    expect(typeof AboutServicesSection).toBe('function')
  })

  it('exports the DepthCarousel component', () => {
    expect(typeof DepthCarousel).toBe('object') // forwardRef returns object
  })

  it('exports the AboutTeamShowcase component and valid team data', () => {
    expect(typeof AboutTeamShowcase).toBe('function')
    expect(TEAM_MEMBERS.length).toBeGreaterThanOrEqual(5)
    TEAM_MEMBERS.forEach((member) => {
      expect(member.name).toBeTruthy()
      expect(member.position).toBeTruthy()
      expect(member.image).toBeTruthy()
      expect(member.headline).toBeTruthy()
      expect(member.bio).toBeTruthy()
    })
  })

  it('exports the ColorBends background component', () => {
    expect(typeof ColorBends).toBe('function')
  })

  it('exports the OffshoreMapSection component and destination hubs', () => {
    expect(typeof OffshoreMapSection).toBe('function')
    expect(PHILIPPINES_HQ.country).toBe('Philippines')
    expect(GLOBAL_DESTINATIONS.length).toBeGreaterThanOrEqual(7)
  })

  it('exports the Masonry component and validates the 11-member team dataset', () => {
    expect(typeof Masonry).toBe('function')
    expect(TEAM_MEMBERS_11).toHaveLength(11)
    TEAM_MEMBERS_11.forEach((member) => {
      expect(member.id).toBeTruthy()
      expect(member.name).toBeTruthy()
      expect(member.role).toBeTruthy()
      expect(member.img).toBeTruthy()
      expect(member.height).toBeGreaterThan(0)
    })
  })

  it('renders HomeCandidateTestimonialsSection from live testimonial items with Read full story toggle for long quotes', () => {
    expect(typeof HomeCandidateTestimonialsSection).toBe('function')

    const html = renderToString(
      createElement(HomeCandidateTestimonialsSection, {
        testimonials: [
          {
            id: 'real-1',
            author_name: 'Aaron Calusa',
            relationship: 'past',
            role_title: 'Senior Video Editor',
            rating: 5,
            quote:
              "I'm truly grateful for the opportunity OPG has given me. Working from home allows me to spend more time with my wife and kids while doing the job I love, collaborating with a supportive client team, and enjoying competitive benefits.",
            published_at: '2026-11-25T00:00:00.000Z',
          },
          {
            id: 'real-2',
            author_name: 'Gelo Milabo',
            relationship: 'past',
            role_title: 'Paid Media and Marketing Data Analyst',
            rating: 5,
            quote: 'Short and sweet candidate experience.',
            published_at: '2026-11-24T00:00:00.000Z',
          },
        ],
      }),
    )

    expect(html).toContain('Aaron Calusa')
    expect(html).toContain('Senior Video Editor')
    expect(html).toContain('Gelo Milabo')
    expect(html).toContain('Read full story')
    expect(html).toContain('View More')
  })

  it('exports HomeInitialScrollGuard cleanly', () => {
    expect(typeof HomeInitialScrollGuard).toBe('function')
    expect(renderToString(createElement(HomeInitialScrollGuard))).toBe('')
  })

  it('exports TextLoop with the OPG light logo separator URL', () => {
    expect(typeof TextLoop).toBe('function')
    expect(DEFAULT_OPG_LIGHT_LOGO_URL).toContain('opg-light-logo-1789740328075.png')
  })
})
