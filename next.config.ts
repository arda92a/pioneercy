import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [],
    remotePatterns: [],
  },
  // Allow serving uploaded images from /public/uploads
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
