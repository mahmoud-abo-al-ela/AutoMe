<div align="center">

# AutoMe

**A bilingual used-car marketplace for Egypt, where every dealership gets its own storefront and an AI assistant that lists cars and answers buyers.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma)](https://www.prisma.io)
[![Tests](https://img.shields.io/badge/tests-Vitest-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev)

[Features](#features) • [Tech stack](#tech-stack) • [Getting started](#getting-started) • [Architecture](#architecture) • [AI](#ai) • [Deployment](#deployment)

</div>

AutoMe connects car buyers with dealerships across Egypt. Buyers search and compare listings in Arabic or English, ask questions about a car and book test drives. Dealerships run their inventory, team, billing and buyer conversations from a dashboard, and publish a storefront on their own subdomain. The platform team manages dealerships, plans and impersonation from a super-admin console.

> [!NOTE]
> AutoMe serves one market: Egypt. Prices are in Egyptian pounds (EGP), and the whole product — interface, listings, AI output — works in Arabic (right-to-left) and English.

## Features

**For buyers**

- Search and filter listings, with full-text search that understands Arabic spelling variants
- Compare cars side by side, save a wishlist, and book test drives
- Chat with dealerships in real time
- Ask the **listing assistant** about a car and get answers grounded in the listing — or an honest "the dealer can tell you", never a guess

**For dealerships**

- A storefront on `<dealership>.<domain>` and a dashboard for inventory, team members, working hours and test drives
- **Create a listing from photos**: the AI reads up to three photos and fills in make, model, year, specifications and a description in both languages
- A listing-quality coach, automatic translation between Arabic and English, and photo descriptions for accessibility and SEO
- A **Buyer Questions** inbox: questions the assistant could not answer, and answers buyers rated unhelpful, arrive here — and the dealer's reply becomes a fact the assistant uses from then on
- Subscription plans billed through Stripe, with per-plan limits on cars, members and AI listings

**For the platform**

- Multi-tenant isolation: every query is scoped to the current dealership
- Super-admin console with audit logs and impersonation
- Rate limiting and bot protection on every server action and public endpoint
- Metering of every AI call, per dealership and per provider

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org) (App Router, Server Actions), React 19, TypeScript |
| Data | PostgreSQL with [Prisma 7](https://www.prisma.io); file storage on [Supabase](https://supabase.com) |
| Auth | [Clerk](https://clerk.com) |
| Payments | [Stripe](https://stripe.com) subscriptions and webhooks |
| Localization | [next-intl](https://next-intl.dev), Arabic (RTL) and English |
| Messaging | [Stream Chat](https://getstream.io/chat/) |
| AI | Google Gemini and OpenAI-compatible providers, behind one metered client |
| Security | [Arcjet](https://arcjet.com) rate limiting, bot detection and shield |
| UI | Tailwind CSS 4, shadcn/ui, TanStack Query |
| Monitoring | [Sentry](https://sentry.io) |
| Testing | [Vitest](https://vitest.dev), with live AI evaluations |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 22 or later
- [pnpm](https://pnpm.io) 9 (`corepack enable` installs the version pinned in `package.json`)
- A PostgreSQL database — a [Supabase](https://supabase.com) project provides both the database and file storage
- Accounts for Clerk, Stripe, Stream and Arcjet, and at least one AI provider key

### Installation

```bash
git clone https://github.com/mahmoud-abo-al-ela/AutoMe.git
cd AutoMe
pnpm install          # also generates the Prisma client
```

Create a `.env` file in the project root with the variables below, then set up the database:

```bash
pnpm prisma migrate deploy   # create the schema
pnpm db:seed                 # plans, sample dealerships and cars
pnpm dev                     # http://localhost:3000
```

Dealership storefronts are served on subdomains. Locally, open `http://<slug>.localhost:3000` — most browsers resolve `*.localhost` without any setup.

> [!IMPORTANT]
> After a change to `prisma/schema.prisma`, run `pnpm db:generate` **and restart the dev server**. The Prisma client is cached across hot reloads, so a running server keeps using the old one.

### Environment variables

<details>
<summary><strong>Required</strong></summary>

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk authentication |
| `CLERK_WEBHOOK_SECRET` | Verifies Clerk webhooks (`/api/webhooks/clerk`) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Image storage |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Subscriptions and their webhook (`/api/webhooks/stripe`) |
| `NEXT_PUBLIC_STREAM_API_KEY`, `STREAM_API_SECRET` | Buyer–dealer chat |
| `ARCJET_KEY` | Rate limiting — **production refuses requests without it** |
| `GEMINI_API_KEY` and/or `CODECRAFT_API_KEY` | AI providers (see [AI](#ai)) |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN` | Public URL and the domain dealership subdomains hang off |

</details>

<details>
<summary><strong>Optional</strong></summary>

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Authorizes the `/api/cron/*` jobs; without it they refuse to run |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Error monitoring and source-map upload |
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `FROM_EMAIL`, `CONTACT_EMAIL` | Contact form and notification email |
| `CODECRAFT_API_KEY_2`, `CODECRAFT_API_KEY_3`, … | Extra keys for a provider, used in order |
| `AI_MODELS_VISION`, `AI_MODELS_TEXT`, … | Override a task's model chain, e.g. `google/gemini-3.6-flash,codecraft/gpt-5.5` |
| `AI_BILLING_MODE` | `free` (default) records AI cost as zero; set it when on a paid key |

</details>

> [!WARNING]
> Never commit `.env`. Rotate any key that has been shared outside your secret store.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm typecheck` | ESLint and TypeScript checks |
| `pnpm test` / `pnpm test:watch` | Run the Vitest suite |
| `pnpm db:migrate` | Create and apply a migration in development |
| `pnpm db:seed` / `pnpm db:reset` | Seed the database / reset and re-seed it |
| `pnpm db:studio` | Browse the database in Prisma Studio |
| `pnpm db:sync-plans` | Create or update the plans' products and prices in Stripe |

## Architecture

```
app/                 Routes: [locale]/(site) public site, [locale]/org/[slug] dealer
                     dashboard, [locale]/(super-admin), api/ (uploads, AI stream,
                     webhooks, cron)
actions/             Server actions — the guard stack lives here
lib/services/        Business logic, one folder per domain
lib/repositories/    Data access; every query takes a server-sourced tenant id
lib/ai/              The AI client, providers, prompts, schemas and evaluations
lib/middleware/      Auth, plan gates, usage limits, rate limits, validation
messages/{en,ar}/    Translations, one file per area
prisma/              Schema, migrations and seed
```

A request flows **route → action → service → repository → Prisma**. Each server action is wrapped in the same guards, in order:

1. **Authentication and tenant** — `withOrgAuth` resolves the user and the dealership from the session and subdomain, never from the request body.
2. **Validation** — a Zod schema checks the input before anything else reads it.
3. **Plan gate and usage limit** — the dealership's plan must include the feature and have allowance left.
4. **Rate limit** — Arcjet, failing closed in production.

Route handlers under `app/api/` assemble the same guards themselves. Webhooks verify signatures and are idempotent, and cron routes authenticate with `CRON_SECRET` in constant time.

## AI

Every model call goes through a single entry point, `generateStructured` in `lib/ai/client.ts`:

**cache → capacity breaker → provider call → schema validation → metering**

- **Structured output.** Each feature defines a Zod schema that is also sent to the model as its response schema, so enum fields (body type, fuel, colour) can only take allowed values.
- **Model chains.** Each task — `vision`, `visionFast`, `text`, `textFast` — has an ordered chain across providers. A busy or failing model hands over to the next one; the configured providers are registered in `lib/ai/providers.ts`.
- **Metering.** Every attempt writes an `AiUsage` row, success or failure. Plans sell *AI listings*: the photo read, translation and advice behind one saved car count once.
- **Grounding.** The listing assistant answers only from a record of facts about the car, cites the facts it used, and is checked against them. An answer that cites a fact the listing lacks is never shown.

| Feature | Where |
| --- | --- |
| Listing from photos | `app/api/ai/car-listing` (streams progress) |
| Arabic ↔ English listing translation | on save, `actions/cars.ts` |
| Listing-quality coach | car form, last step |
| Photo descriptions (alt text) | after save; backfill at `POST /api/cron/backfill-image-alts` |
| Buyer listing assistant | car page, `actions/listing-assistant.ts` |
| Photo search | home page |

## Testing

```bash
pnpm test                                     # unit and integration suite
pnpm typecheck
AI_EVAL=1 pnpm vitest run lib/ai/evaluation   # live evaluations against the real models
```

The unit suite mocks every provider. The evaluations in `lib/ai/evaluation/` call the real models to check what mocks cannot: that refusals hold, that instructions hidden in a photo or a listing are ignored, and that Arabic output is Arabic. They spend provider quota, so they only run with `AI_EVAL=1`, and a provider at capacity skips a case rather than failing it.

## Deployment

AutoMe is built for [Vercel](https://vercel.com).

> [!IMPORTANT]
> Run `pnpm prisma migrate deploy` against the production database **before** deploying code that depends on a new migration. Pages that read a missing column fail.

- **Fluid compute** must be enabled: the AI routes declare `maxDuration = 300`, which a Hobby project without it rejects at build time.
- Point the Stripe and Clerk webhooks at `/api/webhooks/stripe` and `/api/webhooks/clerk`, and run `pnpm db:sync-plans` once per Stripe account.
- Add a wildcard domain (`*.your-domain`) so dealership subdomains resolve.
- Set `CRON_SECRET` before calling any `/api/cron/*` route.
