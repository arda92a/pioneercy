import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploads are served directly by Nginx; skip Next.js optimization pipeline
    unoptimized: true,
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
