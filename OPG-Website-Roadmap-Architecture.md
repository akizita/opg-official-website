# OPG Official Website — Approved System Architecture

**Document status:** Architecture baseline for implementation  
**Version:** 1.2  
**Date:** 2026-09-15  
**Product owner:** Armi Escamilla  
**Initial Super Admin and production/release owner:** Aki Zita  
**Selected stack:** Next.js + Supabase  

---

## 1. Executive Decision

OPG will build a responsive, content-managed official website for a **global** audience with two primary paths:

1. **Potential clients**, whose primary conversion is submitting a qualified service inquiry.
2. **Potential talent**, whose primary conversion is viewing an open role and continuing to the approved application channel.

The application will use:

| Layer | Decision |
|---|---|
| Web application | Next.js App Router with TypeScript |
| Public rendering | Server Components by default; Client Components only for interactive controls |
| Admin interface | Custom Next.js admin, responsive from 768 px tablet width upward |
| Database | PostgreSQL managed by Supabase |
| Authentication | Supabase Auth, invite-only for staff |
| Authorization | Database-enforced role and permission checks with Row Level Security (RLS) |
| Media | Supabase Storage with separate draft and published media handling |
| Search | PostgreSQL full-text search over published content |
| Transactional email | Resend, behind an application adapter |
| Bot protection | Cloudflare Turnstile, verified on the server |
| Frontend hosting | Vercel is the implementation default; another Next.js-compatible host requires an ADR change |
| Monitoring | Application error monitoring, external uptime checks, Vercel runtime logs, and Supabase logs |
| Analytics | GA4 or an approved equivalent, disabled until analytics consent when consent is required |

Next.js is the web framework and Supabase is the managed backend; neither phrase alone completely identifies the frontend hosting environment. This baseline therefore assumes Vercel for the Next.js deployment and Supabase Cloud for database, authentication, and storage.

The architecture may now proceed into Phase 1. Branding, final copy, legal approval, vendor account details, and production addresses can be supplied while the technical foundation is being built.

---

## 2. Scope Baseline

### 2.1 Public launch scope

- Home
- About Us
- Mission & Vision
- Services
- Clients
- Meet the Team, grouped by department
- Careers landing page and job listings
- Articles listing and article details
- Article categories and tags
- FAQs
- Testimonials
- Site-wide search
- Contact Us and inquiry submission
- Newsletter signup with double opt-in
- Privacy Notice
- Cookie Notice
- Terms of Use
- Accessible 404, error, loading, empty, and form-result states

### 2.2 Administration scope

- Invite-only staff authentication
- Editor, Publisher, Inquiry Manager, and Super Admin permissions
- Draft, review, publication, unpublication, and archive workflow
- Management of all approved public content types
- Media upload and alternative-text management
- Inquiry review, assignment, notes, status changes, and archive
- Newsletter subscriber status view; campaigns are not sent from the custom admin at launch
- Append-only audit history for sensitive or publishing actions
- Preview of drafts without exposing drafts to public search or indexing

### 2.3 Explicitly deferred

- Multiple languages
- Customer accounts or portal
- Native applicant tracking or CV/file collection
- CRM automation
- Newsletter campaign composer and bulk mail delivery
- E-commerce and payments
- Real-time chat
- Native mobile applications

Job listings will link to an OPG-approved external application destination. Adding an application form or CV uploads later requires a separate privacy, retention, and access-control review.

---

## 3. Ownership and Governance

### 3.1 Named ownership

| Responsibility | Owner |
|---|---|
| Product scope, priority, acceptance, and launch decision | Armi Escamilla |
| Content accountability and final content approval | To be assigned per content group during Phase 0/early delivery |
| Initial Super Admin | Aki Zita |
| Production configuration, deployments, analytics, email, and secrets | Aki Zita |
| Day-to-day writing | Assigned Editor(s) |
| Publication approval | Assigned Publisher(s) |
| Privacy/legal approval | OPG-authorized legal or privacy reviewer; name still required |
| DNS and vendor billing | Company-owned OPG account with at least one backup account owner |

Content owners may be assigned later, but every item must have a named person before its content-freeze date. Do not put only a mailbox in the `Owner` column: a person's name answers “who is accountable?” An **OPG-owned shared email address** separately answers “where should operational communication continue if staff changes?” Until owners are assigned, use `TBD` rather than silently making the product owner responsible for every asset.

### 3.2 Admin roles

