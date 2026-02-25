/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@linkrescue/database', '@linkrescue/crawler', '@linkrescue/email', '@linkrescue/types', '@linkrescue/ai', '@linkrescue/governance'],
  async rewrites() {
    return [
      { source: '/sites/:path*', destination: '/dashboard/sites/:path*' },
      { source: '/analytics/:path*', destination: '/dashboard/analytics/:path*' },
      { source: '/guardian/:path*', destination: '/dashboard/guardian/:path*' },
      { source: '/offers/:path*', destination: '/dashboard/offers/:path*' },
      { source: '/orgs/:path*', destination: '/dashboard/orgs/:path*' },
      { source: '/redirect-rules/:path*', destination: '/dashboard/redirect-rules/:path*' },
      { source: '/reports/:path*', destination: '/dashboard/reports/:path*' },
      { source: '/script/:path*', destination: '/dashboard/script/:path*' },
      { source: '/settings/:path*', destination: '/dashboard/settings/:path*' },
      { source: '/monitoring/:path*', destination: '/dashboard/monitoring/:path*' },
      { source: '/sites', destination: '/dashboard/sites' },
      { source: '/analytics', destination: '/dashboard/analytics' },
      { source: '/guardian', destination: '/dashboard/guardian' },
      { source: '/offers', destination: '/dashboard/offers' },
      { source: '/orgs', destination: '/dashboard/orgs' },
      { source: '/redirect-rules', destination: '/dashboard/redirect-rules' },
      { source: '/reports', destination: '/dashboard/reports' },
      { source: '/script', destination: '/dashboard/script' },
      { source: '/settings', destination: '/dashboard/settings' },
      { source: '/monitoring', destination: '/dashboard/monitoring' },
    ];
  },
};

module.exports = nextConfig;
