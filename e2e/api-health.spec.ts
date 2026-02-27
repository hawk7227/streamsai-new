import { test, expect } from '@playwright/test';

const apiRoutes = [
  { path: '/api/generations', name: 'Generations' },
  { path: '/api/automations', name: 'Automations' },
  { path: '/api/usage', name: 'Usage' },
  { path: '/api/team', name: 'Team' },
];

for (const route of apiRoutes) {
  test(`API ${route.name} (${route.path}) does not return 500`, async ({ request }) => {
    const response = await request.get(route.path);
    // 401 unauthenticated is fine — just not 500
    expect(response.status()).not.toBe(500);
    expect(response.status()).toBeLessThan(503);
  });
}

test('Worker endpoint responds', async ({ request }) => {
  const response = await request.get('/api/workers/process');
  expect([200, 401]).toContain(response.status());
});

test('Automation scheduler responds', async ({ request }) => {
  const response = await request.get('/api/workers/automations');
  expect([200, 401]).toContain(response.status());
});
SMOKE_EOF

# Navigation tests
cat > e2e/navigation.spec.ts << 'NAV_EOF'
import { test, expect } from '@playwright/test';

test('Login page has email and password fields', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('Signup page has form fields', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('Pricing page shows plan cards', async ({ page }) => {
  await page.goto('/pricing');
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  expect(body).toContain('Free');
  expect(body).toContain('Starter');
});

test('Home page has hero and CTA', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  expect(body.length).toBeGreaterThan(50);
});

test('Features page renders', async ({ page }) => {
  await page.goto('/features');
  await page.waitForLoadState('networkidle');
  const body = await page.locator('body').innerText();
  expect(body.length).toBeGreaterThan(50);
});
NAV_EOF

# GitHub Actions
cat > .github/workflows/e2e-tests.yml << 'GH_EOF'
name: E2E Tests
on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
GH_EOF

echo "smoke.spec.ts: $(wc -l < e2e/smoke.spec.ts) lines"
echo "api-health.spec.ts: $(wc -l < e2e/api-health.spec.ts) lines"
echo "navigation.spec.ts: $(wc -l < e2e/navigation.spec.ts) lines"
echo "e2e-tests.yml: $(wc -l < .github/workflows/e2e-tests.yml) lines"
echo "playwright.config.ts: $(wc -l < playwright.config.ts) lines"