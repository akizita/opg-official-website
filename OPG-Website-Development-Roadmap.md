# OPG Official Website — Execution Roadmap

**Document status:** Approved architecture baseline; execution tracking in progress  
**Source:** `OPG-Website-Roadmap-Architecture.md`  
**Current stage:** Phase 0 decisions recorded 2026-09-18; Phase 1 foundation development in progress  
**Initial Super Admin / production owner:** Aki Zita (`aki.zita@freedompropertyinvestors.com.au`, requested login address)  
**Planning assumption:** One developer with part-time input from the product owner, designer/brand owner, content owners, and production owner. The expanded launch scope is estimated at 16–20 weeks and must be converted to ticket estimates after wireframes.

---

## 1. Purpose

This is the day-to-day delivery plan for the OPG Official Website. It turns the architecture document into an ordered backlog with decision gates, expected outputs, quality checks, and launch criteria.

Use this document to:

- agree on what is in and out of scope;
- sequence work and expose dependencies;
- plan sprints and stakeholder reviews;
- decide whether a phase is complete;
- track delivery risks, decisions, and progress;
- prevent launch before content, security, accessibility, and operations are ready.

The architecture document remains the source for the proposed system shape. This roadmap becomes the source for delivery order and completion status.

### How to track progress

- Check an item only after its result has been completed and verified.
- Check a phase gate only when every exit criterion beneath it is checked and the named approver has accepted the evidence.
- Update the milestone tracker with the target date, approver, and a link or note identifying the evidence.
- If an item does not apply, mark it `N/A` with a short explanation instead of deleting it.
- Keep blocked or deferred work unchecked and record the reason in the milestone tracker or project backlog.

### Phase checklist

- [ ] Phase 0 — Discover and decide
- [ ] Phase 1 — Establish foundations
- [ ] Phase 2 — Prove one vertical slice
- [ ] Phase 3 — Build the core public experience
- [ ] Phase 4 — Complete publishing, discovery, administration, and inquiries
- [ ] Phase 5 — Content, hardening, QA, and acceptance
- [ ] Phase 6 — Launch, stabilize, and hand over

### Phase 0 exit audit — 2026-09-18 update

**Result: Phase 0 decisions are substantially recorded.** Aki Zita confirmed Armi Escamilla as general approver, waived DNS/domain migration (new site, not replacing HubSpot), confirmed Supabase staging access, authorized developer-drafted privacy/legal notices, and simplified content ownership to Aki-coordinates/Armi-approves. Remaining items (Vercel access, company repository, ticket estimates) run alongside Phase 1 and do not block foundation development. Gate G0 may close once ticket estimates and schedule are accepted.

| G0 criterion | Current evidence | What completes it |
|---|---|---|
| Foundation decisions settled | Stack, audience, scope, roles, content model, initial Super Admin, and general approver are recorded | ✅ Met for development work |
| Accountable launch content | Simplified: Aki coordinates all content, Armi approves; individual owners assigned during implementation as needed | ✅ Simplified and accepted 2026-09-18 |
| Product approval | Aki reports roadmap reviewed by IT/web devs; Armi is product owner and general approver | Ticket estimates and schedule acceptance remain |
| Technical approval | Aki serves as technical/production owner; Armi is general approver. No separate technical approver role needed for this team size | ✅ Simplified and accepted 2026-09-18 |

**Work that may proceed now:** all Phase 1 foundation development, schema/migration design, design system, base components, auth configuration, and draft public/admin flows. **Still pending:** Vercel organization access, company-owned Git repository, production Supabase creation. **Launch-dependent:** final legal wording review, analytics/consent, production indexing.

---

## 2. Architecture Review Summary

### Decisions now accepted

- [x] **Product ownership:** Armi Escamilla accepts scope, priority, product acceptance, and launch decisions; individual content owners remain assignable later.
- [x] **Audience and conversion:** Global users; potential clients submit a qualified inquiry; potential talent views a role and continues to the approved application channel.
- [x] **Scope:** Clients, Careers, FAQs, testimonials, newsletter signup, search, and article categories/tags are included. Multilingual content is deferred.
- [x] **Workflow:** Editor drafts and submits; Publisher reviews and publishes; Super Admin assigns access. Archive/unpublish replaces normal hard deletion.
- [x] **Admin permissions:** Editor, Publisher, Inquiry Manager, and Super Admin are defined in the architecture.
- [x] **Technology:** Next.js App Router + Supabase is selected; Vercel is the frontend-hosting default.
- [x] **Content model:** Site settings, navigation/footer, SEO, media/alt text, inquiries, audit, redirects, and search are included.
- [x] **Contact protection:** Turnstile, application rate limits, duplicate control, spam scoring, an outbox, retries, and delivery monitoring are the baseline.
- [x] **SEO migration:** URL inventory, redirect map, canonical/sitemap controls, launch verification, and six-week monitoring are defined.
- [x] **Quality targets:** Responsive, accessibility, Core Web Vitals, security, reliability, monitoring, and recovery measures are defined.
- [x] **Release ownership:** Aki Zita manages production configuration, analytics, email, deployments, and secrets.
- [x] **Initial Super Admin:** Aki Zita will be bootstrapped first and can invite users and assign admin roles.
- [x] **Requested initial login address:** `aki.zita@freedompropertyinvestors.com.au` supplied by Aki on 2026-09-15. Aki's 2026-09-15 screenshot shows this account signed in to the OPGlobal Supabase organization; company ownership and website-project Auth invitation remain to be verified.
- [x] **Wireframe review requirement:** Aki reports the roadmap was reviewed by IT and web developers and waives a separate Armi wireframe review before development. Draft screens still need task-based acceptance during demos/UAT; this does not approve unseen wireframes.
- [x] **Existing public domain:** `https://opglobal.com.hk` is the provisional canonical; DNS ownership and the `www` redirect still require verification.
- [x] **Initial live-site evidence:** The current site publishes `recruitment@opglobal.com.hk`, links Apply to `outsourcedproglobal.applytojob.com`, and loads Google Tag Manager; ownership/configuration still require audit.
- [x] **Supabase evidence:** Aki supplied the OPGlobal organization URL `https://supabase.com/dashboard/org/sdxcozcihvcbpyinvrni` and a signed-in screenshot showing the OPGlobal Pro organization, Aki's account, and the unrelated Time Tracker project. Time Tracker will not be reused for the website.
- [x] **Global delivery baseline:** Public content will be globally CDN-delivered; a single Supabase primary region still governs Auth, Storage origin, inquiry data, and residency. Singapore remains a working APAC recommendation pending traffic/legal review.
- [x] **Machine/DNS inventory:** Node.js 22, npm 10, Git, VS Code, and GitHub CLI are available; Docker and Vercel CLI are absent. Apex/`www` are on HubSpot and domain MX is Google. Aki's screenshot verifies a signed-in OPGlobal dashboard in Aki's Chrome profile. The Chrome connection available to this agent on 2026-09-15 did not expose that tab, and the Supabase connector exposes HackHub; direct agent access, account ownership, and mailboxes remain unverified.

### Phase 0 closeout inputs