| Capability | Editor | Publisher | Inquiry Manager | Super Admin |
|---|:---:|:---:|:---:|:---:|
| View content workspace | Yes | Yes | No | Yes |
| Create/edit drafts and upload draft media | Yes | Yes | No | Yes |
| Submit content for review | Yes | Yes | No | Yes |
| Request changes | No | Yes | No | Yes |
| Publish, unpublish, and archive content | No | Yes | No | Yes |
| View/manage contact inquiries | No | No | Yes | Yes |
| View subscriber status | No | No | Optional | Yes |
| Invite users or change roles | No | No | No | Yes |
| Change site-wide operational settings | No | No | No | Yes |

The Publisher role may publish its own work for the initial small team. If OPG later requires a two-person approval rule, add `reviewed_by != author_id` as a workflow rule without changing the role model.

Aki Zita is the only initial Super Admin. The account must use Aki's OPG-managed email address, require MFA, and be bootstrapped once in the first website project. After that bootstrap, Aki can invite users and assign Editor, Publisher, Inquiry Manager, or Super Admin access through the custom admin. A second Super Admin is not required immediately, but a named recovery/backup owner is required before production launch.

### 3.3 Editorial workflow

```text
Draft → In review → Published → Archived
  ▲         │            │
  └─ Changes requested ──┘
                         └─ Unpublish → Draft
```

- Editors can save drafts and submit them for review.
- Publishers can request changes, publish, unpublish, or archive.
- Every publication action records actor, time, content type, content ID, and before/after status.
- Slug changes after publication require an automatic redirect record from the previous URL.
- Hard deletion of published content is disabled in the normal admin UI. Archive is the default.
- Scheduled publishing is deferred until the manual workflow is stable.

### 3.4 Initial Super Admin bootstrap

The first Super Admin cannot be created safely from a name alone. Supabase Auth needs Aki Zita's OPG-managed email address and a dedicated website project.

1. Reconnect the Supabase integration to the OPGlobal organization.
2. Create `opg-website-staging`; do not use the existing Time Tracker project.
3. Apply the identity, role, permission, audit, and RLS migrations.
4. Send an Auth invitation to Aki's OPG-managed email from the Dashboard or a trusted server operation.
5. Assign the new Auth user ID the `super_admin` role through a one-time audited bootstrap operation.
6. Require Aki to enroll TOTP MFA before the admin dashboard or role-management actions are available.
7. Verify that Aki can invite and assign Editor, Publisher, and Inquiry Manager roles, and that non-Super-Admins cannot access those operations.
8. Disable/remove the one-time bootstrap path so future role changes occur only through the protected admin workflow.

Protect against removing the final active Super Admin. Aki may invite another Super Admin later, but that action requires confirmation, MFA assurance level `aal2`, and an audit record. Separately, enable MFA on Aki's Supabase platform account; the platform account and the website admin account are two distinct security contexts.

---

## 4. System Context

```text
Visitors and OPG staff
          │ HTTPS
          ▼
Vercel CDN + Next.js application
  ├─ Public Server Components
  ├─ Admin UI and Server Actions
  ├─ Contact/newsletter Route Handlers
  ├─ Search endpoint
  └─ Resend webhook endpoint
          │
          ├──────── Cloudflare Turnstile (bot verification)
          │
          ▼
Supabase Cloud
  ├─ Auth (invite-only staff sessions)
  ├─ PostgreSQL (content, roles, inquiries, audit, outbox)
  ├─ Storage (draft and published media)
  └─ Cron/worker (notification retries and retention jobs)
          │
          ▼
Resend → OPG shared mailboxes

Consent-aware analytics and error/uptime monitoring observe the web application.
```

### 4.1 Trust boundaries

- The browser receives only public configuration and a Supabase publishable key. It never receives a Supabase secret/service key, Resend key, Turnstile secret, database URL, or signing secret.
- Public content reads return only published, active records.
- Admin mutations run through Server Actions using the signed-in user's identity; RLS remains an enforcement layer even if UI checks fail.
- Public contact and newsletter submissions go through server Route Handlers. Visitors do not insert sensitive rows directly into Supabase.
- The server-only Supabase secret client is limited to narrowly defined operations such as verified public form ingestion, notification workers, and Super Admin user provisioning.
- Third-party webhooks use signature verification, idempotency, size limits, and safe logging.

---

## 5. Application Architecture

### 5.1 Next.js organization

```text
src/
  app/
    (public)/             Public routes and layouts
    (admin)/admin/        Authenticated admin routes
    api/contact/          Public inquiry endpoint
    api/newsletter/       Double-opt-in endpoint
    api/search/           Published-content search
    api/webhooks/resend/  Delivery/bounce events
    sitemap.ts
    robots.ts
    not-found.tsx
    global-error.tsx
  components/
    public/
    admin/
    forms/
    ui/
  features/               Domain modules and use cases
  lib/
    auth/
    email/
    supabase/
    validation/
    monitoring/
  content/                Seed/reference content only; not editable production copy
supabase/
  migrations/
  seed.sql
  tests/                  RLS allow/deny tests
```

