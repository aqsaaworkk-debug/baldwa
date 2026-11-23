import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The service pages were folded into the Services page tabs (client, 2026-11-21); old links open the right tab.
  async redirects() {
    return [
      { source: '/services/project-management-consultancy', destination: '/services#pmc', permanent: true },
      { source: '/services/architecture', destination: '/services#design', permanent: true },
      { source: '/services/interior-design', destination: '/services#design', permanent: true },
      { source: '/services/architectural-consultancy', destination: '/services#design', permanent: true },
      { source: '/services/bim-engineering', destination: '/services#bim', permanent: true },
    ];
  },
};

export default nextConfig;
