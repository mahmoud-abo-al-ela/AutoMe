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

const onVercel = process.env.VERCEL === "1";

const nextConfig = {
  typescript: { ignoreBuildErrors: onVercel },
  eslint: { ignoreDuringBuilds: onVercel },
  experimental: {
    rootParams: true,
    serverActions: {
      // Saving a car sends its photos through a server action, and the 1 MB
      // default refused all but the smallest. Kept under the 4.5 MB request
      // body Vercel allows a function.
      bodySizeLimit: "4mb",
    },
  },
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
      {
        // The demo cars' photos (scripts/demo-data/photos.ts), from Wikimedia Commons.
        protocol: "https",
        hostname: "thumb.wikimedia.org",
      },
    ],
  },

  // /pricing is where people guess the plans are; they are on /for-dealers.
  // Here rather than as a page: the (site) layout streams behind a Suspense
  // boundary, so a page's redirect() arrives as a client-side hop with a 200,
  // not an HTTP redirect.
  async redirects() {
    return [
      {
        source: "/:locale(en|ar)/pricing",
        destination: "/:locale/for-dealers",
        permanent: false,
      },
    ];
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
