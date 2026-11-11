---
last_mapped_commit: e8599b0afa709cb9e4fcc408f47b9b0d51714ccb
last_mapped_at: 2026-11-11
---
# Coding Conventions

**Analysis Date:** 2026-11-11

## TypeScript & Strictness

Configured in `tsconfig.json`:
- `strict: true`
- `noUncheckedIndexedAccess: true` — Array/record indexing returns `T | undefined`; callers must guard before dereferencing (e.g., `if (!latest) return ...` in `src/lib/useMaintenance.ts`)
- `exactOptionalPropertyTypes: true` — Optional props cannot explicitly receive `undefined` unless typed `| undefined`
- `noPropertyAccessFromIndexSignature: true` — Index signature fields use bracket access (`import.meta.env['VITE_SUPABASE_URL']` in `src/integrations/supabase/client.ts`)
- `noImplicitOverride: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`
- Path alias: `@/*` resolves to `./src/*`

## Formatting & Linting

- **Prettier (`.prettierrc`):** Double quotes (`singleQuote: false`), semicolons (`semi: true`), 100-char print width (`printWidth: 100`), trailing commas everywhere (`trailingComma: "all"`)
- **ESLint (`eslint.config.js`):**
  - `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-prettier`
  - `react-hooks` recommended rules enforced
  - `react-refresh/only-export-components` warning
  - `no-restricted-imports` error banning `"server-only"` (use `*.server.ts` or `@tanstack/react-start/server-only` instead)
  - `@typescript-eslint/no-unused-vars` disabled (`"off"`)

## Component & UI Patterns

- **Routes:** Defined via `createFileRoute("/path")({ head: ..., component: ... })` with SEO/meta tags in `head`
- **Hydration safety:** Client-only routes or browser-dependent views guard with `mounted` state (`src/routes/auth.tsx`) or `ssr: false` (`src/routes/_authenticated/route.tsx`)
- **Browser API guards:** All `window`, `localStorage`, and `BroadcastChannel` accesses guard with `typeof window === "undefined"` for SSR safety (`src/lib/useMaintenance.ts`)
- **Notifications:** User feedback via `sonner` (`toast.success`, `toast.error`, `toast.warning`)
- **Styling:** Tailwind CSS v4 utility classes combined with OKLCH theme tokens and shared `.kk-*` classes in `src/styles.css`
- **UI Primitives:** Standard shadcn/ui components in `src/components/ui/` using `cn()` from `src/lib/utils.ts`

## Error Handling

- Root error boundary (`ErrorComponent` in `src/routes/__root.tsx`) logs and calls `reportLovableError`
- Server middleware (`errorMiddleware` in `src/start.ts`) and `src/server.ts` catch unhandled throws and render HTML error pages via `renderErrorPage()` while rethrowing HTTP-status errors
- Client async flows wrap Supabase calls in `try/catch` and surface errors via `toast.error(...)`

*Conventions analysis: 2026-11-11*