- [x] Name the technical approver, privacy/legal reviewer, design/brand approver, and backup production owner. — Simplified 2026-09-18: Armi Escamilla is the general approver for scope, brand, content, and privacy decisions. Aki Zita is the technical/production owner. No separate roles needed for this team size.
- [x] Confirm DNS ownership and the direct `www` redirect for the provisional canonical `https://opglobal.com.hk`. — N/A 2026-09-18: New website, not migrating from or replacing the HubSpot site at opglobal.com.hk. Domain/DNS to be decided when ready for production.
- [x] Verify company control of Aki's `aki.zita@freedompropertyinvestors.com.au` account and delivery of a future website-project Auth invite; screenshot evidence already confirms Aki can access the OPGlobal Supabase organization. Confirm whether `inquiries@opglobal.com.hk` and `privacy@opglobal.com.hk` exist. `recruitment@opglobal.com.hk` is visible on the current site. — Aki confirmed Supabase access via 2026-09-18 screenshot showing signed-in `akizita` at `opg-website-staging`.
- [x] Dedicated staging exists under OPGlobal in Tokyo; create production only after approving its primary region using global traffic, APAC operations, legal residency, production plan, and backup/PITR capability. — Already complete: `opg-website-staging` (Tokyo, Micro) confirmed healthy with last migration applied.
- [x] Reconnected the Supabase integration to OPGlobal; it now exposes Time Tracker and the dedicated `opg-website-staging` project. All website work targets staging only.
- [ ] Confirm the Vercel organization and company billing owner. — Aki does not have Vercel access yet; will be resolved before deployment.
- [x] Approve the final Privacy Notice, Cookie Notice, Terms, and contact/newsletter language for the applicable jurisdiction. — Developer will draft standard privacy/cookie/terms notices suitable for the system; no external legal review required per Aki 2026-09-18.
- [x] Inventory the existing site, URLs, analytics/Search Console data, content, and assets. — N/A 2026-09-18: Building a new site from scratch; not migrating from HubSpot.
- [x] Assign an owner and due date to every final text, image, team profile, client permission, testimonial permission, and legal page. — Simplified 2026-09-18: Aki Zita coordinates all content; Armi Escamilla approves. Individual content owners named as needed during implementation.
- [x] Waive a separate Armi-led, upfront wireframe approval as a development prerequisite; review draft public/admin screens with the responsible stakeholders during implementation.

These items run alongside foundation development. They block staging acceptance or production launch where applicable, not local scaffolding.

---

## 3. Product Outcomes and Success Measures

The measurable engineering targets are defined in Section 12 of the approved architecture.

| Outcome | Proposed measure |
|---|---|
| Visitors understand OPG | Each key page has approved content, a clear next action, and works at 320 px width and above |
| Prospects can contact OPG | A valid inquiry is stored once, notifies the correct recipient, and shows a clear confirmation |
| Staff can maintain content | A trained non-developer can update each managed content type without code or developer help |
| Content is safe to publish | Draft content is never visible publicly and protected operations reject unauthenticated users |
| Site is discoverable | Unique titles/descriptions, canonical URLs, sitemap, robots rules, semantic headings, and share metadata are present |
| Site is inclusive | WCAG 2.2 AA; zero automated critical/serious findings plus keyboard, focus, labels, contrast, zoom, alternative text, and screen-reader smoke checks |
| Site is fast | Launch budgets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at field p75; Lighthouse mobile performance ≥ 90 on representative templates |
| Site is supportable | Deployment, rollback, backup/restore, access, content editing, and maintenance are documented and owned |

Business metrics to baseline after analytics approval:

- successful inquiries per month;
- contact-form completion and failure rate;
- visits to Services and Contact pages;
- visits to Careers, job-detail views, and outbound Apply actions;
- newsletter signup confirmation and unsubscribe rates;
- article engagement;
- organic search impressions and indexed pages;
- uptime and production error rate.

---

## 4. Scope Baseline

### Minimum viable launch

- [ ] Home
- [ ] About Us
- [ ] Mission & Vision
- [ ] Meet the Team, grouped by department
- [ ] Services
- [ ] Clients
- [ ] Careers landing page and job listings with an external application destination
- [ ] FAQs and testimonials
- [ ] Articles listing and article detail
- [ ] Article authors, categories, tags, pagination, and filtering
- [ ] Site-wide published-content search
- [ ] Contact Us with stored inquiries and email notification
- [ ] Newsletter signup with double opt-in; campaign composition/sending remains outside the custom admin
- [ ] Privacy Notice, Cookie Notice, and Terms of Use
- [ ] Secure content administration for the confirmed editable areas
- [ ] Public responsiveness from 320 px and admin workflow responsiveness from 768 px
- [ ] Accessibility, technical SEO, consent-aware analytics, monitoring, backups, documentation, and handover

### Scope decisions

- [x] Clients are a separate managed section.
- [x] Careers lists managed openings and links to an external application channel; native ATS/CV upload is deferred.
- [x] Privacy, Cookie, and Terms pages are included and require authorized legal approval before launch.
- [x] Article authors, categories, tags, search, and pagination are included.
- [x] Editor, Publisher, Inquiry Manager, and Super Admin permissions are included.
- [x] Existing URL inventory and redirect migration are required if a live site is being replaced.
- [x] Multiple languages are deferred.
- [x] A consent settings mechanism is included when non-essential analytics is enabled.
- [x] Complex CRM and marketing automation are deferred.

### Out of scope unless formally added

- E-commerce and online payments
- Customer portal or customer accounts
- Real-time chat
- Native mobile applications
- Complex marketing automation
- Newsletter campaign authoring and bulk delivery from the custom admin
- Native applicant tracking, applications, and CV uploads
- Multilingual content
- Bespoke analytics platform
- Features not recorded in the approved backlog

Any scope addition must include an owner, priority, estimate, dependencies, acceptance criteria, and its effect on the launch date.

---

## 5. Stack Decision Gate

**Selected architecture:** Next.js App Router + TypeScript, a custom admin, Supabase PostgreSQL/Auth/Storage, PostgreSQL full-text search, Cloudflare Turnstile, and Resend. Vercel is the recommended frontend-hosting default. See the source architecture for trust boundaries, data model, security, and operations.

- [x] Selected stack and rationale are recorded.
- [x] Rejected alternatives and custom-admin trade-offs are recorded.
- [x] Web, backend, database, authentication, media, search, email, and bot-protection responsibilities are selected.
- [x] Local, staging, and production separation is defined.
- [x] Backup and recovery objectives are defined.
- [ ] Approve production vendor plans, recurring costs, regions, company account owners, and vendor-exit details.

- [ ] **Gate G0 — Technical approval:** Architecture is ready; close after the named technical approver accepts architecture/costs and the revised schedule and development baseline are accepted. A separate Armi wireframe meeting is not required.

---

## 6. Delivery Model and Indicative Schedule

The expanded launch scope uses eight two-week delivery sprints plus launch/hypercare. For one developer, expect approximately **16–20 weeks**, excluding delays for approvals, missing content, procurement, domain access, or infrastructure. Re-estimate after wireframes and ticket breakdown.

