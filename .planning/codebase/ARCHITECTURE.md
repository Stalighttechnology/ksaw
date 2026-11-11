---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# Architecture

**Analysis Date:** 2026-11-11

## Pattern Overview

**Overall:** Full-stack TanStack Start (React 19 + TanStack Router + Nitro SSR) application backed by Supabase (PostgreSQL, Auth, Storage).

**Key Characteristics:**
- File-based routing under `src/routes/` compiled into `src/routeTree.gen.ts` by `@tanstack/router-plugin`
- Client-heavy route components communicating directly with Supabase JS SDK (`@/integrations/supabase/client`) and React Query (`@tanstack/react-query`)
- Custom SSR entry (`src/server.ts`) and TanStack Start middleware (`src/start.ts`) providing CSRF protection, Supabase auth header attachment, and friendly HTML error recovery (`src/lib/error-page.ts`, `src/lib/error-capture.ts`)
- No separate backend REST/GraphQL API server; database reads/writes and RPCs go straight to Supabase with Row-Level Security (RLS)

## Layers

**1. Server & Start Middleware Layer:**
- `src/server.ts` - Custom Nitro/TanStack Start fetch wrapper; normalizes h3-swallowed 500 JSON errors into HTML error pages
- `src/start.ts` - Configures `createStart` with `functionMiddleware: [attachSupabaseAuth]` and `requestMiddleware: [errorMiddleware, csrfMiddleware]`

**2. Routing & Shell Layer (`src/routes/`):**
- `src/routes/__root.tsx` - Root HTML shell (`RootShell`), `<HeadContent />`, `<Scripts />`, `QueryClientProvider`, `<Toaster />`, 404 and root error components
- `src/routes/index.tsx` - Public applicant registration portal (`/`), edit-by-reference-number flow, SAF number linking, and maintenance mode gate
- `src/routes/auth.tsx` - Staff sign-in page (`/auth`)
- `src/routes/_authenticated/route.tsx` - Layout guard (`ssr: false`) enforcing Supabase `getUser()` before loading child routes
- `src/routes/_authenticated/admin.tsx` - Protected admin dashboard (`/admin`) for viewing, filtering, editing, batch-assigning, and exporting registrations to Excel

**3. Domain Components & Form Primitives (`src/components/reg/`):**
- `src/components/reg/SiteChrome.tsx` - Shared `SiteHeader`, `PageBanner`, `SiteFooter`
- `src/components/reg/fields.tsx` - Reusable form controls (`Section`, `Row`, `Field`, `TextField`, `SelectField`, `DateField`, `RadioGroup`, `MultiSelect`, `FileField`)
- `src/components/reg/options.ts`, `src/components/reg/castes.ts` - Static domain lookup tables and normalization helpers (colleges, districts, taluks, skills, castes, nigamas)

**4. State & Integration Hooks (`src/lib/`):**
- `src/lib/useMaintenance.ts` - Maintenance toggle backed by Supabase Storage manifests, `localStorage`, and `BroadcastChannel` cross-tab sync
- `src/lib/useColleges.ts`, `src/lib/useBatches.ts` - College/batch data hooks and assignment logic
- `src/lib/registrationColumns.ts` - Column definitions and cell formatters for the admin table & exports

## Data Flow

- **Public Registration (`/`):** User fills multi-section form in `src/routes/index.tsx` -> uploads proof files to Supabase Storage (`registrations` bucket) -> inserts/updates `registrations` row or calls Supabase RPC -> receives `reference_number`.
- **Admin Management (`/admin`):** Authenticated staff passes `_authenticated/route.tsx` guard -> queries `registrations` via Supabase & React Query -> filters/sorts/edits/assigns batches or exports `.xlsx` via `xlsx`.
- **Cross-Tab Maintenance Sync:** Admin toggles maintenance in `useMaintenance()` -> updates `localStorage`, broadcasts via `BroadcastChannel`, and uploads timestamped JSON manifest to Supabase Storage.

*Architecture analysis: 2026-11-11*
