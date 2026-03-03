import { test, expect } from '@playwright/test';

test('Editor has safe zone overlay toggle', async ({ page }) => {
  await page.goto('/dashboard/editor');
  await expect(page.getByText('Safe Zone On').or(page.getByText('Safe Zone Off'))).toBeVisible({ timeout: 10000 });
});

test('Editor has platform selector', async ({ page }) => {
  await page.goto('/dashboard/editor');
  // The platform dropdown should be visible when safe zone is on
  const select = page.locator('select').first();
  await expect(select).toBeVisible({ timeout: 10000 });
});

test('Editor has presets bar', async ({ page }) => {
  await page.goto('/dashboard/editor');
  await expect(page.getByText('Cinematic Documentary')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Music Video')).toBeVisible();
  await expect(page.getByText('Social Hook')).toBeVisible();
});

test('Editor overlays include Film Grain and Light Leaks', async ({ page }) => {
  await page.goto('/dashboard/editor');
  await expect(page.getByText('Film Grain')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Light Leaks')).toBeVisible();
});
