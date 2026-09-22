import type { Instrumentation } from "next";
import { sentryEnabled } from "@/lib/sentry-enabled";

/**
 * Sentry is imported dynamically, inside the `sentryEnabled` branch.
 *
 * A top-level `import * as Sentry` is static, so the bundler pulls the whole
 * SDK — plus its OpenTelemetry dependency tree — into /instrumentation even
 * when `register()` returns immediately. That is the ~10s dev-boot cost this
 * flag exists to avoid, so the import has to be lazy for the flag to mean
 * anything.
 */
export async function register() {
  if (!sentryEnabled) return;

  const Sentry = await import("@sentry/nextjs");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
      sendDefaultPii: true,
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
      includeLocalVariables: true,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
      sendDefaultPii: true,
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  if (!sentryEnabled) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
