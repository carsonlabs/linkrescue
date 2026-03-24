import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['cjs'],
  target: 'node20',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: false,
  dts: false,
  // Bundle everything so npx works without install
  noExternal: [
    '@linkrescue/crawler',
    '@linkrescue/types',
    'chalk',
    'commander',
    'ora',
    'cheerio',
    'fast-xml-parser',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