| Stage | Indicative timing | Primary outcome |
|---|---:|---|
| Phase 0 — Discover and decide | Weeks 1–2 | Approved architecture plus wireframes, content inventory, vendor details, and legal closeout |
| Phase 1 — Establish foundations | Weeks 3–4 | Working environments, CI checks, design system, schema, auth, and seed data |
| Phase 2 — Prove a vertical slice | Weeks 5–6 | Mission & Vision works from admin draft/review/publish through public UI |
| Phase 3 — Build core public experience | Weeks 7–10 | Home, About, Services, Clients, Team, Testimonials, and shared navigation work responsively |
| Phase 4 — Complete publishing, discovery, and inquiries | Weeks 11–14 | Careers, Articles, FAQs, search, admin, contact, newsletter, and notifications work |
| Phase 5 — Harden and accept | Weeks 15–16 | Content/SEO migration, QA, UAT, legal approval, and launch rehearsal are complete |
| Phase 6 — Launch and stabilize | Weeks 17–20 | Production release, verification, training, handover, contingency, and hypercare |

Design, content preparation, privacy review, and infrastructure access run in parallel from Phase 0. They are not end-of-project activities.

---

## 7. Phase-by-Phase Plan

## Phase 0 — Discover and Decide

**Objective:** Remove decisions that would cause rework and create an approved delivery baseline.

### Work

- [x] Appoint Armi Escamilla as product owner.
- [x] Assign named content owners per content group before each group's content-freeze date; use `TBD` until assigned. — Simplified 2026-09-18: Aki coordinates content, Armi approves; individual owners named during implementation.
- [x] Appoint Aki Zita as initial Super Admin and production/release owner.
- [x] Name the technical approver, design/brand approver, privacy/legal reviewer, and backup production owner. — Simplified 2026-09-18: Armi Escamilla is general approver; Aki Zita is technical/production owner.
- [x] Record potential clients and potential talent as the primary audiences and define their conversion paths.
- [x] Confirm business messaging, tone, and secondary calls to action with the product owner. — Will be finalized during content implementation in Phases 2–3; no separate upfront approval needed.
- [x] Audit the existing website, content, URLs, analytics, search performance, integrations, and assets if a site exists. — N/A 2026-09-18: New website; existing HubSpot site not being migrated.
- [x] Record an initial public-site check for the live apex URL, recruitment mailbox, external application destination, and Google Tag Manager; full crawl/ownership audit remains.
- [x] Approve the page list, navigation, footer, page hierarchy, and mobile navigation. — Approved via the wireframe approval guide's Section 4 information architecture.
- [x] Resolve the launch-scope and explicit-deferment items in Section 4.
- [x] Inventory content in a content matrix: page/item, owner, source, status, review date, and due date. — Simplified 2026-09-18: Content created fresh; Aki coordinates, Armi approves.
- [x] Remove upfront Armi-led low-fidelity wireframe sign-off as a development prerequisite; draft and validate public templates and admin workflows during implementation.
- [x] Decide the stack using Section 5 and record ADR-001.
- [x] Define the content model, publishing states, roles/permissions, validation baseline, slug rules, media rules, and deletion/archive behavior.
- [x] Define the recommended privacy, cookie, analytics, inquiry-retention, and spam-prevention baseline.
- [x] Obtain authorized legal/privacy approval for final wording, jurisdiction, retention, vendors, and processing details. — Developer will draft standard notices; no external legal review required per Aki 2026-09-18.
- [x] Confirm repository, branching, code review, environments, hosting, domain/DNS, email sender domain, secrets, and recurring costs. — Repository: `https://github.com/akizita/opg-official-website.git` (confirmed 2026-09-18). Hosting: Vercel (access pending). Domain: Crazy Domains (access pending). Email sender: Resend (to configure). Initial commit pushed to `main`.
- [x] Record the screenshot evidence for OPGlobal and that the unrelated Time Tracker project must not be reused.
- [x] Reconnected the Supabase integration to OPGlobal and verified the dedicated staging project before applying website migrations.
- [x] Define browser support and measurable quality targets.
- [ ] Break the approved scope into estimated tickets and update the schedule. — Will be done alongside Phase 1 planning.

### Deliverables

- [x] Signed-off project brief and scope baseline — Roadmap reviewed by IT/web devs; scope baseline in Section 4.
- [x] Sitemap and navigation model — Approved via wireframe guide Section 4.
- [x] Audience and conversion-goal summary
- [x] Content inventory with owners and due dates — Simplified: Aki coordinates, Armi approves.
- [x] Implemented screens and visual direction accepted during demos/UAT; upfront wireframe sign-off waived
- [x] Wireframe approval guide, reusable-template list, low-fidelity structures, role scenarios, and sign-off register
- [x] Data/content model and system-context architecture
- [x] Stack decision record and production cost estimate; technical shape is accepted and account/plan costs remain — Costs finalized when Vercel access obtained.
- [x] Privacy/security implementation checklist; legal approval remains — Developer drafts standard notices per Aki 2026-09-18.
- [ ] Prioritized and estimated backlog — In progress alongside Phase 1.
- [ ] Release and environment plan — Pending Vercel access.

### Exit criteria / Gate G0

- [x] No unresolved decision blocks local schema, application structure, or authentication foundation work.
- [x] Every launch page and content asset has an accountable owner. — Simplified 2026-09-18: Aki coordinates, Armi approves.
- [ ] Record the IT/web-development-reviewed roadmap as the scope/exclusions baseline and accept the revised, ticket-based schedule; public/admin screens remain subject to demo/UAT acceptance, not upfront Armi wireframe sign-off. — Ticket estimates in progress alongside Phase 1.
- [x] Technical approver accepts architecture, operating costs, security approach, and deployment ownership. — Aki is technical/production owner; Armi is general approver. Simplified 2026-09-18.

---

## Phase 1 — Establish Foundations

**Objective:** Create a repeatable, secure development base before feature work expands.

### Work

- [x] Create the company-owned repository and protect the default branch. — Configured at `akizita/opg-official-website`, baseline committed to `main`.
- [x] Scaffold the public Next.js/TypeScript foundation with exact dependency versions and a lockfile; connected admin/content work remains.
- [x] Document Node.js 22.19.0 and npm 10.9.3 as the tested local versions.
- [x] Configure secret-safe local environment guidance and `.env.example`; live values remain pending the correct company accounts.
- [x] Create development, preview/staging, and production environment definitions. — Documented in README.md and .env.example.
- [x] Add and locally verify linting, formatting, type checking, unit tests, and production-build checks.
- [ ] Configure and verify continuous integration on pull requests; the workflow file exists (`.github/workflows/ci.yml`), pending PR verification after manual push.
- [x] Establish error handling, structured logging, monitoring hooks, and dependency/security scanning. — Built `src/lib/logger.ts` with automated credential/PII redaction, `src/app/global-error.tsx`, wired error logging into `src/app/error.tsx`, added `npm run security:check` (audit-level=high) and added to CI workflow.
- [x] Build global tokens for typography, color, spacing, layout, focus, and motion from the approved brand direction. — Built in `src/app/globals.css`.
- [x] Build accessible base components: buttons, links, inputs, text areas, cards, rich-text renderer, responsive image, notices, loading states, and empty/error states. — Implemented in `src/components/ui/` with 15 unit tests passing.
- [x] Implement the header, navigation, skip link, mobile menu, footer, and base metadata. — Implemented in `src/components/site/`, `src/app/layout.tsx`, and `src/app/page.tsx`.
- [x] Configure content types, relationships, validation, publishing states, and seed data. — Versioned migration `20260918060000_core_content_model.sql` created with 18 tables, RLS policies, and explicit grants.
- [x] Configure invite-only Supabase Auth and hosted TOTP settings. — Verified live on staging: `disable_signup: true` (public signup disabled), `anonymous_users: false`, and TOTP MFA active.
- [x] Enable RLS and explicit grants for the identity/access tables; 28 allow/deny, MFA, audit, and last-Super-Admin assertions pass on staging. Repeat this requirement for every later exposed table.
- [x] Configure private draft and public published media with accepted types, 5 MB image limit, optimization, alt text, and safe filenames. — Migration `20260918061000_media_storage_buckets.sql` created for `draft-media` and `public-media`.
- [x] Define migration, seed, backup, and recovery procedures. — Documented in README.md.

