import type { Instrumentation } from "next";
import { sentryEnabled } from "@/lib/sentry-enabled";

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
