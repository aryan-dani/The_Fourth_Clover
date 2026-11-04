const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-toast",
      "@radix-ui/react-alert-dialog",
    ],
  },
  async redirects() {
    return [
      { source: "/explore", destination: "/journal", permanent: true },
      {
        source: "/explore/following",
        destination: "/following",
        permanent: true,
      },
      { source: "/csi", destination: "/tech-weekly", permanent: true },
      // /csi/write is handled by app/(main)/csi/write/page.tsx so ?edit= maps to ?id=
      {
        source: "/csi/review",
        destination: "/tech-weekly/review",
        permanent: true,
      },
      { source: "/profile", destination: "/settings", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fntnxpwxuxtztyqoiika.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "miro.medium.com",
        pathname: "/**",
      },
    ],
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

module.exports = withBundleAnalyzer(nextConfig);