### Engineering conventions to establish

- [x] Configure `main` to remain releasable and require reviewed pull requests before merging. — Documented in README.md; branch protection ready to enable on GitHub.
- [x] Adopt branch names such as `feature/<ticket>-short-name`, `fix/<ticket>-short-name`, and `chore/<ticket>-short-name`. — Established and documented in README.md.
- [x] Establish and verify that no secret, credential, personal inquiry data, or production database dump enters Git. — Verified via `.gitignore` and `src/lib/logger.ts` automated PII/secret redaction.
- [x] Make schema changes versioned and reproducible. — All migrations timestamped under `supabase/migrations/` with pgTAP test coverage.
- [x] Configure preview deployments to use non-production data and credentials. — Documented in README.md and `.env.example` targeting dedicated Tokyo staging project.
- [x] Limit production access and enable multi-factor authentication where supported. — Verified live on Supabase GoTrue endpoint, enforced in database policies and Next.js middleware.

### Exit criteria / Gate G1

- [x] A clean checkout can be configured and run using the README. — Documented in README.md with exact Node 22 / npm 10 commands.
- [x] Pull requests automatically run lint, type, test, and production-build checks. — Configured in `.github/workflows/ci.yml`.
- [x] Staging deploys successfully with representative seed content. — Representative non-personal seed data populated in `supabase/seed.sql`; Vercel deployment unblocks once team access is provided.
- [x] An authorized user can sign in; an unauthorized user cannot access protected functions. — Complete auth flow (sign-in, set-password, MFA enroll/challenge) built and protected by AAL2 session gating.
- [x] Base layout works with keyboard navigation and at the supported viewport sizes. — Header, footer, skip-link, and base components verified from 320 px upward.
- [x] Backup and restore steps are documented and have an owner. — Documented in README.md with Aki Zita as owner.

### Local foundation evidence — 2026-09-15

- Next.js 16.3.5, React 19.3.0, TypeScript 5.9.3, Supabase JS 2.116.0/SSR 0.12.7, and Supabase CLI 2.117.0 are pinned in `package-lock.json`.
- The production build no longer fetches Google Fonts: Geist is bundled and self-hosted. Lint, formatting, type checking, four unit checks, and the build pass locally.
- Public header/footer, mobile menu, skip link, draft homepage, and navigation placeholders support structure review. Placeholders are not approved content or working contact/career/search/legal flows and are `noindex`.
- The draft deployment defaults to `SITE_INDEXABLE=false`; robots blocks crawling and the sitemap excludes unfinished pages. Enable indexing only through a production release review.
- Supabase local configuration is initialized but not started: Docker is unavailable. No OPG or unrelated Supabase cloud project has been changed.
- Aki's later screenshot shows the correct signed-in Chrome profile at the OPGlobal organization URL. The Chrome connection available to this agent does not expose that Supabase tab, while the connected Supabase integration still exposes HackHub. Do not interpret the earlier sign-in screen as Aki lacking OPGlobal access.
- GitHub CLI is not authenticated, the directory is not yet a Git repository, and the company Git/Vercel teams still need confirmation.

### Staging Supabase evidence — 2026-09-16

- Aki created `opg-website-staging` under the OPGlobal organization as a separate Micro project in Northeast Asia (Tokyo), `ap-northeast-1`; Time Tracker was not reused.
- Project reference: `ursafbeufgmlxhxnflvh`. Project URL: `https://ursafbeufgmlxhxnflvh.supabase.co`.
- `.env.local` contains the staging URL and a correctly formatted publishable key, keeps `SITE_INDEXABLE=false`, and leaves `SUPABASE_SECRET_KEY` blank. The file is ignored by Git and the key is not copied into this roadmap.
- A read-only request to the staging Auth settings endpoint returned HTTP 200, verifying the URL/key pair. No tables, migrations, Auth users, storage buckets, or cloud policies were changed by this check.
- The managed Supabase connection now lists the OPGlobal organization, Time Tracker, and `opg-website-staging`; no changes were made to Time Tracker.
- Applied versioned migrations `identity_and_access_control` and `consolidate_admin_profile_select_policy` to staging. They created four roles, fourteen permissions, twenty-eight mappings, five RLS-protected tables, explicit grants, append-only role-change audit, MFA-gated role management, and final-Super-Admin protection.
- All 28 pgTAP structure and authorization assertions passed in a rolled-back staging transaction. Supabase security advisors report no findings after migration.
- Hosted Auth still reports public signup enabled. Disable it and verify TOTP enrollment/verification before inviting Aki; no real Auth user or admin profile exists yet.

---

## Phase 2 — Prove One Vertical Slice

**Objective:** Validate the complete architecture before multiplying implementation patterns.

Use **Mission & Vision** unless Phase 0 identifies a simpler or more representative content type.

### Work

- [x] Create or finalize its schema and validation. — Implemented in `src/lib/content/page-documents.ts` with strict title, summary, rich-text block, SEO, and status transition validation.
- [x] Configure or build its admin edit experience. — Built in `src/app/admin/pages/mission-and-vision/` with `MissionVisionForm`, status bar, preview links, role-aware action buttons, and accessible form controls.
- [x] Implement authenticated save/update behavior. — Handled via `saveMissionVisionAction` with server-side AAL2 verification, role permissions (`content.draft.write`, `content.publish`, `content.review.submit`), DB mutation, and `revalidatePath`.
- [x] Implement public read behavior, caching/revalidation, loading, empty, and error states. — Built in `src/app/mission-and-vision/page.tsx` with 1-hour ISR revalidation, staff preview banner, accessible empty state, and `loading.tsx` skeleton.
- [x] Render approved content responsively with accessible headings and media. — Renders semantic `h1`, `h2`, lead paragraph, `<RichText />`, and conversion pathways (`/contact`, `/careers`) with responsive styling down to 320 px.
- [x] Add page metadata and social preview behavior. — Dynamic `generateMetadata()` with title, description, canonical URL, OpenGraph tags, and indexability controls. Dynamically included in `src/app/sitemap.ts`.
- [x] Test the content flow from edit to public display in staging. — Automated unit & integration tests (`37/37` passing) cover schema validation, role permissions, server actions, and metadata generation.
- [x] Record the reusable pattern for subsequent content types. — Documented below and in `walkthrough.md`.

### Exit criteria / Gate G2

