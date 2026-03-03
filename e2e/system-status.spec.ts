import { test, expect } from '@playwright/test';

test('system-status page loads', async ({ page }) => {
  const res = await page.goto('/system-status');
  expect(res?.status()).toBeLessThan(500);
  await expect(page.getByText('System Status')).toBeVisible({ timeout: 10000 });
});

test('system-status page has auto-refresh controls', async ({ page }) => {
  await page.goto('/system-status');
  await expect(page.getByText('LIVE').or(page.getByText('Paused'))).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /Refresh Now/i })).toBeVisible();
});

test('api/system-status returns JSON', async ({ request }) => {
  const res = await request.get('/api/system-status');
  expect([200, 207, 503]).toContain(res.status());
  const body = await res.json();
  expect(body).toHaveProperty('status');
  expect(body).toHaveProperty('services');
  expect(body).toHaveProperty('summary');
  expect(body).toHaveProperty('env');
  expect(body.summary).toHaveProperty('total');
  expect(body.summary).toHaveProperty('healthy');
});

test('build-report.json exists', async ({ request }) => {
  const res = await request.get('/build-report.json');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('guardrails');
  expect(body.guardrails.systemStatusPage).toBe(true);
  expect(body.guardrails.systemStatusApi).toBe(true);
  expect(body.guardrails.buildReportJson).toBe(true);
});
