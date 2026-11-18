import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Turbopack scoped to this app instead of walking up to the unrelated parent lockfile.
  turbopack: { root: process.cwd() },
  async headers() {
    const mediaCache = 'public, max-age=86400, stale-while-revalidate=604800';
    return [
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: mediaCache }] },
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: mediaCache }] },
      { source: '/video/:path*', headers: [{ key: 'Cache-Control', value: mediaCache }] },
      { source: '/videos/:path*', headers: [{ key: 'Cache-Control', value: mediaCache }] },
    ];
  },
};

export default nextConfig;
