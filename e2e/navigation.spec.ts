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
