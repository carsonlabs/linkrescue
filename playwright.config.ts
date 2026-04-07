import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://www.linkrescue.io';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // sequential so we can see flow
  retries: 0, // no retries — we want to see real failures
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/html-report' }]],

  use: {
    baseURL: BASE_URL,
    screenshot: 'on', // screenshot every test
    trace: 'on-first-retry',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
