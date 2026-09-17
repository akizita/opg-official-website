# OPG Website — Wireframe Approval Guide

**Status:** Optional task-based design and demo/UAT checklist; separate upfront Armi review waived by Aki  
**Date:** 2026-09-15  
**Public-experience review owner:** Responsible OPG stakeholder for each page/content group  
**Admin/technical review owner:** Aki Zita  

---

## 1. What You Are Approving

A wireframe is a grayscale blueprint. It shows where information and actions go before time is spent on colors, photography, animation, and polished styling.

**2026-09-15 process update:** Aki reports that IT and web developers reviewed the roadmap and that a separate Armi-led wireframe meeting is unnecessary before development. Use this guide to check draft screens as they are implemented and demonstrated. The roadmap review is not approval of every unseen wireframe or finished screen. Armi remains product owner for scope/launch decisions, but need not attend a dedicated upfront wireframe session.

During wireframe approval, answer:

- Can a potential client understand OPG and reach the inquiry form?
- Can potential talent find an open role and reach the application destination?
- Is the content in the right order?
- Are navigation labels understandable?
- Is the primary action obvious on every page?
- Can each admin role finish its work without seeing controls it cannot use?
- Does the layout still make sense on mobile or tablet?
- Are loading, empty, error, validation, and confirmation states accounted for?

Do **not** delay wireframe approval because final colors, fonts, photos, icon styles, or exact marketing sentences are not ready. Those belong to visual-design and content approval.

---

## 2. Who Approves What

| Decision | Recommends | Final approver |
|---|---|---|
| Public page hierarchy and calls to action | Designer/developer | Responsible OPG stakeholder at demo/UAT; escalate material scope changes to Armi Escamilla |
| Public mobile behavior | Designer/developer | Responsible OPG stakeholder, with Aki confirming feasibility |
| Admin workflow and tablet behavior | Developer | Aki Zita |
| Editor/Publisher permission boundaries | Developer | Aki Zita; escalate policy/scope changes to Armi Escamilla |
| Inquiry workspace behavior | Developer/privacy reviewer | Aki Zita; privacy reviewer approves personal-data handling |
| Branding, colors, typography, and final imagery | Designer/brand owner | Named brand approver |
| Privacy and consent wording | Privacy/legal reviewer | OPG-authorized legal/privacy approver |

One consolidated decision should be returned for each demo/UAT review. Armi resolves material public-content or product-scope conflicts; Aki resolves admin/technical feedback.

---

## 3. Approval Stages

```text
1. Sitemap
   Pages, navigation labels, and URL relationships
        ↓
2. Low-fidelity wireframes
   Section order, content priority, actions, and user flow
        ↓
3. Responsive wireframes
   Public mobile/tablet behavior and admin tablet behavior
        ↓
4. Interaction states
   Loading, empty, error, success, review, publish, and archive
        ↓
5. Demo/UAT acceptance
   Implemented structure and task flows are accepted
        ↓
6. Visual design and real content
   Brand styling, images, polished copy, and final legal wording
```

Approval at Stage 5 means the team may build the structure. It does not mean every final sentence or visual detail is complete.

---

## 4. Proposed Information Architecture

### Header

- OPG logo → Home
- About dropdown → About Us, Mission & Vision, Meet the Team
- Services
- Clients
- Careers
- Articles
- FAQs
- Search
- Contact Us button

### Footer

- Short company description
- Client path: Services, Clients, Contact
- Talent path: Careers and the approved external application destination
- Company path: About, Mission & Vision, Team
- Resources: Articles, FAQs, Search
- Legal: Privacy, Cookies, Terms, Cookie settings
- Social links and approved shared contact addresses

### Homepage decision

The homepage should present two clear audience paths near the top:

- **For employers:** “Find the right talent” → Services or Contact
- **For candidates:** “Find your next role” → Careers

Armi should decide whether the two actions have equal emphasis or whether client inquiries are visually primary. Until that decision, wireframes should show them as equal paths.

