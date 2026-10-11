# AutoMe — project rules

Multi-tenant car marketplace for Egypt (Next.js 15 App Router, Prisma/Postgres on Supabase,
Clerk, Arabic + English). These rules are mandatory; the `.claude/skills/*` skills hold the
detail (start with `code-craft`).

## Layers and dependency direction

```
app/**, components/**, hooks/**   UI and routing
actions/**                        "use server" entry points: guard, validate, delegate
app/api/**                        route handlers: HTTP entry points that guard themselves
lib/services/**                   business logic; no request/response, no JSX
lib/repositories/**               data access — the only layer that touches Prisma
```

- Imports flow `app → actions → services → repositories`, never back. ESLint enforces it for
  runtime imports (`import type` may cross freely):
  - pages, components and hooks never import a repository, `lib/ai` or `lib/jobs`;
  - actions and route handlers reach data through a service, not a repository;
  - nothing in `lib/` imports from `app`, `actions`, `components` or `hooks`;
  - repositories never import services.
  No file is exempt; a new crossing is a lint error. Put the code in the right layer.
- **Only `lib/repositories/**` (and `lib/prisma.ts`) may import `@/lib/prisma` or import
  values from `@/lib/generated/prisma`.** `import type` from the generated client is fine
  anywhere. ESLint enforces this with no exempt files; put the query in a repository
  (a service that needs a transaction calls `runInTransaction` from
  `lib/repositories/transaction.ts`).
- Tenant scoping (`organizationId` from the auth context) lives in the query's `WHERE`, never
  in a caller's promise to check first. See the `tenant-isolation` skill.

## Entry points

- **Server actions** (`actions/*`) wrap with `withAuth` / `withOrgAuth` / `withSuperAdmin` /
  `withErrorHandling` (`lib/middleware/with-auth.ts`) and return `createSuccessResponse`.
  Keep them thin: business logic goes to a service. See `server-action-guard`.
- **Route handlers** (`app/api/**/route.ts`) are raw. **Never wrap them in the `with*` action
  wrappers** — those return action responses, not HTTP `Response`s. A handler authenticates
  itself (session, signature or fail-closed secret), rate-limits, validates with Zod, and
  returns real status codes. See `api-route-guard`.
- Never call next-intl `getLocale()` inside a Server Action (throws in production); pass the
  locale from the client.

## Errors and logging

- Throw the typed errors from `lib/utils/errors.ts` (`ValidationError`, `AuthenticationError`,
  `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `PlanLimitError`,
  `ServiceUnavailableError`), not bare `Error`, for anything a caller should map to a status.
- Log with `logError` from `lib/utils/errors.ts`; never raw `console.error`.
- Never swallow an error silently. A deliberate fire-and-forget (email, background enrichment)
  logs it and says in a comment why the caller must not fail.
- Route handlers return a generic message to the client and keep the detail in the log.

## AI code

- Every model call goes through `lib/ai/client.ts` (`generateStructured` /
  `generateStructuredWithMeta`) or `lib/ai/embeddings.ts` — never a provider SDK directly. That
  is where chains, retries, the breaker, metering, caching and tracing live.
- One feature = a prompt in `lib/ai/prompts/` (versioned; bump `version` on any text change), a
  Zod schema in `lib/ai/schemas/`, a feature id in `lib/ai/features.ts`, and the use-case in
  `lib/services/ai/`. Metering rules: the `ai-metering` skill.
- Background work that must not be lost goes through `lib/jobs` (`enqueue`, retried by
  QStash); `after()` is only for best-effort work whose loss is acceptable.

## Code

- New code is TypeScript. Convert an existing JS file only in its own PR.
- No hardcoded user-facing strings; Arabic copy is Modern Standard Arabic; use logical CSS
  properties (`ms-`/`me-`/`start-`/`end-`). See `i18n`; prices: `money`.
- Route-local code stays in the route's `_components/` (hooks beside the components that use
  them) and `_lib/`; promote to `components/`, `hooks/` or `lib/` when a second route needs it.
- ESLint warns past 300 lines of code in a file. Split by responsibility, not by count — the
  `code-craft` skill lists the current candidates and how to split them.
- Comments say why, not what. No step-number comments or banner separators.

## Before you finish

`pnpm typecheck`, `pnpm lint`, `pnpm test`. DB-backed suites in `test/` run only when
`TEST_DATABASE_URL` points at a migrated Postgres with pgvector (as in CI); say when they were
skipped. Never run migrations against a developer's database without asking.