### 5.2 Rendering and data access

- Use Server Components for public content, metadata, and authenticated admin reads.
- Use small Client Components for navigation toggles, form interaction, search input, rich-text editing, and other browser-only behavior.
- Use Server Actions for internal admin mutations and Route Handlers for public endpoints and third-party webhooks.
- Use the default Node.js runtime. Edge runtime requires a measured need and compatibility review.
- Cache published public content and invalidate the affected route/tag immediately after publication. Admin pages and preview reads use no shared cache.
- Fetch independent content in parallel and add route-level loading/error boundaries.
- Use `next/image` with explicit dimensions or `fill` plus correct `sizes` values.
- Use the Next.js Metadata API for titles, descriptions, canonical URLs, social cards, robots, and sitemap generation.

### 5.3 Public route map

| Route | Purpose |
|---|---|
| `/` | Home and primary audience paths |
| `/about` | Company overview |
| `/mission-and-vision` | Mission and vision |
| `/services` and `/services/[slug]` | Client services |
| `/clients` | Approved client logos/content |
| `/team` | Team grouped by department |
| `/careers` and `/careers/[slug]` | Careers and open roles |
| `/articles` and `/articles/[slug]` | Published articles |
| `/articles/category/[slug]` | Category landing page |
| `/articles/tag/[slug]` | Tag landing page |
| `/faqs` | Filterable frequently asked questions |
| `/search?q=` | Published-content search results; query pages are `noindex` |
| `/contact` | Client/talent inquiry entry point |
| `/privacy`, `/cookies`, `/terms` | Legal information |

### 5.4 Admin route map

The admin is organized by task rather than mirroring database tables: Dashboard, Pages, Services, Clients, Team, Careers, Articles, FAQs, Testimonials, Media, Inquiries, Subscribers, Redirects, Audit, and Users & Roles. Navigation items are permission-filtered, but access is always rechecked on the server and in the database.

---

## 6. Data and Content Model

### 6.1 Common publishing fields

Every independently publishable content record uses, where applicable:

- `id uuid`
- `title`
- `slug` with a unique normalized index
- `status`: `draft`, `in_review`, `published`, or `archived`
- `summary`
- structured rich-text `content` with no arbitrary executable HTML
- `seo_title`, `seo_description`, `canonical_url`, `social_image_id`
- `created_by`, `updated_by`, `reviewed_by`, `published_by`
- `created_at`, `updated_at`, `published_at`, `archived_at`
- `is_active` and `display_order` for ordered collections

Validation limits are shared between form schemas and database constraints where possible. Timestamps are stored in UTC and displayed in the user's locale.

### 6.2 Core tables

| Domain | Tables | Important notes |
|---|---|---|
| Identity | `admin_profiles`, `roles`, `permissions`, `role_permissions` | `admin_profiles.id` references `auth.users`; no passwords or custom auth secrets are stored here |
| Site structure | `site_settings`, `navigation_items`, `page_documents` | Site identity, social links, contact details, footer, home/about/mission/careers documents |
| Media | `media_assets` | Bucket/path, MIME type, dimensions, alt text, attribution, state, uploader |
| Organization | `departments`, `team_members` | Active state and deterministic order |
| Services | `services` | Summary, body, icon/image, CTA, order, SEO |
| Clients | `clients` | Name, logo, URL, display permission, order; no confidential relationship data |
| Social proof | `testimonials` | Quote, attribution, role/company, consent reference, order, status |
| Careers | `job_openings` | Location, work arrangement, employment type, description, close date, external apply URL |
| Articles | `authors`, `articles`, `categories`, `tags`, `article_categories`, `article_tags` | Many-to-many category/tag relations; stable article slugs |
| FAQs | `faq_categories`, `faqs` | Question, answer, order, active/published state |
| Search | `search_documents` | Published title, excerpt, URL, type, and generated `tsvector` with GIN index |
| Inquiries | `contact_inquiries`, `inquiry_events` | Personal data, assignment, internal notes, status, retention/deletion timestamps |
| Newsletter | `newsletter_subscriptions` | Normalized email, status, consent version/source/time, confirmation-token hash and expiry |
| Reliability | `notification_outbox`, `processed_webhooks` | Retry state and webhook deduplication |
| Governance | `audit_log`, `redirects` | Append-only actions and permanent redirect mappings |

