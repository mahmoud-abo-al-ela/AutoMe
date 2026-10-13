# MCP and WebMCP — operations runbook

How to switch AutoMe's AI-agent surfaces off and on, tune their limits, rotate their
secrets, watch them and respond when something goes wrong.

| Surface | What it is | Where |
|---|---|---|
| Public MCP | Read-only car and dealership tools for any MCP client (e.g. Claude's custom connector) | `https://auto-me.vercel.app/api/mcp` — `app/api/mcp/route.ts`, `lib/mcp/public/` |
| WebMCP | Tools a page offers an agent in the visitor's own Chrome (149+, origin trial) | `/cars`, `/cars/[id]`, `/compare`, `/test-drive` — `lib/webmcp/`, the pages' `webmcp/` folders |
| Ops MCP | Internal AI telemetry over stdio, on a developer's machine only | `pnpm -s mcp:ops` — `scripts/mcp/ai-ops/server.ts` |

> **Vercel applies an environment change only to new deployments.** Every change below
> that edits a variable takes effect after **Deployments → latest → Redeploy**. Plan for
> the minutes that takes.

## Switch off and on

| To | Do | Then check |
|---|---|---|
| Stop public MCP | Set `MCP_PUBLIC_ENABLED` to `false` (anything but `true` is off), redeploy | `curl -s -X POST https://auto-me.vercel.app/api/mcp -H 'content-type: application/json' -d '{}'` → `503 {"error":"disabled"}` |
| Restart it | Set `MCP_PUBLIC_ENABLED=true`, redeploy | The Claude connector lists its 5 tools again |
| Stop WebMCP for visitors | Remove `NEXT_PUBLIC_WEBMCP_TRIAL_TOKEN`, redeploy | `curl -s https://auto-me.vercel.app/en \| grep -c origin-trial` → `0`. Chrome then offers no `document.modelContext` to ordinary visitors and the site works as before |
| Stop the ops server | Nothing to do in production — it never runs there. Locally: stop the process | — |

Switch public MCP off **first, then investigate**, on any confirmed leak of a hidden car,
a suspended dealership's data or a private field (email, plan) — that is the pilot's
stop rule (plans/mcp, ROADMAP §Pilot).

## Limits (public MCP)

Provisional; tuned from the pilot. All per IP unless noted. Set in Vercel, then redeploy.

| Variable | Default | Meaning |
|---|---|---|
| `MCP_RL_IP_REFILL` | 30 | Requests a minute an IP regains (token bucket) |
| `MCP_RL_IP_CAPACITY` | 60 | Burst an IP may spend at once |
| `MCP_RL_GLOBAL_PER_MINUTE` | 1200 | Ceiling across all callers together |
| `MCP_RL_COSTLY_PER_HOUR` | 120 | Free-text searches, deep pages and comparisons per hour |
| `MCP_RL_CAR_MISSES` | 20 | `get_car` not-founds allowed per 10 minutes before an IP is cut off (an id scan) |

Also fixed in code: 16 KB request body, 5 s per tool call, 20 results a page and 20 pages.
`pnpm mcp:load-test` checks the limits (it refuses production without `--production`).

## Secrets and tokens

| What | Rotate when | How | Note |
|---|---|---|---|
| `MCP_IP_HASH_SECRET` (hashes caller IPs in `McpToolCall`) | Suspected leak | New random value in Vercel, redeploy | Distinct-client counts restart from the change |
| `NEXT_PUBLIC_WEBMCP_TRIAL_TOKEN` | Before it expires — **2027-03-31** (trial: Chrome 149–162) — or when Chrome issues a new one | Renew on the [origin-trial console](https://developer.chrome.com/origintrials/#/register_trial/4163014905550602241) for `https://auto-me.vercel.app`, paste into Vercel as **Config** (public by design), redeploy | Bound to one origin; previews and dealer subdomains are not covered |
| Ops role `autome_ops_ro` password | Any time; never shared | `ALTER ROLE autome_ops_ro PASSWORD '<new>';` then update `.env.ops` and run `pnpm -s mcp:ops --check` | Local databases only; the role's setup SQL is in `scripts/mcp/ai-ops/server.ts` |

## Monitoring

**What is recorded**

- Every public MCP call: a row in `McpToolCall` (tool, duration, result count, error code,
  client name, hashed IP — never the query text). Clicks through to AutoMe: `McpReferral`.
- Sentry, tagged `surface: mcp`:
  - each failure that is AutoMe's fault or a dependency down — error codes `internal` and
    `unavailable`, one issue per tool and code (`mcp.tool`, `mcp.error_code`), including
    the rate limiter being unreachable (`mcp.tool: (rate-limit)`) and a request the
    transport could not handle (`(request)`);
  - once a day (`/api/cron/mcp-health`, 04:15 UTC), when the last 24 hours missed the
    pilot's targets — AutoMe errors ≥ 1 % of calls, timeouts/unavailable ≥ 0.5 %, a tool's
    p95 ≥ 800 ms — one error tagged `mcp.check: daily-health`. Days with fewer than 20
    calls are not judged.
- Not sent anywhere: `invalid_input`, `not_found`, `rate_limited` — a caller's ordinary
  refusals. They are in `McpToolCall` and the pilot report.

**Alert rules to create in Sentry** (Alerts → Create alert → Issues, project of this app)

1. *MCP failures* — filter: the event's tag `surface` equals `mcp`, and tag `mcp.check` is
   not set; when the issue is first seen, **or** an issue has more than 10 events in one
   hour → email the owner.
2. *MCP daily health* — filter: tag `mcp.check` equals `daily-health`; on every event →
   email the owner.

**Reading the numbers**

- `pnpm mcp:pilot-report --days 7` — calls, error and timeout rates, zero-result rate,
  p50/p95 per tool, clients, click-throughs. It reads the database `DATABASE_URL` points
  at; reading production needs the owner's approval.
- The health check by hand: `curl -H "Authorization: Bearer $CRON_SECRET" https://auto-me.vercel.app/api/cron/mcp-health`.

## Incidents

| Signal | First step | Then |
|---|---|---|
| A hidden car, suspended dealership or private field in an answer | Switch public MCP off | Reproduce with the visibility tests (`test/public-visibility.test.ts`, `test/mcp-public-tools.test.ts`); fix; re-review before switching on |
| *MCP failures* alert, code `internal` | Open the Sentry issue for the tool | Pilot report for scale; a recent deploy → Vercel instant rollback |
| *MCP failures*, code `unavailable`, tool `(rate-limit)` | Check Arcjet's status | Every call is refused while the limiter cannot decide (it fails closed); nothing to switch off |
| *MCP daily health*, latency | Pilot report: which tool | Supabase CPU and slow queries; the search's own p95 on `/cars` |
| Many `rate_limited` from one client | Pilot report → clients | A real client: raise `MCP_RL_*`. A scraper: leave it limited |
| WebMCP misbehaving in Chrome | Remove the trial token (above) | The site never depends on WebMCP; fix, then restore the token |
| Chrome ends or changes the trial | — | Tools register nothing on an unknown API (feature-detected); recheck the API (plans/mcp D-25) before renewing |

Planning documents, decisions and the pilot protocol are kept outside the repository (`plans/mcp/`).
