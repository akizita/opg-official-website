import { describe, expect, it } from 'vitest'

import {
  EMPTY_VISUAL_CONFIG,
  getPageVisualConfig,
  pageVisualBlock,
  VISUAL_BLOCK_KEY,
} from '@/lib/content/page-visual'

describe('page visual content compatibility', () => {
  it('keeps button titles and destinations in the saved page document', () => {
    const config = structuredClone(EMPTY_VISUAL_CONFIG)
    config.labels['.hero a:nth-of-type(1)'] = 'Talk to OPG'
    config.links['.hero a:nth-of-type(1)'] = '/contact'

    expect(getPageVisualConfig([pageVisualBlock(config)])).toEqual(config)
  })

  it('loads older visual documents without button title overrides', () => {
    const content = JSON.stringify({
      images: {},
      links: { '.hero a:nth-of-type(1)': '/careers' },
      styles: {},
      sectionOrder: {},
    })

    expect(
      getPageVisualConfig([
        { type: 'paragraph', key: VISUAL_BLOCK_KEY, content },
      ]).labels,
    ).toEqual({})
  })
})
