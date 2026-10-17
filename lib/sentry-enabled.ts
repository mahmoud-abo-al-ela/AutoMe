export const sentryEnabled =
  process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLE_DEV === "1";
