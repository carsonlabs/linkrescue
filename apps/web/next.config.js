/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@linkrescue/database', '@linkrescue/crawler', '@linkrescue/email', '@linkrescue/types', '@linkrescue/ai', '@linkrescue/governance'],
};

module.exports = nextConfig;
