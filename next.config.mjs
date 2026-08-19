import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

export default withSentryConfig(withNextIntl(nextConfig), {
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
