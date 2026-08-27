import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// See the block comment above withSentry below.
const sentryEnabled =
  process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLE_DEV === "1";

// Derive the Supabase storage hostname from the configured URL rather than
// hardcoding one project's subdomain — that breaks any non-prod/self-hosted
// deployment. Falls back to undefined (dropped below) when unset.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https", hostname: supabaseHostname }]
        : []),
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  webpack: (config) => {
    // @supabase/realtime-js loads its WebSocket impl via a dynamic require, which
    // webpack can't statically analyze ("Critical dependency: the request of a
    // dependency is an expression"). We only use Supabase for storage, never
    // realtime, so this warning is a harmless false positive — silence it.
    config.ignoreWarnings = [{ module: /@supabase\/realtime-js/ }];
    return config;
  },
};

/**
 * Sentry is wrapped only for real builds.
 *
 * withSentryConfig + instrumentation.ts cost ~10.5s of compile at every
 * `next dev` boot: the Node and Edge SDKs are bundled into /instrumentation
 * (1083 modules) *before* the server reports ready, and a local machine reports
 * nothing anyone reads. Set SENTRY_ENABLE_DEV=1 to opt back in when you are
 * specifically debugging Sentry itself.
 *
 * The condition is duplicated in lib/sentry-enabled.ts rather than imported:
 * this file is loaded by Node before any TS exists, so it cannot import one.
 * Keep the two in sync.
 */
const withSentry = (config) =>
  withSentryConfig(config, {
    org: "mahmoud-ali-re",
    project: "autome",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Create a proxy API route to bypass ad-blockers
    tunnelRoute: "/monitoring",

    // Upload wider set of client source files for better stack trace resolution
    widenClientFileUpload: true,
    hideSourceMaps: true,
  });

const config = withNextIntl(nextConfig);

export default sentryEnabled ? withSentry(config) : config;