### 6.3 Search behavior

- Index published Articles, Services, FAQs, Careers, and approved page documents.
- Use a stored `tsvector` and GIN index with weighted title, summary, and body fields.
- Use a safe web-search query parser, a 100-character query limit, pagination, and an upper result limit.
- Remove documents from the search index immediately when content is unpublished or archived.
- Do not index admin data, inquiries, subscriber data, draft content, internal notes, or audit events.

### 6.4 Media lifecycle

- Editors upload to a private `draft-media` bucket.
- Allowed launch formats: JPEG, PNG, WebP, AVIF, and approved SVG files; reject executable or mismatched MIME content.
- Default image limit: 5 MB per image before optimization. Larger original assets are handled outside the CMS.
- Alternative text is required unless the asset is explicitly marked decorative.
- Publishing copies/derives the approved asset into `public-media`; unreferenced draft files are cleaned up after a safe grace period.
- Filenames are generated; user filenames are retained only as sanitized metadata.

---

## 7. Authentication, Authorization, and Security

### 7.1 Authentication

- Public account registration is disabled.
- Super Admin invites staff through Supabase Auth.
- Publisher, Inquiry Manager, and Super Admin accounts must enroll in MFA before sensitive actions. MFA for Editors is strongly recommended.
- Sessions use secure, HTTP-only cookie handling through the Supabase SSR integration.
- Password recovery and invitation emails use OPG's custom SMTP provider so templates and sender identity are company controlled.
- Removing a staff member includes role removal, session revocation/sign-out, account disablement, and access-register update.

### 7.2 Authorization

- Permissions are modeled explicitly; role names are conveniences, not the only authorization check.
- Custom access-token claims may carry the role for fast checks, but database policies remain authoritative and sessions must be refreshed after a role change.
- Never authorize from user-editable metadata.
- Enable RLS on every table in an exposed schema.
- Revoke default `anon` and `authenticated` grants, then grant back only the operations each role needs.
- Write separate RLS policies and allow/deny tests for select, insert, update, and archive/delete behavior.
- Public views use security-invoker behavior or remain inaccessible to client roles.
- Secret/service keys exist only in server or worker environments and never use a `NEXT_PUBLIC_` name.

### 7.3 Application controls

- Validate every mutation on the server and constrain request/body sizes.
- Apply security headers including a tested Content Security Policy, HSTS in production, `X-Content-Type-Options`, a restrictive referrer policy, and appropriate frame restrictions.
- Render allowlisted structured rich text; do not store or render unrestricted scripts or arbitrary HTML.
- Protect state-changing operations from cross-site request abuse and verify request origin where relevant.
- Redact inquiry text, email addresses, auth tokens, cookies, and secrets from logs and monitoring payloads.
- Dependency, secret, and application security scans must have no unresolved critical or high release findings.

---

## 8. Contact Abuse Controls and Delivery Reliability

### 8.1 Recommended controls

| Control | Launch rule |
|---|---|
| Input validation | Server schema; trim/normalize; name 2–100 chars, email 254 max, subject 120 max, message 20–5,000 chars |
| Payload limit | 10 KB for the JSON/form body; no attachments |
| Honeypot/time trap | Reject filled hidden field; flag submissions completed implausibly fast |
| Bot challenge | Cloudflare Turnstile token verified server-side; fail closed with a retry-friendly message |
| IP rate limit | 10 attempts per 10 minutes and 30 per 24 hours per HMAC-hashed IP |
| Email rate limit | 3 accepted inquiries per hour per normalized email hash |
| Duplicate control | Idempotency token plus same-email/same-message fingerprint suppression for 24 hours |
| Spam filtering | Rule-based score at launch; suspicious items are stored as `spam_suspected` without sending normal notifications |
| Logging | Event type, request ID, coarse outcome, and hashed abuse keys only; never log full messages |

Rate limits are starting values. Review false positives and spam counts during staging and the first 30 production days before tightening them.

Cloudflare Turnstile validation is mandatory on the server. Its response token is short-lived and single-use, so token validation occurs before the inquiry is accepted.

### 8.2 Submission flow

```text
Validate payload
  → verify Turnstile
  → enforce rate and duplicate limits
  → atomically store inquiry + notification outbox row
  → return generic success with reference ID
  → worker sends notification using an idempotency key
  → delivery webhook updates delivery status
```

The visitor receives success once the inquiry is safely stored, not only after email succeeds. This prevents an email-provider problem from losing a lead.

### 8.3 Notification owner and fallback

