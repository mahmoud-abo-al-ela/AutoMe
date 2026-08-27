/**
 * Whether the Sentry SDK and its build plugin should be active.
 *
 * Shared by instrumentation.ts and instrumentation-client.ts. next.config.mjs
 * duplicates the same condition inline — it is loaded by Node before any TS
 * exists, so it cannot import this. Keep the two in sync: a half-enabled Sentry
 * sends events to a tunnel route that does not exist.
 *
 * Off in development because it is the single largest cost at dev boot:
 * `withSentryConfig` bundles the Node and Edge SDKs into /instrumentation
 * (1083 modules, ~10.5s) *before* `next dev` reports ready, and a local machine
 * reports nothing anyone reads. Set SENTRY_ENABLE_DEV=1 to opt back in when you
 * are specifically debugging Sentry itself.
 */
export const sentryEnabled =
  process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLE_DEV === "1";
