# Observability — what reaches Sentry, and the alerts to set on it

What AutoMe sends to Sentry beyond crashes, how each kind is tagged, and the alert rules
to create for them. The public MCP endpoint has its own signals and rule:
[mcp-runbook.md](./mcp-runbook.md).

> **Sentry runs in production only** (`lib/sentry-enabled.ts`; `SENTRY_ENABLE_DEV=1`
> turns it on locally). Nothing below fires from a developer's machine.

Every event carries a `signal` tag. Tags are ids and codes only — never what a dealer or
buyer wrote. The code is in `lib/observability/report.ts`.

## Signals

| `signal` | Level | When | Other tags | One issue per |
|---|---|---|---|---|
| `unexpected` | error | `logError` was given an error that is not one of the typed, expected ones (`lib/utils/errors.ts`): a Server Action's caught failure, a route handler's catch, a failed save step. Before this, these stopped at the console. | — | place it was logged (ids and numbers masked) |
| `authz.refused` | warning | An `AuthorizationError` was logged: someone asked for a dealership, car, booking or member that is not theirs. One is a stale tab; a run of them is someone trying ids. | `code` | — (one issue) |
| `support-session.started` | info | A platform admin started a support session in a dealership | `session.id`, `organization.id`, `admin.id` | — |
| `support-session.ended` | info | It ended (by the admin, or on expiry) | `session.id`, `organization.id` | — |
| `billing.past-due` | warning | The renewal job marked a subscription PAST_DUE: its period ended unpaid | `organization.id` | — |
| `billing.downgraded` | warning (unpaid) / info (canceled) | A subscription dropped to the free plan | `organization.id`, `reason` | — |
| `billing.payment-rejected` | error | A signed Paymob transaction did not match the payment it named — never applied. A bug in checkout, or someone relabelling a payment. | `payment.id`, `reason` (`amount_mismatch`, `currency_mismatch`, `reference_mismatch`, `order_mismatch`) | reason |
| `job.failed` | error | A background job threw (QStash retries it up to 3 times; each try is an event) | `job`, `path` (`after` when it ran without the queue) | job |
| `ai.usage-spike` | warning | The daily usage watch found a dealership over `AI_DAILY_CALLS_ALERT` AI calls in 24 hours | `organization.id` | dealership |

## Alert rules to create

In Sentry: **Alerts → Create Alert**, project `autome` (the Next.js project), environment
`production`. Send each to the channel the team watches (email at least; Slack if
connected). The `signal:` filters are the event's tags.

| Rule | Type | Filter | Fires when | Why that threshold |
|---|---|---|---|---|
| **New unexpected error** | Issue alert | `signal` equals `unexpected` | A new issue is created, or a resolved one regresses | Every new failure deserves a look once |
| **Unexpected errors climbing** | Metric alert, count of errors | `signal:unexpected` | > 20 in 1 hour | A known issue that suddenly spikes |
| **Access refused, many times** | Metric alert, count of events | `signal:authz.refused` | > 30 in 1 hour | Above stale tabs and double-clicks; an id scan crosses it fast |
| **Support session started** | Metric alert, count of events | `signal:support-session.started` | > 0 in 5 minutes | Every session is someone acting as a dealer; it should never surprise the team |
| **Payment rejected** | Issue alert | `signal` equals `billing.payment-rejected` | Any event (the issue is seen more than 0 times in 1 minute) | Money not applied; a person must reconcile it the same day |
| **Subscriptions falling behind** | Metric alert, count of events | `signal:[billing.past-due, billing.downgraded] level:warning` (a downgrade the owner chose is `info`, so it stays out) | > 0 in 1 day | Revenue at risk; owners also get an email |
| **Background job failing** | Metric alert, count of events | `signal:job.failed` | > 8 in 1 hour | One failing car is up to 4 events (3 retries); more than two such cars is a pattern |
| **AI usage spike** | Issue alert | `signal` equals `ai.usage-spike` | A new issue is created (one per dealership) | A bulk import, a bot on the listing assistant, or a loop in our code |

Tune the counts after the first two weeks of real traffic; they are starting points, not
measurements.

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `AI_DAILY_CALLS_ALERT` | 500 | AI calls in 24 hours above which a dealership is reported (`lib/services/ai/usage-watch.ts`) |

The usage watch runs daily at 04:45 UTC (`vercel.json`). By hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://auto-me.vercel.app/api/cron/ai-usage-watch
```

It answers the window, the threshold and each dealership over it, and reports again if
run again.

## When an alert fires

| Alert | First look |
|---|---|
| Unexpected error | The issue's stack and the `logged` context (where `logError` was called). Vercel → Logs for the request around it |
| Access refused | Sentry → the issue's events: which user (Clerk id) and URL. Many ids from one user is a scan: suspend the account in Clerk, then check the audit log (Super admin → Activity) for anything that got through |
| Support session | Super admin → Support sessions: who, which dealership, the reason. End it there if nobody can account for it |
| Payment rejected | The payment id in the tags → Super admin → the dealership → Billing; compare with the transaction in Paymob's dashboard. Never mark it paid by hand without the Paymob record |
| Subscriptions falling behind | Super admin → the dealership → Billing. The owner was emailed; the grace period is in `lib/services/billing/periods.ts` |
| Job failing | The `job` tag, then the stack. QStash's dashboard shows the retries; the daily backfill crons re-run what never finished |
| AI usage spike | Super admin → Analytics (AI) for the dealership's features. A bot on the public assistant: tighten its rate limit; our own loop: the issue's context and the trace in the ops MCP (`pnpm -s mcp:ops`) |
