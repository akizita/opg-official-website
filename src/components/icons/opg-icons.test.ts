import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  OpgIconArticles,
  OpgIconCheck,
  OpgIconChevron,
  OpgIconClients,
  OpgIconClose,
  OpgIconContacts,
  OpgIconCopy,
  OpgIconDanger,
  OpgIconDashboard,
  OpgIconEdit,
  OpgIconExternalMail,
  OpgIconFilter,
  OpgIconLikes,
  OpgIconLink,
  OpgIconMore,
  OpgIconPlus,
  OpgIconReply,
  OpgIconSearch,
  OpgIconSend,
  OpgIconSidebarToggle,
  OpgIconSignOut,
  OpgIconSubscribers,
  OpgIconTemplate,
  OpgIconTestimonials,
  OpgIconTrash,
  OpgIconUpload,
  OpgIconUser,
  OpgIconViews,
  OpgIconVisits,
  OpgIconWarning,
} from './opg-icons'

describe('OPG Bespoke Icon Suite', () => {
  it('renders all core admin navigation and metric icons with aria-hidden="true"', () => {
    const dashHtml = renderToStaticMarkup(
      createElement(OpgIconDashboard, { className: 'custom-dash' }),
    )
    expect(dashHtml).toContain('<svg')
    expect(dashHtml).toContain('aria-hidden="true"')
    expect(dashHtml).toContain('viewBox="0 0 24 24"')
    expect(dashHtml).toContain('class="custom-dash"')

    const artHtml = renderToStaticMarkup(createElement(OpgIconArticles))
    expect(artHtml).toContain('<svg')
    expect(artHtml).toContain('viewBox="0 0 24 24"')

    const testmHtml = renderToStaticMarkup(createElement(OpgIconTestimonials))
    expect(testmHtml).toContain('<svg')

    const clientHtml = renderToStaticMarkup(createElement(OpgIconClients))
    expect(clientHtml).toContain('<svg')

    const contHtml = renderToStaticMarkup(createElement(OpgIconContacts))
    expect(contHtml).toContain('<svg')

    const subHtml = renderToStaticMarkup(createElement(OpgIconSubscribers))
    expect(subHtml).toContain('<svg')

    const visitHtml = renderToStaticMarkup(createElement(OpgIconVisits))
    expect(visitHtml).toContain('<svg')

    const viewHtml = renderToStaticMarkup(createElement(OpgIconViews))
    expect(viewHtml).toContain('<svg')

    const likeHtml = renderToStaticMarkup(createElement(OpgIconLikes))
    expect(likeHtml).toContain('<svg')

    const signOutHtml = renderToStaticMarkup(createElement(OpgIconSignOut))
    expect(signOutHtml).toContain('<svg')
  })

  it('renders toggle icon in collapsed and expanded states', () => {
    const expandedHtml = renderToStaticMarkup(
      createElement(OpgIconSidebarToggle, { collapsed: false }),
    )
    expect(expandedHtml).toContain('<svg')

    const collapsedHtml = renderToStaticMarkup(
      createElement(OpgIconSidebarToggle, { collapsed: true }),
    )
    expect(collapsedHtml).toContain('<svg')
  })

  it('renders toolbar, dialog, and action icons', () => {
    const warnHtml = renderToStaticMarkup(createElement(OpgIconWarning))
    expect(warnHtml).toContain('<svg')

    const dangerHtml = renderToStaticMarkup(createElement(OpgIconDanger))
    expect(dangerHtml).toContain('<svg')

    const searchHtml = renderToStaticMarkup(createElement(OpgIconSearch))
    expect(searchHtml).toContain('viewBox="0 0 20 20"')

    const replyHtml = renderToStaticMarkup(createElement(OpgIconReply))
    expect(replyHtml).toContain('<svg')

    const extHtml = renderToStaticMarkup(createElement(OpgIconExternalMail))
    expect(extHtml).toContain('<svg')

    const tmplHtml = renderToStaticMarkup(createElement(OpgIconTemplate))
    expect(tmplHtml).toContain('<svg')

    const sendHtml = renderToStaticMarkup(createElement(OpgIconSend))
    expect(sendHtml).toContain('<svg')

    const trashHtml = renderToStaticMarkup(createElement(OpgIconTrash))
    expect(trashHtml).toContain('<svg')
    expect(trashHtml).toContain('viewBox="0 0 24 24"')

    const filterHtml = renderToStaticMarkup(createElement(OpgIconFilter))
    expect(filterHtml).toContain('<svg')

    const chevHtml = renderToStaticMarkup(createElement(OpgIconChevron))
    expect(chevHtml).toContain('<svg')

    const moreHtml = renderToStaticMarkup(createElement(OpgIconMore))
    expect(moreHtml).toContain('<svg')
  })

  it('renders newly added utility icons', () => {
    const checkHtml = renderToStaticMarkup(createElement(OpgIconCheck))
    expect(checkHtml).toContain('<svg')
    expect(checkHtml).toContain('viewBox="0 0 20 20"')

    const closeHtml = renderToStaticMarkup(createElement(OpgIconClose))
    expect(closeHtml).toContain('<svg')

    const plusHtml = renderToStaticMarkup(createElement(OpgIconPlus))
    expect(plusHtml).toContain('<svg')

    const editHtml = renderToStaticMarkup(createElement(OpgIconEdit))
    expect(editHtml).toContain('<svg')

    const copyHtml = renderToStaticMarkup(createElement(OpgIconCopy))
    expect(copyHtml).toContain('<svg')

    const uploadHtml = renderToStaticMarkup(createElement(OpgIconUpload))
    expect(uploadHtml).toContain('<svg')

    const linkHtml = renderToStaticMarkup(createElement(OpgIconLink))
    expect(linkHtml).toContain('<svg')

    const userHtml = renderToStaticMarkup(createElement(OpgIconUser))
    expect(userHtml).toContain('<svg')
  })
})
