---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# External Integrations

**Analysis Date:** 2026-11-11

## Backend & Database

**Supabase (`@supabase/supabase-js` `^2.112.3`):**
- Project configured in `supabase/config.toml` (`project_id = "zlxkrruqoetezegfszrb"`)
- Client initialization: `src/integrations/supabase/client.ts` (uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in browser and `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` on server; proxies client lazily)
- Server-side client & auth helpers: `src/integrations/supabase/client.server.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/integrations/supabase/auth-attacher.ts`, `src/integrations/supabase/cron-auth.ts`
- Preview auth storage adapter: `src/integrations/supabase/previewAuthStorage.ts`
- Database types: `src/integrations/supabase/types.ts` (main table: `public.registrations`)
- SQL schema & RPC migrations: `supabase/migrations/` (20 migrations covering `registrations`, Aadhaar uniqueness/deduplication, `reference_number` sequence, `saf_number`, `batch_name`, RLS policies, storage policies)

**Supabase Storage:**
- Bucket `registrations` used for uploaded applicant documents (age proof, Aadhaar proof, caste proof, education proof, employment proof) and JSON manifest files:
  - Maintenance mode manifests: `manifests/maintenance/maintenance_<timestamp>.json` (`src/lib/useMaintenance.ts`)
  - Colleges & batches manifests (`src/lib/useColleges.ts`, `src/lib/useBatches.ts`)

## Authentication

**Supabase Auth & Lovable Cloud Auth:**
- Email/password authentication for university admin staff (`src/routes/auth.tsx`)
- Auth route guard (`src/routes/_authenticated/route.tsx`) checks `supabase.auth.getUser()` and redirects unauthenticated users to `/auth`
- Server function auth attachment (`src/integrations/supabase/auth-attacher.ts` registered in `src/start.ts`)
- `@lovable.dev/cloud-auth-js` `^1.0.0` wrapper in `src/integrations/lovable/index.ts` (OAuth providers: `google`, `apple`, `microsoft`, `lovable`, synced into Supabase session)

## Platform & Error Reporting

**Lovable Integration:**
- Connected to Lovable editor (`AGENTS.md`, `.lovable/`)
- Build/dev Vite preset `@lovable.dev/vite-tanstack-config` (`vite.config.ts`)
- Client error reporting in `src/lib/lovable-error-reporting.ts`, invoked from `src/routes/__root.tsx` error boundary

## External Assets & Fonts

- Google Fonts (`Plus Jakarta Sans`, `Inter`) loaded via `<link>` in `src/routes/__root.tsx` and `@import url(...)` in `src/styles.css`
- Local university & government emblems in `src/assets/` (`image.png`, `image copy.png`, `karnataka-govt-logo.png`)

*Integrations analysis: 2026-11-11*