- Confirmed mailbox domain: `opglobal.com.hk`.
- Careers recipient: `recruitment@opglobal.com.hk`, already published on the current website, subject to an ownership/access check.
- Client-inquiry recipient: `inquiries@opglobal.com.hk` is the proposed shared address; confirm that it exists or nominate another address before staging email tests.
- Privacy recipient: `privacy@opglobal.com.hk` is the proposed shared address; confirm that it exists or nominate another address before legal approval.
- Backup recipient: the production owner or a second shared operations mailbox.
- Store the recipient in production configuration, not source code.
- Retry notification attempts after approximately 1, 5, 15, and 60 minutes using the same provider idempotency key.
- After the final failure, mark the outbox row `dead_letter`, raise an operational alert, and show it on the admin dashboard.
- The inquiry remains visible to Inquiry Managers, who can manually resend or handle it from the stored record.
- Resend delivery/bounce webhooks update notification state; webhook event IDs are deduplicated.

---

## 9. Privacy, Legal, Cookies, and Retention

This section is an implementation baseline, not legal advice. OPG's authorized reviewer must approve the final wording, legal entity name, jurisdiction, processing purposes, contact details, and vendor list before launch.

### 9.1 Contact consent presentation

Recommended acknowledgement beside the contact submit button:

> I have read the Privacy Notice and understand that Outsourced Pro Global will use the information I provide to respond to my inquiry.

Link “Privacy Notice” to `/privacy`. Do not bundle newsletter marketing consent with contact consent. If the applicable legal basis is not consent, the legal reviewer should adjust “understand”/“agree” language without changing the separate-purpose design.

### 9.2 Newsletter consent

Use a separate, optional, unchecked control:

> Yes, send me OPG news and insights by email. I can unsubscribe at any time. See the Privacy Notice.

- Use double opt-in.
- Record consent version, source page, timestamp, and confirmation timestamp.
- Every marketing email requires a working unsubscribe route.
- Keep a minimal suppression record after unsubscribe so the address is not accidentally re-added; do not retain unnecessary profile data.

### 9.3 Retention baseline

| Data | Default retention | End-of-period action |
|---|---:|---|
| Contact inquiries | 12 months after last meaningful activity | Delete or anonymize unless a documented business/legal need extends it |
| Rejected spam payloads | 30 days | Delete; retain only aggregate counts |
| Rate-limit IP/email hashes | 24 hours, up to 7 days during an active abuse incident | Delete automatically |
| Notification outbox details | 90 days after final delivery state | Remove message payload; retain aggregate delivery status |
| Audit log | 24 months | Review, export only if required, then delete under approved policy |
| Newsletter subscriber | Until unsubscribe or lawful removal request | Change to unsubscribed and retain minimum suppression evidence |
| Deleted content revisions/media | 30-day recovery grace period | Permanently remove if not legally held or referenced |

Legal hold, an active customer relationship, or a governing law may require a documented exception. Automated retention jobs must produce counts and alerts, not silently fail.

### 9.4 Cookies and analytics

- Necessary cookies cover staff authentication, security, bot protection, and consent preference.
- No advertising or cross-site marketing trackers are included at launch.
- If GA4 or another cookie-based analytics product is enabled, load it only after analytics consent wherever consent is required. Declining analytics must not reduce site functionality.
- Store the consent decision and policy version; provide a persistent “Cookie settings” link in the footer.
- Keep staging and admin routes out of analytics.
- Analytics events must not contain inquiry text, names, email addresses, search terms that could be personal, or other personal data.
- The Privacy and Cookie Notices must name Supabase, Vercel, Cloudflare, Resend, the analytics provider, and monitoring providers as applicable processors/sub-processors.

---

## 10. SEO and Existing-Site Migration

### 10.0 Initial current-site evidence

An initial public check on 2026-09-12 found:

- the live site resolves at `https://opglobal.com.hk`;
- the page identifies the business as **Outsourced Pro Global Limited**, subject to legal verification;
- `recruitment@opglobal.com.hk` is published as the contact address;
- the current Apply action links to `outsourcedproglobal.applytojob.com`, which is the provisional external Careers destination;
- Google Tag Manager is present, so the existing tags, consent behavior, container ownership, and analytics history must be audited before migration.

This is an initial observation, not the full crawl or analytics/SEO inventory.

### 10.1 Before development content freeze

1. Use `https://opglobal.com.hk` as the provisional canonical production URL because the current public website already resolves there. Confirm DNS ownership and configure `www` to redirect directly to the apex URL before launch.
2. Crawl the current live site and export all indexable URLs, titles, descriptions, headings, canonicals, status codes, and internal links.
3. Export the top landing pages and search queries from Search Console and the existing analytics account, if available.
4. Record URLs with traffic, backlinks, inquiries, or business importance as priority URLs.
5. Decide for every old URL: preserve it, map it to the closest new page with a permanent redirect, or return a deliberate 410 when no replacement exists.

