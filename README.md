# OPG Official Website

Phase 1 foundation for the Outsourced Pro Global public website and its custom administration interface.

## Requirements

- Node.js `22.19.0` (see `.nvmrc` and `.node-version`)
- npm `10.9.3` or a compatible npm 10 release
- Git
- Docker Desktop only when running the full local Supabase stack

On this Windows workstation, use `npm.cmd` in PowerShell because the current execution policy blocks the `npm.ps1` shim.

## Local setup

1. Copy `.env.example` to `.env.local` and keep all real values out of Git.
2. Install the locked dependencies with `npm.cmd ci`.
3. Start the development server with `npm.cmd run dev`.
4. Open `http://localhost:3000`.

The UI-only foundation runs without Supabase credentials. Authentication, content, forms, and media connect to the dedicated `opg-website-staging` project in Tokyo (`ap-northeast-1`). Do not connect this repository to the existing Time Tracker project.

The visible Home page is a draft layout with dual audience paths. Navigation destinations are clearly marked, non-indexable placeholders for wireframe review. `SITE_INDEXABLE` defaults to `false`: do not enable it until the production content, legal, SEO, and conversion-flow acceptance checks are complete.

## Quality checks

Run the same checks used by continuous integration:

```powershell
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run security:check
npm.cmd run build
```

## Engineering & Git Conventions

- **Default branch:** `main` must remain releasable at all times.
- **Branch naming convention:**
  - `feature/<ticket-or-description>` — New capabilities or components
  - `fix/<ticket-or-description>` — Bug fixes
  - `chore/<ticket-or-description>` — Upgrades, configs, documentation
- **Quality gate:** All PRs must pass the CI workflow (`lint`, `format:check`, `typecheck`, `test`, `security:check`, `build`) before merge.
- **Secret security:** Never commit `.env*` files or credentials. All logs automatically redact PII and credentials using `src/lib/logger.ts`.
- **Database reproducibility:** All schema modifications are versioned under `supabase/migrations/` and accompanied by pgTAP tests.

## Environment and Infrastructure Policy

| Environment     | Purpose                   | Infrastructure                                                                       |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| **Development** | Local iteration           | Local Next.js server + staging Supabase or local Supabase (when Docker is available) |
| **Staging**     | Demos, UAT & verification | Vercel preview deployment + `opg-website-staging` (Tokyo, Micro)                     |
| **Production**  | Live official website     | Vercel production deployment + dedicated production Supabase project                 |

### Connected Services

- **Repository:** GitHub (`https://github.com/akizita/opg-official-website.git`)
- **Backend / Database:** Supabase (`opg-website-staging` in Tokyo)
- **Frontend Hosting:** Vercel
- **Domain & DNS:** Crazy Domains
- **Transactional Email:** Resend
- **Bot Protection:** Cloudflare Turnstile

## Database Migrations & Testing

Versioned migrations are located in `supabase/migrations/`:

- `20260916041231_identity_and_access_control.sql` — RBAC, permissions, admin profiles, and audit log.
- `20260916041717_consolidate_admin_profile_select_policy.sql` — Refined profile read policy.
- `20260918060000_core_content_model.sql` — Core content schemas, publishing states, inquiries, and search.
- `20260918061000_media_storage_buckets.sql` — `draft-media` (private) and `public-media` (public) buckets and RLS policies.

To verify migrations locally or against staging using pgTAP:

```powershell
# Run identity & RBAC test
# Run core content model test in supabase/tests/
```

## Backup & Recovery Procedures

### Staging

- Automated daily backups are maintained in Supabase Dashboard.
- Manual snapshots can be triggered in the Supabase Dashboard under Database → Backups.

### Production

- Point-in-time recovery (PITR) is required for the production Supabase instance.
- Before running any schema migration in production:
  1. Verify current automated backup status in the Supabase Dashboard.
  2. Perform a pre-migration export via `pg_dump` or Supabase CLI.
  3. Apply migration in a staging transaction first.
  4. Run smoke test checklist.

## Handover & Documentation Links

- `OPG-Website-Development-Roadmap.md` — Complete phase-by-phase execution plan and gate exit criteria.
- `OPG-Website-Roadmap-Architecture.md` — Approved system architecture and data model specification.
- `OPG-Wireframe-Approval-Guide.md` — Task-based design review and UAT checklist.
