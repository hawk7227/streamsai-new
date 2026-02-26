import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
  },
  // No browser projects — API-only tests
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
    },
  ],
  // Start the dev server before tests (if not already running)
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