### 10.2 Implementation

- Preserve valuable existing slugs whenever the meaning remains the same.
- Keep a version-controlled redirect map and test it automatically.
- Use one canonical host and HTTPS; avoid redirect chains and loops.
- Generate unique metadata, canonical URLs, Open Graph data, `robots.ts`, and `sitemap.ts` from published records.
- Exclude drafts, archives, admin routes, preview URLs, and search-result query pages from the sitemap and indexing.
- Add valid JSON-LD where content supports it: Organization, WebSite, BreadcrumbList, Article, and JobPosting. Do not promise search-engine rich results.
- Staging and preview environments use `noindex` and must not be linked from production.
- Slug changes create a permanent redirect from the last published URL.

### 10.3 Launch and monitoring

- Run a final crawl before DNS cutover.
- Verify priority redirects, canonicals, sitemap, robots rules, structured data, and 404 handling in production.
- Submit the sitemap in OPG's Search Console property.
- Monitor indexing, 404s, redirect errors, impressions, clicks, and organic landing pages weekly for six weeks and monthly thereafter.

### 10.4 Migration quality targets

- 100% of current indexable URLs have an explicit migration disposition.
- 100% of priority URLs resolve directly to a valid page or one permanent redirect.
- Zero redirect loops and zero multi-hop redirect chains in the approved map.
- Zero draft/admin/preview URLs in the production sitemap.
- No unresolved broken internal links at launch.
- Organic rankings are monitored but not guaranteed; material traffic loss triggers investigation against the pre-launch baseline.

---

## 11. Environments, Deployment, and Operations

### 11.1 Environment separation

| Environment | Web | Supabase | Data rule |
|---|---|---|---|
| Local | Next.js local server | Supabase local development | Seeded synthetic data only |
| Preview/staging | Vercel preview/staging | Dedicated non-production Supabase project | Synthetic/approved test content; no production inquiry data |
| Production | Vercel production | Dedicated production Supabase project | Approved live content and personal data |

Global visitors do not require a database in every geography. Public pages and approved published media should be cached and delivered through the global Vercel/Supabase CDNs, while authenticated admin operations, inquiries, and uncached reads reach one Supabase primary region. Avoid placing personal inquiry/admin responses in public caches. Verify real geographic traffic, conversion latency, OPG operations, and legal transfer/data-residency requirements before choosing the production region. Supabase's primary database, Auth, and Storage location remains a single-region decision; a CDN does not change where primary personal data is stored.

The supplied dashboard screenshot shows an **OPGlobal** Supabase organization on a Pro plan and one existing, unrelated **Time Tracker** project using AWS `ap-northeast-2` (Seoul) with NANO compute. Do not reuse the Time Tracker database for the website. Create a dedicated `opg-website-staging` project first and a separate `opg-website-production` project before launch. Singapore (`ap-southeast-1`) remains the working staging/production region recommendation because the current OPG operations/domain evidence is APAC/Hong Kong; this is an inference, not evidence of where global users or legal obligations are concentrated. Reconsider before production if traffic or legal review supports another region. The existing Seoul project does not require the website to use Seoul.

The currently connected Supabase integration is authenticated to a different **HackHub** organization and cannot see OPGlobal. It must be reconnected to the OPGlobal account before this project can be created or Aki can be provisioned through connected tooling. No changes should be made to the visible HackHub project.

Phase 1 local setup began on 2026-09-12 and resumed on 2026-09-15. The workspace now contains a pinned Next.js/TypeScript scaffold, lockfile, CI definition, and local Supabase configuration. The local CLI is installed but Docker is not currently available, so local database/Auth policy tests cannot yet run. Local Auth signup is disabled, TOTP enrollment/verification is enabled, and new public tables require explicit Data API grants; cloud Auth configuration is still untouched. Windows desktop control was unavailable. A Chrome browser connection worked, but Supabase opened at its sign-in page rather than an authenticated OPGlobal dashboard, so Aki's email and live account access were not inferred. The sign-in page was left open for user handoff.

Read-only DNS on 2026-09-12 showed apex A records and a `www` CNAME pointing to HubSpot, with the domain's MX routed to Google. This confirms active web/email infrastructure, not DNS account ownership, mailbox existence, or a verified direct `www` → apex redirect. DNS changes must be coordinated with the current site owner during migration.

### 11.2 Delivery flow

