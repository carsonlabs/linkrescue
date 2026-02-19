/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@linkrescue/database', '@linkrescue/crawler', '@linkrescue/email', '@linkrescue/types'],
  experimental: {
    // cheerio@1.2+ unconditionally imports undici (for its URL-fetch feature).
    // undici@7 uses ES2022 ergonomic brand-checks (#field in obj) that
    // webpack/acorn cannot parse at the default ecmaVersion.
    // Marking them as server-external keeps them as Node-native requires
    // so webpack never attempts to parse their source.
    serverComponentsExternalPackages: ['undici', 'cheerio'],
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Belt-and-suspenders: also add undici to webpack externals directly.
      // serverComponentsExternalPackages alone is insufficient when undici is
      // reached transitively through a transpilePackages entry (@linkrescue/crawler
      // → cheerio → undici). The explicit external prevents webpack from ever
      // attempting to parse undici's ES2022 private-brand-check syntax.
      config.externals.push(({ request }, callback) => {
        if (request === 'undici') return callback(null, 'commonjs undici');
        callback();
      });
    }
    return config;
  },
};

module.exports = nextConfig;
