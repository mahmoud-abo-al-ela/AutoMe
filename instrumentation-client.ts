// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { sentryEnabled } from "@/lib/sentry-enabled";

// Dynamic for the same reason as instrumentation.ts: a static import bundles
// the SDK (and the replay integration) into every client entry regardless of
// the flag. See lib/sentry-enabled.ts.
if (sentryEnabled) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      sendDefaultPii: true,

      // 100% in dev, 10% in production
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

      // Session Replay: 10% of all sessions, 100% of sessions with errors
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      enableLogs: true,

      integrations: [Sentry.replayIntegration()],
    });
  });
}

// Type-only reference to the real export, so the signature stays in sync with
// the SDK. `typeof import()` is erased at compile time — it does not pull the
// module into the bundle the way a value import would.
type CaptureRouterTransitionStart =
  typeof import("@sentry/nextjs").captureRouterTransitionStart;

export const onRouterTransitionStart: CaptureRouterTransitionStart = (
  ...args
) => {
  if (!sentryEnabled) return;

  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureRouterTransitionStart(...args);
  });
};
