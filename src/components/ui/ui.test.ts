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
})
