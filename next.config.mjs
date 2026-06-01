import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "okrloefgsswtpefsobqe.supabase.co",
      },
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

  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-src https://roadsidecoder.created.app; frame-ancestors https://roadsidecoder.created.app;",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
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
