import type { NextConfig } from "next";

const previewOrigins = [
  "127.0.0.1",
  "localhost",
  "*.cursor.com",
  "*.cursor.sh",
  "*.cursorapi.com",
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "r2.thesportsdb.com", pathname: "/**" },
      { protocol: "https", hostname: "www.thesportsdb.com", pathname: "/**" },
    ],
  },
  allowedDevOrigins: previewOrigins,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
