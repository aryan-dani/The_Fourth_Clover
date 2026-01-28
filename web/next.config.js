/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fntnxpwxuxtztyqoiika.supabase.co",
      },
    ],
  },
  // Disable static page caching for pages that depend on client-side auth
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle webpack warnings for Supabase realtime dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Ignore critical dependency warnings from @supabase/realtime-js
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Handle ws module for browser compatibility
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ws: false,
      };
    }

    return config;
  },
  turbopack: {},
};

module.exports = nextConfig;