1. Feature branch and reviewed pull request.
2. Lint, formatting check, type check, unit/integration tests, RLS tests, and production build.
3. Preview deployment with non-production secrets.
4. Staging acceptance by the relevant owner.
5. Backward-compatible database migration.
6. Manual production promotion by the release owner.
7. Smoke test public pages, admin login, publish flow, search, contact storage, email, and newsletter confirmation.
8. Roll back application immediately for a code regression; use a rehearsed forward database fix unless the migration's rollback is proven safe.

### 11.3 Production ownership

Aki Zita owns day-to-day deployments, production configuration, analytics, email, and secrets. Vendor organizations, domains, billing, and recovery contacts must be company-owned and must have at least one backup owner so production is not dependent on one personal account.

### 11.4 Secrets

Environment-specific secret storage must cover Supabase URL/publishable key, server secret key, database migration credentials, Resend API/webhook keys, Turnstile site/secret keys, monitoring DSN, analytics ID, cron authorization, and IP-hash secret. Commit only an `.env.example` containing names and descriptions.

### 11.5 Backup and recovery

- Production requires managed daily database backups at minimum.
- Recovery objectives: **RPO 24 hours** and **RTO 4 hours** for the initial launch.
- If the selected Supabase plan cannot meet these objectives, enable the required backup/PITR capability before launch.
- Test restoration into a non-production project before Gate G5 and quarterly after launch.
- Media must have a documented restore/export approach; database recovery alone does not restore missing storage objects.

---

## 12. Measurable Quality Targets

| Area | Launch target |
|---|---|
| Public responsiveness | No horizontal overflow or blocked task at 320, 375, 768, 1024, 1280, and 1440 px reference widths |
| Admin responsiveness | All workflows usable with keyboard/touch from 768 px upward; 1024 px iPad landscape is a primary test size |
| Accessibility | WCAG 2.2 AA; zero automated critical/serious findings plus manual keyboard, focus, zoom, forms, landmarks, and screen-reader smoke tests |
| Core Web Vitals | Field p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 when sufficient data exists |
| Lab performance | Lighthouse mobile performance ≥ 90 on Home, Services, Articles list/detail, Careers, and Contact using production-mode staging |
| Lab quality | Lighthouse Accessibility, Best Practices, and SEO ≥ 95 on representative public templates |
| Availability | 99.9% monthly target excluding announced maintenance and upstream incidents outside OPG control |
| Monitoring | External check every 5 minutes; alert after two consecutive failures; production exceptions alert within 5 minutes |
| Contact reliability | 100% of accepted inquiries stored exactly once; ≥99% notification jobs delivered or surfaced for manual action within 15 minutes |
| Publishing | Published content visible and searchable within 60 seconds after a successful publish action |
| Security | Zero unresolved critical/high findings; 100% of exposed tables have explicit grants, RLS, and allow/deny policy tests |
| Recovery | RPO ≤ 24 hours and rehearsed RTO ≤ 4 hours |
| Browser support | Latest two stable versions of Chrome, Edge, Firefox, and Safari; current iOS Safari and Android Chrome |
| Broken links | Zero broken internal links in the release crawl |
| Functional testing | All release-critical visitor, Editor, Publisher, Inquiry Manager, and Super Admin acceptance paths pass |

Scores are release indicators, not substitutes for manual testing. A documented exception needs an owner, reason, risk acceptance, and remediation date.

---

## 13. Initial Delivery Increments

The approved scope is larger than the original seven-page estimate. For one developer with part-time stakeholder input, plan approximately **16–20 weeks**, excluding delays for final content, legal approval, vendor procurement, DNS access, and feedback turnaround.

### Increment 1 — Foundation

- Scaffold pinned Next.js/TypeScript and Supabase local development.
- Create CI, environment validation, error boundaries, base layout, and responsive design tokens.
- Create staging and production account checklist; do not use production credentials yet.

### Increment 2 — Identity and authorization

- Implement invite-only sign-in, session handling, role/permission schema, MFA enforcement, RLS, and policy tests.
- Add the admin shell and permission-aware navigation.

### Increment 3 — Vertical slice

- Implement Mission & Vision from database migration through admin draft/review/publish to cached public rendering.
- Include metadata, media, audit entry, revalidation, responsive checks, and positive/negative authorization tests.

### Increment 4 — Core content

- Implement Home, About, Services, Clients, Departments, Team, Testimonials, navigation, footer, and reusable content/media patterns.

### Increment 5 — Publishing and discovery

- Implement Authors, Articles, Categories, Tags, FAQs, Careers, full-text search, previews, slug redirects, sitemap, and structured data.

