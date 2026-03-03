import { test, expect } from '@playwright/test';

test('Generate page has execution mode selector', async ({ page }) => {
  await page.goto('/dashboard/generate');
  await expect(page.getByText('Manual')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Hybrid')).toBeVisible();
  await expect(page.getByText('Automatic')).toBeVisible();
});

test('Generate page execution mode switching shows panels', async ({ page }) => {
  await page.goto('/dashboard/generate');
  // Click Hybrid
  await page.getByRole('button', { name: /Hybrid/i }).click();
  await expect(page.getByText('Hybrid Pipeline')).toBeVisible();
  // Click Automatic
  await page.getByRole('button', { name: /Automatic/i }).click();
  await expect(page.getByText('Automatic Mode')).toBeVisible();
  // Click Manual
  await page.getByRole('button', { name: /Manual/i }).click();
  await expect(page.getByText('Hybrid Pipeline')).not.toBeVisible();
});

test('Generate page has preview gates', async ({ page }) => {
  await page.goto('/dashboard/generate');
  await expect(page.getByText('Preview Gates')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Storyboard')).toBeVisible();
  await expect(page.getByText('Animatic')).toBeVisible();
  await expect(page.getByText('Full Render')).toBeVisible();
});

test('Generate page has safe zone panel', async ({ page }) => {
  await page.goto('/dashboard/generate');
  await expect(page.getByText('Platform Safe Zones')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('TikTok', { exact: false }).first()).toBeVisible();
});

test('Generate page shows camera controls for video tool', async ({ page }) => {
  await page.goto('/dashboard/generate');
  // Click Video tool
  await page.getByText('Video', { exact: true }).first().click();
  await expect(page.getByText('Camera:', { exact: false })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Pan L')).toBeVisible();
  await expect(page.getByText('Orbit')).toBeVisible();
});

test('Generate page shows character ref for video tool', async ({ page }) => {
  await page.goto('/dashboard/generate');
  await page.getByText('Video', { exact: true }).first().click();
  await expect(page.getByText('identity lock', { exact: false })).toBeVisible({ timeout: 10000 });
});