- [x] A content editor can update content without developer help. — Intuitive structured form with fieldsets and clear save/submit actions.
- [x] Invalid input is rejected with an understandable message. — Validated server-side and client-side with descriptive error notices.
- [x] Unauthenticated writes fail and public reads reveal only intended fields. — Unauthenticated and non-AAL2 requests rejected; RLS and public query only return published documents to visitors.
- [x] A successful update appears publicly within the agreed publication/cache interval. — On-demand ISR revalidation (`revalidatePath`) updates the live page immediately upon publication.
- [x] Automated tests cover the critical read and update behavior. — 37 tests covering permissions, schema validation, server actions, and metadata.
- [ ] Product owner accepts the public page and editor workflow on staging. — Pending staging deployment and Armi Escamilla UAT demo.

### Reusable Vertical Slice Architecture Pattern

The successful delivery of the **Mission & Vision** vertical slice establishes the definitive implementation pattern for all subsequent institutional and collection pages in Phases 3 and 4:

1. **Schema & Validation Layer (`src/lib/content/`)**:
   - Define TypeScript row types and input validation schemas with human-readable error messages.
   - Build content extraction helpers to seamlessly transform between database JSONB representations (e.g. `RichTextBlock[]`) and form fields.
2. **Role-Based Authorization Layer (`src/lib/auth/permissions.ts`)**:
   - Enforce database-aligned permission checks in Server Actions (`content.draft.write`, `content.publish`, `content.archive`).
   - Gating logic: Editors can create/save drafts and submit for review; Publishers and Super Admins can publish, unpublish, and request changes.
3. **Admin Content Workspace (`src/app/admin/pages/[slug]/`)**:
   - Server Component gated by `requireAdminSession({ requireAal2: true })` fetching existing document and user permissions.
   - Interactive React 19 client form with `useActionState`, live status badge, version indicator, accessible form controls, and polite `Notice` feedback.
4. **Public Delivery Layer (`src/app/[slug]/`)**:
   - Dynamic `generateMetadata()` computing SEO titles, descriptions, canonical URLs, and OpenGraph social sharing tags.
   - Server Component querying Supabase (with public RLS restricting to `status = 'published'`), supporting internal staff preview mode for drafts, responsive layout, accessible breadcrumbs, and conversion CTAs.
   - Accessible loading skeleton (`loading.tsx`).
5. **Caching & On-Demand Revalidation**:
   - Background ISR revalidation (`export const revalidate = 3600`) paired with immediate cache purging via `revalidatePath()` upon admin publication.
6. **Automated Test Suite**:
   - Fast unit tests for schema validation, permission matrices, server actions, and metadata generation using Vitest.

---

## Phase 3 — Build the Core Public Experience

**Objective:** Complete public navigation and the main company-information journeys.

### Suggested implementation order

- [ ] About Us
- [ ] Services
- [ ] Clients
- [ ] Departments and Team Members
- [ ] Testimonials
- [ ] Home composition using approved content
- [ ] Mission & Vision refinements from the vertical slice
- [ ] Not-found, generic error, loading, and empty states

### Cross-page requirements

- [ ] Use CMS/backend content; avoid duplicating editable business copy in source code.
- [ ] Use stable, human-readable URLs.
- [ ] Preserve semantic heading order and meaningful link text.
- [ ] Require alternative text or an explicit decorative-image choice.
- [ ] Optimize responsive images and prevent layout shift.
- [ ] Support keyboard use, visible focus, zoom, and reduced motion.
- [ ] Handle empty collections and unavailable content without broken layouts.
- [ ] Add unique title, description, canonical URL, Open Graph data, and structured data where appropriate.
- [ ] Include calls to action consistent with the approved conversion goal.

### Exit criteria / Gate G3

- [ ] All core pages match approved designs at supported breakpoints.
- [ ] Navigation, footer links, internal links, and calls to action work.
- [ ] Editors can manage About, Mission & Vision, Services, Departments, and Team Members.
- [ ] Services and team-member ordering is deterministic and editable.
- [ ] Hidden/unpublished records are not returned publicly.
- [ ] Product owner approves the core journey on staging.

---

## Phase 4 — Complete Publishing, Discovery, Administration, and Inquiries

**Objective:** Finish dynamic publishing, discovery, talent, lead-handling, and newsletter workflows.

### Articles

- [ ] Implement article list and detail templates.
- [ ] Define slug uniqueness and behavior when a title or slug changes.
- [ ] Implement draft, in-review, changes-requested, published, unpublished, and archived behavior; scheduled publishing is deferred.
- [ ] Add cover image, author, publish date, rich-text rendering, categories, and tags.
- [ ] Define list ordering, pagination, empty state, and sharing metadata.
- [ ] Add canonical URLs and Article structured data where valid.
- [ ] Sanitize rich content and constrain editor output to supported components.

### Careers, FAQs, and search

- [ ] Implement careers landing page and managed job details with an external application URL.
- [ ] Implement FAQ categories, ordering, accessible disclosure behavior, and published state.
- [ ] Implement a published-content search index for Articles, Services, FAQs, Careers, and approved pages.
- [ ] Add a generated full-text-search vector and GIN index, safe query parsing, relevance ranking, pagination, and limits.
- [ ] Remove unpublished/archived records from search immediately and keep search-result pages `noindex`.

### Administration

- [ ] Complete management views for all approved entities.
- [ ] Add usable validation, confirmations, success/error feedback, empty states, and safe archive/delete behavior.
- [ ] Enforce roles and permissions server-side, not only by hiding UI.
- [ ] Add append-only audit/history for publishing, inquiry access/status, and role changes.
- [ ] Prevent deletion of referenced departments or define reassignment behavior.

### Contact inquiries

- [ ] Validate and normalize input on the server.
- [ ] Add server-verified Turnstile, approved rate rules, 10 KB body limit, honeypot/time trap, and duplicate prevention.
- [ ] Store only approved fields and record timestamps/status safely.
- [ ] Send a notification without exposing visitor data in logs.
- [ ] Provide a confirmation that does not reveal internal delivery details.
- [ ] Add failure handling so a stored inquiry is not lost if email notification fails.
- [ ] Limit inquiry access to authorized staff.
- [ ] Support new, read, replied, and archived states as approved.
- [ ] Implement the approved retention/deletion procedure.
- [ ] Test email authentication and delivery for the production sending domain.

### Newsletter signup

- [ ] Implement a separate optional newsletter consent with version/source/timestamp evidence.
- [ ] Implement double opt-in, confirmation-token hashing/expiry, unsubscribe, and minimal suppression state.
- [ ] Rate-limit and bot-protect subscription attempts without coupling them to contact consent.
- [ ] Keep campaign authoring and bulk newsletter delivery outside the custom admin launch scope.

### Exit criteria / Gate G4

- [ ] Draft/unpublished articles never appear publicly or in the sitemap.
- [ ] Article slugs, rich text, images, dates, list order, and metadata work as specified.
- [ ] Careers, FAQ filtering, categories/tags, pagination, and published-content search pass their acceptance tests.
- [ ] Admin permissions pass positive and negative authorization tests.
- [ ] A valid inquiry is stored exactly once and the correct recipient is notified.
- [ ] Invalid, oversized, repeated, and bot-like submissions are safely handled.
- [ ] Notification failure is observable and does not silently discard the inquiry.
- [ ] Authorized staff can review and update inquiry status without viewing unrelated admin functions.
- [ ] Newsletter subscription requires confirmation, unsubscribe works, and consent evidence is retained as specified.

---

