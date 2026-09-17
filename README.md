# OPG Official Website

Phase 1 foundation for the Outsourced Pro Global public website and its future custom administration interface.

## Requirements

- Node.js `22.19.0` (see `.nvmrc` and `.node-version`)
- npm `10.9.3` or a compatible npm 10 release
- Git
- Docker Desktop only when running the full local Supabase stack

On this Windows workstation, use `npm.cmd` in PowerShell because the current execution policy blocks the `npm.ps1` shim.

## Local setup

1. Copy `.env.example` to `.env.local` and keep all real values out of Git.
2. Install the locked dependencies with `npm.cmd ci`.
3. Start the site with `npm.cmd run dev`.
4. Open `http://localhost:3000`.

The UI-only foundation runs without Supabase credentials. Authentication, content, forms, and media require a dedicated OPG website project; do not connect this repository to the existing Time Tracker project or the unrelated Supabase organization currently exposed by the integration.

The visible Home page is a draft layout. Its navigation destinations are clearly marked, non-indexable placeholders for wireframe review, not approved public pages or working contact/career/search/legal flows. `SITE_INDEXABLE` defaults to false: do not enable it until the production content, legal, SEO, and conversion-flow acceptance checks are complete.

## Quality checks

Run the same checks used by continuous integration:

```powershell
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Environment policy

- Development uses local values and a local Supabase stack when Docker is available.
- Local `supabase/config.toml` disables public signup and automatic Data API table exposure and enables TOTP. These settings have **not** been applied to a cloud project; roles, RLS policies, and MFA enforcement still need implementation and tests.
- Preview/staging must use the dedicated `opg-website-staging` project.
- Production must use a separate project and secrets.
- Never prefix a secret or Supabase secret/service key with `NEXT_PUBLIC_`.
- Consent-gated analytics stays disabled until the legal text and behavior are approved.

## Current blockers for connected development

- Reconnect the Supabase integration to the `OPGlobal` organization.
- Sign in to the open Supabase dashboard in Chrome with the company account, then verify the OPGlobal organization; do not share passwords or recovery codes in this repository or chat.
- Confirm Aki Zita's exact OPG-managed login email.
- Confirm the company GitHub organization and authenticate the GitHub CLI.
- Confirm the company Vercel team and billing owner.
- Install Docker Desktop before running Supabase locally, or use the staging project once created.
- The local Supabase CLI is pinned as a dev dependency; use `npx.cmd supabase --help` to discover commands. Docker is not presently installed on this workstation.

See `OPG-Website-Development-Roadmap.md` for delivery status and `OPG-Wireframe-Approval-Guide.md` for the approval session.
