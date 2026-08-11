import * as Sentry from "@sentry/nextjs";

export function register() {
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

export const onRequestError = Sentry.captureRequestError;