---

## 5. Public Wireframe Set

Do not create a unique layout for every page. Approve reusable templates first.

| Template | Used by | Must show |
|---|---|---|
| Public shell | Every public page | Header, mobile menu, search entry, footer, cookie settings |
| Homepage | `/` | Dual audience paths, trust proof, services, selected jobs, testimonials, articles, newsletter, final CTA |
| Standard content | About, Mission & Vision, Privacy, Cookies, Terms | Page heading, summary, structured body, optional related CTA |
| Collection landing | Services, Clients, Team, FAQs, Testimonials | Intro, filtering/grouping if needed, ordered items, empty state |
| Detail | Service, Job, Article | Breadcrumb, title/metadata, body, related content, primary CTA, not-found state |
| Careers landing | Careers | Employer/candidate context, open jobs, no-openings state, external-application explanation |
| Article discovery | Articles, category, tag | Filters, pagination, result count, cards, empty state |
| Search results | Search | Query, result type, result list, no-results state; page remains `noindex` |
| Conversion | Contact and newsletter confirmation | Fields, privacy acknowledgement, bot control, validation, success/failure states |

### Homepage — desktop structure

```text
┌──────────────────────────────────────────────────────────────────────┐
│ LOGO   About  Services  Clients  Careers  Articles  FAQs   Search   │
│                                                       [Contact Us]   │
├──────────────────────────────────────────────────────────────────────┤
│ Recruitment and outsourcing headline                               │
│ One short explanation of who OPG helps                              │
│ [For employers]          [For candidates]              Hero image   │
├──────────────────────────────────────────────────────────────────────┤
│ Trust proof / approved client logos                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Services overview                         [View all services]         │
│ [Service]             [Service]            [Service]                 │
├──────────────────────────────────────────────────────────────────────┤
│ Why OPG / values / measurable differentiators                       │
├──────────────────────────────────────────────────────────────────────┤
│ Open roles                              [Explore careers]             │
├──────────────────────────────────────────────────────────────────────┤
│ Testimonials                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Latest articles                          [View all articles]          │
├──────────────────────────────────────────────────────────────────────┤
│ Newsletter signup with separate consent                             │
├──────────────────────────────────────────────────────────────────────┤
│ Final CTA: Your next hire. Your next role.                           │
│ [Contact OPG]             [View open roles]                           │
├──────────────────────────────────────────────────────────────────────┤
│ Footer links, shared contacts, social links, legal, cookie settings  │
└──────────────────────────────────────────────────────────────────────┘
```

### Homepage — mobile structure

```text
┌───────────────────────────┐
│ LOGO        Search  Menu  │
├───────────────────────────┤
│ Headline                  │
│ Short explanation        │
│ [For employers]          │
│ [For candidates]         │
│ Hero image               │
├───────────────────────────┤
│ Trust proof              │
├───────────────────────────┤
│ Services, one column     │
├───────────────────────────┤
│ Why OPG                  │
├───────────────────────────┤
│ Open roles               │
├───────────────────────────┤
│ Testimonials             │
├───────────────────────────┤
│ Latest articles          │
├───────────────────────────┤
│ Newsletter               │
├───────────────────────────┤
│ Final CTA and footer     │
└───────────────────────────┘
```

For mobile approval, check reading order rather than trying to make the desktop design smaller. The most important content and actions should appear first, controls should be touch-friendly, and no essential action should require hover.

---

## 6. Admin Wireframe Set

| Template/workflow | Must show |
|---|---|
| Sign in and MFA | Email/password or approved method, recovery, MFA enrollment/challenge, clear failure states |
| Admin shell | Role-aware navigation, current user/role, sign out, tablet navigation drawer |
| Dashboard | Items needing review, failed notifications, recent activity, role-appropriate shortcuts |
| Content list | Search/filter, title, status, updater, date, create action, row actions, empty state |
| Content editor | Required fields, slug, rich text, media/alt text, SEO preview, validation, Save Draft, Submit for Review |
| Publisher review | Content preview, change request, publish confirmation, unpublish/archive, audit details |
| Inquiry list/detail | Restricted access, status, assignee, contact details, message, internal notes, delivery state, archive |
| Users and roles | Super Admin only; invite user, assign/change role, deactivate access, confirmation, audit history |
| Redirects | Old path, destination, permanent status, validation against loops |

