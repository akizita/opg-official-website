# Careers + JazzHR Implementation Plan

## Objective

Replace the website's manually maintained Supabase job listings with an automatically refreshed JazzHR feed while keeping the Careers marketing copy, visual configuration, and site administration in the existing OPG website.

JazzHR is the source of truth for roles and applications. The OPG website owns the careers experience, role discovery, job-detail presentation, SEO, and employer-brand content.

## Confirmed integration contract

- API base: `https://api.resumatorapi.com/v1/`
- Authentication: server-only `apikey` query parameter
- Public-role query: `jobs/status/open/confidential/false/private/false`
- Pagination: append `/page/#`; each page contains at most 100 records
- Relevant role fields: `id`, `title`, `department`, `city`, `state`, `country_id`, `description`, `original_open_date`, `type`, `status`, `board_code`, and `questionnaire`
- Application writes use `applicants`, `files`, `questionnaire_answers`, and `applicants2jobs`
- Candidate applications remain on the OPG website and are stored in JazzHR

The API key must never be exposed through a `NEXT_PUBLIC_` variable or sent to the browser.

## Target experience

### `/careers`

- Employer-brand hero and value proposition
- Benefits/why-join section managed through the existing page-copy system
- Live role count
- Keyword, department, location, employment-type, and work-arrangement filters
- Accessible job cards with role metadata and clear actions
- Separate states for no open roles, no filter matches, missing configuration, and upstream failure

### `/careers/[slug]`

- OPG-branded role detail
- Stable JazzHR board code in the URL
- Job title, department, location, employment type, and posting date
- Safe plain-text rendering of the JazzHR HTML description
- Persistent Apply action to the internal OPG application form
- Recruitment-security notice and link back to all roles
- Metadata, canonical URL, and `JobPosting` JSON-LD

## Architecture

```text
JazzHR API
  -> server-only client
  -> response validation and normalization
  -> 15-minute Next.js data cache
  -> careers list / details / sitemap / admin status

Apply CTA
  -> OPG application route
  -> server-side validation + Turnstile
  -> JazzHR candidate + résumé + questionnaire answers + role association
```

Supabase continues to provide page copy and visual configuration. The existing `job_openings` table remains untouched during rollout as a rollback source, but public and admin reads move to JazzHR.

## Delivery phases

1. Add server-only JazzHR types, client, pagination, mapping, and tests.
2. Replace the public Careers listing with the live feed and client-side discovery controls.
3. Replace job details, metadata, structured data, and application URLs.
4. Update sitemap and Admin Careers integration status/counts.
5. Add responsive styling, loading/error states, and accessibility behavior.
6. Run unit tests, type checking, linting, production build, and responsive/manual QA.
7. Add the internal application form and server-only JazzHR submission pipeline.
8. Configure the production API key and Turnstile keys, then verify a preview deployment.

## Failure and security behavior

- Missing API key: show a configuration-safe message without redirecting candidates to the legacy board.
- JazzHR timeout, 401, 429, or 5xx: throw rather than replacing cached roles with an empty list.
- Successful cached pages remain available during failed background revalidation.
- No API response, error, or log may contain the API key.
- JazzHR HTML is converted to safe text; it is never passed to `dangerouslySetInnerHTML`.
- Roles are post-filtered as open, public, non-confidential, and non-private even though the API request already applies those filters.
- Applications are validated again on the server; role IDs and questionnaire definitions are never trusted from browser input.
- Résumés are limited to 2 MB, checked by extension, MIME type, and file signature, and sent directly to JazzHR without local persistence.
- The role association is written only after JazzHR accepts the candidate résumé; questionnaire answers are then attached to that application relationship.
- A partial-write reference is returned if JazzHR creates a candidate but fails before final role association, preventing blind duplicate retries.

## SEO behavior

- Each open job receives a canonical OPG URL and unique metadata.
- Open roles are included in the sitemap from the same cached feed.
- Only valid open roles emit `JobPosting` structured data.
- Closed or removed roles stop appearing in the list and sitemap and return not found.
- JSON-LD strings are escaped before rendering.

## Configuration required

Add the following to local development and the deployment environment:

```env
JAZZHR_API_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

The JazzHR key is available under **Settings -> Integrations -> API Key**. Create a Cloudflare Turnstile widget for the production website and configure both Turnstile keys. Restart or redeploy after changing environment variables.

## Acceptance checklist

- Every public open JazzHR role appears on `/careers` within the cache window.
- Private, confidential, draft, held, filled, cancelled, and closed roles never appear.
- Filters and keyword search work without additional API calls.
- Every role opens a valid OPG detail page and a valid internal OPG application form.
- Successful submissions create the candidate, named résumé attachment, questionnaire answers, and job association in JazzHR.
- API-key removal produces the safe fallback; invalid keys and outages do not masquerade as zero roles.
- Careers metadata, sitemap entries, and `JobPosting` JSON-LD validate.
- Keyboard use, focus states, mobile layouts, and reduced-motion behavior pass review.
- `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
