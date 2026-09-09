import type { NextConfig } from "next";

const rawBackend = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000"
).trim().replace(/\/+$/, '').replace(/\/api$/, '');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${rawBackend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