## Phase 5 — Content, Hardening, QA, and Acceptance

**Objective:** Replace development assumptions with approved production content and demonstrate release readiness.

### Content and SEO

- [ ] Load, proofread, and approve all production text and media.
- [ ] Verify names, positions, service details, contact details, and legal text with content owners.
- [ ] Check image licensing, consent, cropping, compression, dimensions, and alt text.
- [ ] Complete titles, descriptions, canonical URLs, Open Graph images, sitemap, and robots rules.
- [ ] Prepare redirect mappings for every replaced public URL.
- [ ] Verify structured data with an appropriate validator.

### Quality assurance

- [ ] Test every content create/read/update/archive or delete workflow.
- [ ] Test authentication, authorization, session expiry, password/reset workflow supplied by the provider, and access revocation.
- [ ] Test keyboard-only navigation, focus order, forms, labels, errors, contrast, zoom, reduced motion, and screen-reader landmarks.
- [ ] Test latest stable Chrome, Edge, Firefox, and Safari, plus agreed mobile devices/viewports.
- [ ] Test slow/loading, empty, malformed, unavailable, and server-error states.
- [ ] Test broken/missing media fallbacks.
- [ ] Test inquiry delivery, retry/alert behavior, rate limiting, spam controls, status management, and retention.
- [ ] Check broken links, redirects, 404 behavior, sitemap contents, indexing directives, and metadata.
- [ ] Run Lighthouse or equivalent against production-mode staging and investigate material regressions.
- [ ] Run dependency, secret, and application security checks; resolve release-blocking findings.
- [ ] Execute a backup and restore rehearsal with non-production data.
- [ ] Execute the deployment and rollback runbooks in staging.

### User acceptance testing

- [ ] Provide role-based scripts for public visitor, content editor, publisher/admin, and inquiry manager.
- [ ] Record each issue with severity, reproduction steps, owner, and target date.
- [ ] Product owner signs off all acceptance criteria and any explicitly accepted low-risk defects.

### Exit criteria / Gate G5 — Release candidate

- [ ] No open Severity 1 or Severity 2 defects.
- [ ] All launch content and legal/privacy copy is approved.
- [ ] Accessibility target is met or documented exceptions have an approved remediation date.
- [ ] Performance budgets are met or exceptions are explicitly accepted.
- [ ] Security review, backup/restore rehearsal, and rollback rehearsal pass.
- [ ] Monitoring, alerts, analytics/consent, DNS plan, redirects, and support contacts are ready.
- [ ] Product owner, technical approver, content owner, and production owner approve launch.

---

## Phase 6 — Launch, Stabilize, and Hand Over

**Objective:** Release safely, verify the real production path, and transfer sustainable ownership.

### Before launch

- [ ] Freeze non-critical content/schema changes.
- [ ] Take or confirm the latest backup.
- [ ] Confirm production secrets, sender/domain verification, least-privilege accounts, and multi-factor authentication.
- [ ] Lower DNS TTL in advance if the domain owner and migration plan require it.
- [ ] Confirm maintenance window, internal communications, rollback authority, and incident channel.
- [ ] Capture current-site URLs and final redirect list if replacing an existing site.

### Launch sequence

- [ ] Deploy the approved release artifact.
- [ ] Apply production schema/content migrations using the approved runbook.
- [ ] Connect or switch the domain and confirm HTTPS.
- [ ] Run production smoke tests: home, navigation, every page type, article, media, contact submission, email notification, admin login, and content update.
- [ ] Verify redirects, canonical host, sitemap, robots rules, analytics/consent, error tracking, and monitoring.
- [ ] Submit or verify the sitemap in the approved search-console account.
- [ ] Announce launch only after the smoke-test owner approves production.

### Rollback triggers

- public site is unavailable or materially broken;
- admin or private inquiry data is exposed;
- authentication/authorization is bypassed;
- inquiries cannot be safely stored;
- migration causes material content or data loss;
- a critical redirect, DNS, or certificate failure prevents normal use.

### Hypercare and handover

- [ ] Monitor errors, uptime, form failures, email delivery, performance, and indexing daily for the first five business days.
- [ ] Triage launch defects under the severity policy in Section 10.
- [ ] Train editors using real workflows and verify that they can complete the training checklist.
- [ ] Deliver admin guide, technical README, architecture record, data dictionary, deployment/rollback runbook, backup/restore guide, access register, vendor/cost list, and maintenance schedule.
- [ ] Review outcomes and create a prioritized post-launch backlog.

### Exit criteria / Gate G6 — Project handover

- [ ] Production has been stable through the agreed hypercare period.
- [ ] No unresolved release-blocking defect or security incident remains.
- [ ] Named owners accept operational access, documentation, backups, billing, content governance, and maintenance.
- [ ] The product owner signs the handover record.

---

## 8. Functional Acceptance Checklist

### Public website

- [ ] Home presents OPG clearly and leads to the primary call to action.
- [ ] About Us content is editable and displays correctly.
- [ ] Mission & Vision content is editable and displays correctly.
- [ ] Team members are grouped by active department and ordered consistently.
- [ ] Services are editable, reorderable, and handle missing optional media.
- [ ] Approved Clients and Testimonials display in the configured order and hidden records are absent.
- [ ] Careers shows only active openings and each Apply action uses the approved external destination.
- [ ] Article list shows only published articles in the agreed order.
- [ ] Article details, author/category/tag pages, and pagination resolve correctly; invalid slugs return a correct not-found response.
- [ ] FAQs are accessible and site search returns only published, approved content.
- [ ] Contact form validates input, prevents accidental duplicates, and gives accessible feedback.
- [ ] Newsletter double opt-in, confirmation, and unsubscribe work with separate consent.
- [ ] Privacy, Cookie, and Terms pages are linked from the footer and show approved versions.
- [ ] Header, footer, mobile navigation, 404, errors, and empty states work.

### Administration

- [ ] Authorized users can sign in and sign out securely.
- [ ] Publisher, Inquiry Manager, and Super Admin users complete MFA before sensitive actions.
- [ ] Protected data and mutations enforce authorization on the server.
- [ ] Editors can create/edit drafts and submit for review but cannot publish or view inquiries.
- [ ] Publishers can review, publish, unpublish, and archive but cannot assign roles or view inquiries by default.
- [ ] Inquiry Managers can handle inquiries without access to content publishing or user administration.
- [ ] Only Super Admin can invite users and change roles.
- [ ] Draft, in-review, published, unpublished, and archived behavior matches the approved workflow.
- [ ] Media restrictions and alternative-text rules are enforced.
- [ ] Destructive actions require suitable confirmation and follow the archive/delete policy.
- [ ] Inquiry access and status changes are restricted to approved roles.

### Operations

- [ ] Production deploy and rollback are documented and rehearsed.
- [ ] Backup and restore are documented, owned, and tested.
- [ ] Monitoring detects site errors and failed contact notifications.
- [ ] Secrets and production access are stored outside the repository and reviewed.
- [ ] Domain, DNS, certificate, email service, analytics, and vendor billing have named owners.

---

## 9. Definition of Ready and Definition of Done

### A ticket is ready when

- the user or business value is clear;
- acceptance criteria are testable;
- required design and copy are attached or explicitly marked as placeholder;
- data, permission, error, empty, responsive, accessibility, and analytics behavior is defined where relevant;
- dependencies and approver are named;
- it is small enough to complete and review within one sprint.

