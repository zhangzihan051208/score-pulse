import type { NextConfig } from "next";

const previewOrigins = [
  "127.0.0.1",
  "localhost",
  "*.cursor.com",
  "*.cursor.sh",
  "*.cursorapi.com",
];

const nextConfig: NextConfig = {
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
