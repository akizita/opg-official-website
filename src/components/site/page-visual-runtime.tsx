'use client'

import { useEffect } from 'react'

import {
  type PageVisualConfig,
  type VisualPage,
  VISUAL_SECTION_GROUPS,
} from '@/lib/content/page-visual'

export function applyPageVisualOverrides(
  page: VisualPage,
  config: PageVisualConfig,
  doc: Document = document,
) {
  const root = doc.querySelector<HTMLElement>('#main-content')
  if (!root) return

  for (const group of VISUAL_SECTION_GROUPS[page]) {
    const order = config.sectionOrder[group.id] ?? group.sections.map((section) => section.id)
    for (const section of group.sections) {
      const element = root.querySelector<HTMLElement>(section.selector)
      if (!element) continue
      element.dataset.cmsSection = section.id
      const index = order.indexOf(section.id)
      if (index < 0) continue
      const parent = element.parentElement
      if (parent && config.sectionOrder[group.id]) {
        parent.style.display = 'flex'
        parent.style.flexDirection = 'column'
        element.style.order = String(index)
      }
    }
  }

  for (const [selector, image] of Object.entries(config.images)) {
    try {
      const element = root.querySelector<HTMLImageElement>(selector)
      if (!element || element.tagName !== 'IMG') continue
      if (element.src !== new URL(image.src, doc.location.href).href) {
        element.srcset = ''
        element.src = image.src
      }
      element.alt = image.alt
      element.style.objectPosition = image.position
    } catch {
      // A removed component can leave an obsolete selector in an older draft.
    }
  }

  for (const [selector, href] of Object.entries(config.links)) {
    try {
      const element = root.querySelector<HTMLAnchorElement>(selector)
      if (element?.tagName === 'A') element.href = href
    } catch {
      // Ignore stale selectors without affecting the rest of the page.
    }
  }

  for (const [selector, style] of Object.entries(config.styles)) {
    try {
      const element = root.querySelector<HTMLElement>(selector)
      if (!element) continue
      if (style.color) element.style.color = style.color
      if (style.backgroundColor)
        element.style.backgroundColor = style.backgroundColor
      if (style.textAlign) element.style.textAlign = style.textAlign
      if (style.paddingTop) element.style.paddingTop = style.paddingTop
      if (style.paddingBottom) element.style.paddingBottom = style.paddingBottom
    } catch {
      // Ignore stale selectors without affecting the rest of the page.
    }
  }
}

export function PageVisualRuntime({
  page,
  config,
}: {
  page: VisualPage
  config: PageVisualConfig
}) {
  useEffect(() => {
    let queued = false
    const apply = () => {
      queued = false
      applyPageVisualOverrides(page, config)
    }
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(apply)
    })
    apply()
    const root = document.querySelector('#main-content')
    if (root) observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [page, config])

  return null
}