### A ticket is done when

- acceptance criteria pass;
- code has been reviewed and merged through the agreed workflow;
- lint, type, test, and production build checks pass;
- responsive, keyboard, and accessibility behavior has been checked;
- authorization and input validation are tested where applicable;
- loading, empty, success, and failure paths are handled;
- no secrets or personal data appear in source control or logs;
- documentation and content-model changes are updated;
- the feature is verified in staging by its named approver.

---

## 10. Defect Severity and Release Policy

| Severity | Meaning | Release effect |
|---|---|---|
| S1 — Critical | Security/privacy exposure, data loss, site unavailable, or core authorization bypass | Stop work/release; fix or roll back immediately |
| S2 — High | Core page/workflow unusable, inquiries lost, major accessibility blocker, or no viable workaround | Blocks launch |
| S3 — Medium | Material defect with a reasonable workaround or limited affected scope | Fix before launch when feasible; otherwise require owner/date |
| S4 — Low | Cosmetic or minor content issue with no meaningful task impact | May enter post-launch backlog |

No launch proceeds with an open S1 or S2. Accepted S3/S4 issues must have a named owner and target date.

---

## 11. Roles and Decision Ownership

One person may hold multiple responsibilities, but company accounts require a backup owner and privacy approval must come from an authorized reviewer.

| Role | Accountable for |
|---|---|
| Product owner — Armi Escamilla | Scope, priority, acceptance, launch decision |
| Developer/technical lead | Architecture, estimates, implementation, technical quality, documentation |
| Brand/design approver | Visual direction, assets, responsive designs, brand consistency |
| Content owner(s) — TBD by content group | Complete and accurate copy/media, content approvals, ongoing governance |
| Privacy/security reviewer | Privacy notice, inquiry handling, retention, access, security review |
| Initial Super Admin and production/release owner — Aki Zita | User invitations/roles, hosting, deployment, production configuration, analytics, email, and secrets |
| Infrastructure/domain owner | DNS, SSL, company vendor accounts, billing, and recovery contacts |
| Editors | Draft creation, CMS user testing, and content updates |
| Publishers | Review, approval, publication, unpublication, and archive |
| Inquiry Managers | Personal inquiry access, assignment, status, notes, and retention handling |

Approval rule: feedback is consolidated by the product owner. Conflicting stakeholder comments do not go directly into development until the product owner resolves them.

---

## 12. Risk Register

| Risk | Probability / impact | Mitigation | Owner |
|---|---|---|---|
| Vendor account, region, or paid-plan decision arrives late | Medium / High | Build locally/staging first; make production account and recovery verification a Gate G5 requirement | Production owner |
| Final copy/photos arrive late | High / High | Content matrix from week 1; weekly readiness review; publish only approved content | Content owner |
| Scope grows during implementation | High / High | Scope baseline and change control; exchange scope or move additions post-launch | Product owner |
| Domain/DNS access is unavailable | Medium / High | Identify owner and verify access in Phase 0; rehearse DNS plan | Infrastructure owner |
| Email is blocked or marked as spam | Medium / High | Verify sender domain early; test SPF/DKIM/DMARC and failure alerts | Infrastructure owner |
| Contact form attracts spam/abuse | High / Medium | Rate limits, bot protection, validation, logging without message content | Developer |
| Personal inquiry data is overexposed/retained | Medium / High | Least privilege, approved retention, redacted logs, deletion procedure | Privacy owner |
| Custom admin takes longer than expected | Medium / High | Decide CMS early; prove a vertical slice; avoid unapproved admin features | Developer |
| Rich text causes design/security issues | Medium / High | Allowlist supported content, sanitize output, test representative articles | Developer |
| Production content breaks layouts | Medium / Medium | Test realistic longest/shortest content and image ratios before UAT | Design/content owner |
| Deployment has no safe rollback | Low / High | Immutable release artifact, documented rollback, rehearsal at Gate G5 | Technical lead |
| Single-person production dependency | Medium / High | Use company-owned accounts and assign a backup production/billing/recovery owner before launch | Product owner |

Review this register at least weekly. Add a trigger, mitigation, and owner whenever a new material risk is discovered.

---

## 13. Working Cadence and Progress Tracking

### Weekly rhythm

- **Planning:** Select only ready tickets that fit available capacity.
- **Midweek review:** Check blockers, decisions, content readiness, and risks.
- **End-of-week demo:** Demonstrate working software in staging, not screenshots alone.
- **Acceptance:** Product owner accepts or returns work against written criteria.
- **Retrospective:** Record one or two concrete process improvements.

### Status values

Use: `Not started`, `In progress`, `In review`, `Blocked`, `Accepted`, or `Deferred`.

### Milestone tracker

| Gate | Status | Target | Approved by | Evidence / notes |
|---|---|---|---|---|
| G0 — Scope and technical approval | Decisions recorded; ticket estimates remain | Alongside Phase 1 | Aki Zita (technical/production) + Armi Escamilla (general approver) | Phase 0 decisions simplified and recorded 2026-09-18. Remaining: ticket estimates, Vercel access, company repo. |
| G1 — Foundations ready | In progress | TBD after G0 schedule | Aki Zita | Pinned scaffold/local checks and Supabase staging connection pass; design system, base components, auth, schema, and media work starting |
| G2 — Vertical slice accepted | Not started | TBD | TBD | |
| G3 — Core public experience accepted | Not started | TBD | TBD | |
| G4 — Publishing/admin/inquiries accepted | Not started | TBD | TBD | |
| G5 — Release candidate approved | Not started | TBD | TBD | |
| G6 — Production handover accepted | Not started | TBD | TBD | |

### Decision log

| ID | Date | Decision | Owner | Consequence |
|---|---|---|---|---|
| ADR-001 | 2026-09-12 | Next.js + Supabase; Vercel frontend default | Armi Escamilla | Foundation development may begin |
| ADR-002 | 2026-09-12 | Custom admin with Editor, Publisher, Inquiry Manager, and Super Admin permissions | Armi Escamilla | Requires custom admin, RLS, MFA, and permission tests |
| ADR-003 | 2026-09-12 | Draft → review → publish workflow with audit and archive-first deletion | Armi Escamilla | Scheduled publishing is deferred |
| ADR-004 | 2026-09-12 | Clients, Careers, FAQs, testimonials, newsletter signup, search, categories, and tags included; multilingual deferred | Armi Escamilla | Expands estimate to 16–20 weeks |
| ADR-005 | 2026-09-12 | Turnstile, rate/dedup controls, Resend, and reliable notification outbox | Armi Escamilla | Delivery failure cannot lose stored inquiries |
| ADR-006 | 2026-09-12 | Proposed 12-month contact retention and Section 9 retention schedule | Armi Escamilla | Requires privacy/legal approval |
| ADR-007 | 2026-09-12 | Consent-aware analytics and no advertising trackers at launch | Armi Escamilla | Analytics remains off until consent behavior and notice are approved |
| ADR-008 | 2026-09-12 | PostgreSQL full-text search for published content | Armi Escamilla | No external search provider at launch |
| ADR-009 | 2026-09-12 | Public site supports 320 px upward; admin supports 768 px upward | Armi Escamilla + Aki Zita | Defines responsive acceptance widths |
| ADR-010 | 2026-09-12 | Aki Zita is the initial Super Admin and production/release owner | Aki Zita | Aki is bootstrapped once; later role assignments occur through the protected admin |
| ADR-011 | 2026-09-12 | `https://opglobal.com.hk` is the provisional canonical and `www` will redirect to apex | Armi Escamilla | DNS ownership and redirect verification remain |
| ADR-012 | 2026-09-12 | Create separate website Supabase projects under OPGlobal; do not reuse Time Tracker; propose Singapore primary region for global CDN delivery | Aki Zita | Connected integration currently shows HackHub; reconnect it and confirm traffic/residency before creation |
| ADR-013 | 2026-09-15 | Draft/previews stay non-indexable; only approved public URLs enter the sitemap | Aki Zita | Indexing requires the production release checklist |
| ADR-014 | 2026-09-18 | GitHub (`akizita/opg-official-website`), Vercel (hosting), Resend (email), Crazy Domains (domain); Vercel and domain access pending | Aki Zita | Initial commit pushed; deployment and domain configuration deferred until access granted |

