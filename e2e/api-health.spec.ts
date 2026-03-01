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
