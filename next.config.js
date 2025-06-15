/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
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
};

module.exports = nextConfig;