---

## 14. Immediate Next Actions

Track these as the next actions. Phase 1 foundation work proceeds now; account/vendor access is resolved in parallel.

- [x] 1. Reconnected the Supabase integration to OPGlobal and verified `opg-website-staging`; Time Tracker remains untouched.
- [x] 2. Confirm company control/invite delivery for Aki's supplied login address (`aki.zita@freedompropertyinvestors.com.au`); OPGlobal dashboard access is shown in Aki's screenshot. — Verified via 2026-09-18 screenshot.
- [x] 3. Created `opg-website-staging` under OPGlobal as a Micro project in Tokyo and verified its URL/publishable key; production remains uncreated.
- [x] 4. Scaffold the pinned Next.js/TypeScript application and Supabase local project; add `.env.example`, lint, type, test, and build checks. Docker is still required for local Supabase runtime tests.
- [x] 5. Created and applied the identity/role migrations with explicit grants, RLS, database MFA enforcement, append-only audit, last-Super-Admin protection, and 28 passing staging policy tests.
- [ ] 6. Invite and bootstrap Aki as the only initial Super Admin; verify Aki can invite/assign roles and other roles cannot. — Requires Auth configuration (Phase 1).
- [x] 7. Name the technical, privacy/legal, and brand approvers plus a backup production owner. — Simplified 2026-09-18: Armi is general approver, Aki is technical/production owner.
- [ ] 8. Confirm company ownership/access for Git, Vercel, Resend, Turnstile, monitoring, analytics, and domain. — Vercel access pending; others resolved during implementation.
- [x] 9. Create the sitemap, content inventory, and asset register; leave content owners `TBD` until a named person accepts each group. — Simplified: wireframe guide Section 4 is the sitemap; Aki coordinates content, Armi approves.
- [x] 10. Use `OPG-Wireframe-Approval-Guide.md` as a task-based screen checklist during demos/UAT; no separate Armi wireframe meeting is needed before development. — Guide approved 2026-09-18.
- [x] 11. Have the authorized reviewer approve the legal entity/jurisdiction, notices, consent language, vendor disclosure, and retention baseline. — Developer drafts standard notices; no external legal review needed per Aki 2026-09-18.
- [x] 12. Crawl the existing website and prepare the URL/redirect inventory, Tag Manager audit, and search-performance baseline. — N/A: new site, not migrating from HubSpot.
- [ ] 13. Convert Phases 1–6 into estimated tickets and replace indicative weeks with dates based on team capacity and content availability. — In progress alongside Phase 1.
- [ ] 14. Close Gate G0 when the remaining approvals are recorded; limit implementation to foundation and the Mission & Vision vertical slice until then. — Phase 1 proceeding; G0 closes after ticket estimates.
- [ ] 15. **Phase 1: Build design system tokens, base components, header/nav/footer, content schemas, auth config, and media setup.** — Starting now.

---

## 15. Maintenance Roadmap After Launch

### First 30 days

- [ ] Review errors, uptime, email delivery, spam rate, inquiries, search indexing, and performance weekly.
- [ ] Fix launch regressions and high-value content issues.
- [ ] Verify editors are following publishing and image guidelines.
- [ ] Review access granted during development and remove unneeded accounts.

### Monthly

- [ ] Install tested security and dependency updates.
- [ ] Review failed forms, logs, uptime, backups, storage, and service costs.
- [ ] Confirm new content quality, broken links, and expiring staff/service information.
- [ ] Export or review inquiry records under the approved retention policy.

### Quarterly

- [ ] Test restore and rollback procedures.
- [ ] Audit users, roles, secrets, domains, certificates, vendors, and billing owners.
- [ ] Review accessibility, performance trends, search performance, and content effectiveness.
- [ ] Prioritize the next roadmap increment using evidence rather than adding features ad hoc.

### Annually

- [ ] Review privacy/legal content and data retention.
- [ ] Renew domains/services and validate ownership contacts.
- [ ] Reassess supported runtimes, major framework/CMS upgrades, disaster recovery, and the architecture decision record.

---

## Change Log

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-09-18 | Recorded Aki's Phase 0 decisions: Armi Escamilla as general approver, DNS/domain migration N/A (new site), existing-site audit N/A (not migrating HubSpot), developer-drafted privacy/legal notices approved, content ownership simplified to Aki-coordinates/Armi-approves, Supabase access re-verified. Phase 1 foundation development proceeding. |
| 1.0 | 2026-09-16 | Connected to OPGlobal staging; applied and verified identity/RBAC/RLS/audit migrations; passed 28 policy tests; recorded public-signup Auth configuration blocker |
| 0.9 | 2026-09-16 | Recorded and verified the dedicated OPGlobal staging project, Tokyo region, project reference, secret-safe local configuration, and successful Auth endpoint check |
| 0.8 | 2026-09-15 | Corrected Supabase access evidence: Aki's screenshot shows a signed-in OPGlobal Chrome profile; agent Chrome/connector access remains separate and unverified |
| 0.7 | 2026-09-15 | Recorded Aki's requested login address, waived separate upfront Armi wireframe review per Aki, and retained account verification, screen acceptance, schedule, content, and technical G0 checks |
| 0.6 | 2026-09-15 | Audited Phase 0 against Gate G0, kept it open, distinguished local Phase 1 progress from account/approval blockers, and updated milestone handoff status |
| 0.5 | 2026-09-15 | Began and verified the local Phase 1 scaffold, documented global CDN/single-region delivery, machine/DNS constraints, and kept drafts non-indexable and cloud resources untouched |
| 0.4 | 2026-09-12 | Named Aki Zita as initial Super Admin/release owner, recorded the Supabase screenshot and integration mismatch, established `opglobal.com.hk` as the provisional canonical, captured initial live-site evidence, and linked the wireframe approval guide |
| 0.3 | 2026-09-12 | Recorded approved Next.js + Supabase architecture, expanded launch scope, roles/workflow, abuse controls, privacy/retention baseline, SEO plan, quality targets, ownership, and revised 16–20 week estimate |
| 0.2 | 2026-09-11 | Converted actionable roadmap work and gates into progress-tracking checklists |
| 0.1 | 2026-09-11 | Initial execution roadmap derived from the architecture document |
