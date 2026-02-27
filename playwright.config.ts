import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: ['tests/**/*.spec.ts', 'e2e/**/*.spec.ts'],
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'api', testMatch: 'tests/**/*.spec.ts' },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testMatch: 'e2e/**/*.spec.ts' },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        port: 3000,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
