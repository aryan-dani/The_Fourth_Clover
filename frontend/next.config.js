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
  async headers() {
    const edgeCache = [
      {
        key: "Netlify-CDN-Cache-Control",
        value: "public, s-maxage=300, stale-while-revalidate=86400",
      },
      {
        key: "Cache-Control",
        value: "public, max-age=0, must-revalidate",
      },
    ];
    const privateNoStore = [
      {
        key: "Netlify-CDN-Cache-Control",
        value: "private, no-store",
      },
      {
        key: "Cache-Control",
        value: "private, no-store",
      },
    ];
    // First match wins — keep write/review desks private before /tech-weekly/:slug.
    return [
      { source: "/tech-weekly/write", headers: privateNoStore },
      { source: "/tech-weekly/write/:path*", headers: privateNoStore },
      { source: "/tech-weekly/review", headers: privateNoStore },
      { source: "/tech-weekly/review/:path*", headers: privateNoStore },
      { source: "/", headers: edgeCache },
      { source: "/journal", headers: edgeCache },
      { source: "/journal/:path*", headers: edgeCache },
      { source: "/post/:slug", headers: edgeCache },
      { source: "/tech-weekly", headers: edgeCache },
      { source: "/tech-weekly/:slug", headers: edgeCache },
      { source: "/about", headers: edgeCache },
      { source: "/tags", headers: edgeCache },
      { source: "/tags/:tag", headers: edgeCache },
      { source: "/profile/:username", headers: edgeCache },
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
