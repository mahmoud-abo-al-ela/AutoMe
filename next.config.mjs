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

export default nextConfig;
