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

  // Enable subdomain routing in development
  async rewrites() {
    return {
      beforeFiles: [
        // Handle subdomain requests by passing org slug as header
        // This is handled in middleware, rewrites are for fallback
      ],
    };
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
      {
        // Allow subdomain cookies
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