### Increment 6 — Conversion and operations

- Implement contact controls, inquiry workspace, outbox/retries, Resend webhooks, newsletter double opt-in, retention jobs, and monitoring.

### Increment 7 — Migration, content, QA, and launch

- Load approved content, complete SEO migration, accessibility/security/performance QA, UAT, backup/restore rehearsal, launch, and hypercare.

---

## 14. Remaining Inputs That Do Not Block Foundation Work

- Confirm DNS ownership and the direct `www` → `https://opglobal.com.hk` redirect; the apex URL is the provisional canonical.
- Confirm whether the proposed `inquiries@opglobal.com.hk` and `privacy@opglobal.com.hk` mailboxes exist, plus the backup notification mailbox.
- Privacy-request mailbox, legal entity name, governing jurisdiction, and named legal/privacy approver.
- Final privacy, cookie, terms, and contact acknowledgement wording.
- Existing site URL/export and Search Console/analytics access for the SEO inventory.
- Create dedicated website projects under the confirmed OPGlobal Supabase organization; approve Singapore or another region, production compute/plan, and backup/PITR capability.
- Reconnect the development Supabase integration from the currently visible HackHub account to the OPGlobal organization shown in the supplied screenshot.
- Vercel organization and production billing owner.
- Approved brand assets, content matrix, images, client display permissions, and testimonial consent evidence.
- External application URL or approved application channel for Careers.
- Aki Zita's OPG-managed login email, initial Editors/Publishers/Inquiry Managers, and the pre-launch backup/recovery Super Admin.

These are recorded as configuration, content, access, or approval tasks. Development should begin with local and non-production foundations while their owners complete them.

---

## 15. Architecture Decisions

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Next.js App Router + Supabase; Vercel is the frontend deployment default | Accepted |
| ADR-002 | Custom admin with Editor, Publisher, Inquiry Manager, and Super Admin permissions | Accepted |
| ADR-003 | Draft → review → publish workflow with audit log and archive-first deletion | Accepted |
| ADR-004 | Clients, Careers, FAQs, testimonials, newsletter signup, search, categories, and tags are launch scope | Accepted |
| ADR-005 | Turnstile + layered rate/dedup controls + database outbox + Resend | Accepted baseline |
| ADR-006 | Contact data retained 12 months after activity; other retention follows Section 9 pending legal approval | Proposed for legal approval |
| ADR-007 | Consent-aware analytics; no advertising trackers at launch | Accepted baseline |
| ADR-008 | PostgreSQL full-text search; no external search service at launch | Accepted |
| ADR-009 | Public site supports 320 px upward; admin workflows support 768 px upward | Accepted |
| ADR-010 | Aki Zita is the initial Super Admin and production/release owner; only Super Admins assign roles | Accepted |
| ADR-011 | `https://opglobal.com.hk` is the provisional canonical; `www` redirects to apex after DNS verification | Accepted baseline |
| ADR-012 | Use dedicated website Supabase projects under OPGlobal; do not reuse Time Tracker; Singapore is the proposed primary region for global delivery via CDN | Proposed pending traffic/data-residency approval |
| ADR-013 | Keep drafts/previews non-indexable; publish a URL to the sitemap only after page and legal approval | Accepted foundation safeguard |

---

## 16. Current Platform Notes

Implementation must use current official documentation and pinned dependencies. As of this architecture date:

- Supabase requires explicit Data API grants for newly created tables under its newer secure defaults; grants and RLS are separate controls.
- Supabase client libraries require a supported modern Node.js runtime; the project baseline is Node.js 22 or later unless the scaffolded dependency set requires a newer supported LTS.
- Next.js uses the App Router, Server Components by default, and `proxy.ts` rather than older `middleware.ts` naming in current major versions.

Primary implementation references:

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase custom claims and RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)
- [Supabase full-text search](https://supabase.com/docs/guides/database/full-text-search)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Cloudflare Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)

---

## Change Log

| Version | Date | Change |
|---|---|---|
| 1.2 | 2026-09-15 | Recorded global-audience delivery/region reasoning, read-only machine/DNS findings, and the local Phase 1 scaffold without cloud changes |
| 1.1 | 2026-09-12 | Named Aki Zita as initial Super Admin/release owner, recorded the Supabase screenshot/integration mismatch and initial live-site evidence, established a provisional canonical domain, proposed shared mailbox addresses, and left content ownership assignable |
| 1.0 | 2026-09-12 | Replaced option-stage proposal with the approved Next.js + Supabase implementation architecture, governance, security, privacy baseline, SEO plan, quality targets, and first delivery increments |
