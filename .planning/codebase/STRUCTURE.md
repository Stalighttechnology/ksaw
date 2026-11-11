---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# Codebase Structure

**Analysis Date:** 2026-11-11

## Directory Layout

```text
ksaw/
├── public/                 # Static assets (favicon, etc.)
├── scripts/                # Standalone Node.js (.mjs) data audit, migration & XLSX processing scripts
├── supabase/
│   ├── config.toml         # Supabase project ID config
│   └── migrations/         # 20 timestamped SQL migrations for schema, RPCs, and RLS
├── src/
│   ├── assets/             # University/govt logos & caste Excel reference
│   ├── components/
│   │   ├── reg/            # Domain registration components, chrome, options, castes
│   │   └── ui/             # shadcn/ui Radix-based UI primitives
│   ├── hooks/              # Generic React hooks (use-mobile.tsx)
│   ├── integrations/
│   │   ├── lovable/        # Lovable cloud auth helper
│   │   └── supabase/       # Supabase client, SSR client, auth middleware, DB types
│   ├── lib/                # Domain hooks, column specs, error handling, cn() utils
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── __root.tsx      # Root layout & HTML shell
│   │   ├── index.tsx       # "/" public registration portal
│   │   ├── auth.tsx        # "/auth" admin login
│   │   └── _authenticated/ # Pathless auth layout + "/admin" dashboard
│   ├── routeTree.gen.ts    # Auto-generated TanStack Router manifest (do not edit)
│   ├── router.tsx          # Router & QueryClient factory
│   ├── server.ts           # Custom SSR server entry
│   ├── start.ts            # TanStack Start middleware registration
│   └── styles.css          # Tailwind v4 theme tokens & custom "kk-*" form classes
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

## Key Locations

- **Entry & Router:** `src/router.tsx`, `src/start.ts`, `src/server.ts`, `src/routes/__root.tsx`
- **Public Routes:** `src/routes/index.tsx` (`/`), `src/routes/auth.tsx` (`/auth`)
- **Protected Routes:** `src/routes/_authenticated/route.tsx`, `src/routes/_authenticated/admin.tsx` (`/admin`)
- **Generated Route Tree:** `src/routeTree.gen.ts` (regenerated automatically by Vite `@tanstack/router-plugin`)
- **Shared Chrome & Fields:** `src/components/reg/SiteChrome.tsx`, `src/components/reg/fields.tsx`
- **Supabase Types & Client:** `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`
- **Global Styles:** `src/styles.css` (OKLCH CSS variables + `.kk-*`, `.form-ctrl`, `.btn-kk` classes)

## Naming Conventions

- **Routes:** TanStack Router file conventions (`__root.tsx`, `index.tsx`, `auth.tsx`, `_authenticated/route.tsx`, `_authenticated/admin.tsx`)
- **Components:** PascalCase in `src/components/reg/` (`SiteChrome.tsx`), kebab-case in `src/components/ui/` (`alert-dialog.tsx`, `button.tsx`)
- **Hooks & Libs:** camelCase (`useBatches.ts`, `useColleges.ts`, `useMaintenance.ts`, `registrationColumns.ts`) or kebab-case (`error-capture.ts`, `use-mobile.tsx`)
- **CSS Classes:** Domain-prefixed custom classes (`kk-page`, `kk-header`, `kk-banner`, `kk-wrap`, `ctrl-label`, `form-ctrl`, `btn-kk`) alongside Tailwind utilities

*Structure analysis: 2026-11-11*