### Admin — desktop content list

```text
┌──────────────────────────────────────────────────────────────────────┐
│ OPG Admin                                      Aki Zita / Super Admin │
├───────────────┬──────────────────────────────────────────────────────┤
│ Dashboard     │ Articles                              [New article]  │
│ Pages         │ [Search] [Status filter] [Category]                  │
│ Services      │                                                      │
│ Clients       │ Title              Status      Updated       Actions │
│ Team          │ Example article    In review   Today         Review  │
│ Careers       │ Another article    Draft       Yesterday     Edit    │
│ Articles      │                                                      │
│ FAQs          │ Pagination / result count                             │
│ Testimonials  │                                                      │
│ Media         │                                                      │
│ Inquiries     │                                                      │
│ Subscribers   │                                                      │
│ Redirects     │                                                      │
│ Audit         │                                                      │
│ Users & Roles │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

### Admin — tablet editor

```text
┌──────────────────────────────────────────────┐
│ Menu   Edit article        Preview   Account │
├──────────────────────────────────────────────┤
│ Status: Draft                               │
│ Title [___________________________________] │
│ Slug  [___________________________________] │
│ Summary [_________________________________] │
│ Content                                    │
│ [                                         ] │
│ [                                         ] │
│ Cover image + alternative text             │
│ Category and tags                          │
│ SEO title and description                  │
│ Validation / save feedback                 │
├──────────────────────────────────────────────┤
│ [Save draft]              [Submit review]  │
└──────────────────────────────────────────────┘
```

At 768 px, the sidebar becomes a labeled drawer, secondary list columns may be hidden, and primary actions remain visible. Every admin task must work with touch and keyboard without horizontal page scrolling.

---

## 7. Role-Based Scenarios to Approve

Approve the wireframes by completing tasks, not by asking only whether the screens “look good.”

### Public visitor

- [ ] A potential client can identify an appropriate service and reach Contact.
- [ ] Potential talent can find an open role and understand that Apply opens the approved external system.
- [ ] A visitor can find an article by category/tag or search.
- [ ] Contact and newsletter forms clearly separate their privacy/marketing purposes.

### Editor

- [ ] Create a draft article, add media/alt text/category/tags, save it, preview it, and submit it for review.
- [ ] Cannot publish, change roles, or open inquiries.

### Publisher

- [ ] Open an in-review item, preview it, request changes or publish it, then unpublish/archive it safely.
- [ ] Cannot change roles or open inquiries by default.

### Inquiry Manager

- [ ] Open a new inquiry, assign it, add an internal note, mark it replied, and archive it.
- [ ] Cannot publish content or change roles.

### Super Admin — Aki Zita

- [ ] Invite a new administrator using an OPG-managed email.
- [ ] Assign Editor, Publisher, Inquiry Manager, or Super Admin.
- [ ] Review the confirmation and audit entry before a role change is finalized.
- [ ] Deactivate access without deleting historical authorship/audit information.

---

## 8. Responsive Review Sizes

| Experience | Required review widths |
|---|---|
| Public | 1440, 1024, 768, 375, and 320 px |
| Admin | 1440, 1024, and 768 px |

These are review anchors, not separate websites. Also drag between widths to detect overflow or awkward transitions.

At every width verify:

- no clipped text or horizontal page overflow;
- headings and controls remain in logical reading order;
- navigation can be opened, used, and closed with keyboard/touch;
- visible focus and sufficiently large touch targets;
- realistic long titles, names, job locations, and validation messages fit;
- dialogs and action bars do not cover essential content;
- tables simplify or reflow without hiding the primary task.

---

## 9. How to Give Useful Feedback

Use this format:

```text
[Template] [Width] [Priority]
Observation → requested outcome
```

Example:

```text
[Homepage] [375 px] [Important]
The Careers action appears after three service sections → keep both audience paths in the first screen.
```

Priorities:

- **Blocking:** The user cannot complete the intended task, or the structure creates a security/privacy/accessibility problem.
- **Important:** The hierarchy or wording is confusing and should change before implementation.
- **Later polish:** Color, illustration style, animation, or another detail that can wait for visual design.

Avoid feedback such as “make it pop” at wireframe stage. State which user, task, or information should receive more or less emphasis.

---

## 10. Approval Register

Use `Draft`, `Changes requested`, or `Approved`.

| Wireframe group | Public/role approver | Responsive approver | Status | Notes/evidence |
|---|---|---|---|---|
| Sitemap and public shell | Responsible OPG stakeholder | Stakeholder + Aki | Draft | |
| Homepage | Responsible OPG stakeholder | Stakeholder + Aki | Draft | Escalate client-primary versus equal hero actions if they affect product scope |
| Standard content pages | Responsible OPG stakeholder | Stakeholder + Aki | Draft | |
| Services and Clients | Responsible OPG stakeholder | Stakeholder + Aki | Draft | |
| Team and Testimonials | Responsible OPG stakeholder | Stakeholder + Aki | Draft | |
| Careers and Job detail | Responsible OPG stakeholder | Stakeholder + Aki | Draft | Confirm external application URL |
| Articles, categories, and tags | Responsible OPG stakeholder | Stakeholder + Aki | Draft | |
| FAQs and Search | Responsible OPG stakeholder | Stakeholder + Aki | Draft | |
| Contact and Newsletter | Stakeholder + privacy reviewer | Stakeholder + Aki | Draft | Legal wording is a later approval layer |
| Sign in and MFA | Aki Zita | Aki Zita | Draft | |
| Admin shell and dashboard | Aki Zita | Aki Zita | Draft | |
| Content list/editor/review | Aki Zita | Aki Zita | Draft | Mission & Vision is the first vertical slice |
| Inquiry workspace | Aki + privacy reviewer | Aki Zita | Draft | |
| Users and roles | Aki Zita | Aki Zita | Draft | Aki is the first Super Admin |

### Sign-off statement

For each approved row, record:

> The information hierarchy, user flow, required states, role boundaries, and responsive behavior are approved for implementation. Visual styling and final content remain subject to their separate approvals.

---

## 11. Recommended First Screen Review

No separate Armi wireframe meeting is required before development. At the first working-screen demo, Aki and the responsible public-content stakeholder can use the following 60–90 minute agenda; split it across demos if useful:

1. **10 minutes:** Confirm sitemap and header/footer navigation.
2. **20 minutes:** Review Homepage at desktop and mobile, including the two audience paths.
3. **15 minutes:** Review reusable public list/detail/content templates instead of every page individually.
4. **25 minutes:** Walk through Editor → Publisher and Super Admin invitation/role scenarios at desktop and tablet.
5. **10 minutes:** Record Blocking and Important changes, owners, and due dates.
6. Approve unchanged groups; schedule a short follow-up only for changed groups.

The first design deliverables should therefore be:

- public shell and Homepage at 1440 and 375 px;
- one public content/detail template at 1440 and 375 px;
- admin shell and content editor at 1440 and 768 px;
- Publisher review state;
- Super Admin invitation and role-assignment flow.

This small set proves the navigation, both public audiences, the responsive approach, and the editorial permission model before every remaining screen is drawn.

---

## Change Log

| Version | Date | Change |
|---|---|---|
| 0.2 | 2026-09-15 | Changed from mandatory upfront Armi sign-off to optional task-based draft-screen and demo/UAT review per Aki |
| 0.1 | 2026-09-12 | Initial public/admin wireframe approval guide and low-fidelity structure |
