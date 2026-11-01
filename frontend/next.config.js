/** @type {import('next').NextConfig} */
function getNormalizedBackendUrl() {
  const envUrl = (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim().replace(/\/+$/, '').replace(/\/api$/, '');

  if (!envUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://127.0.0.1:8000";
    }
    return null;
  }

  let normalized = envUrl;
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    if (normalized.startsWith("localhost") || normalized.startsWith("127.0.0.1")) {
      normalized = `http://${normalized}`;
    } else {
      normalized = `https://${normalized}`;
    }
  }

  return normalized;
}

const backend = getNormalizedBackendUrl();

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    if (!backend) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
