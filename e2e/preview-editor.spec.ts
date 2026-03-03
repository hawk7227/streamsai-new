import { test, expect } from '@playwright/test';

const dashboardPages = [
  { path: '/dashboard/preview', name: 'Preview', expects: ['Preview', 'Storyboard', 'Safe Zone'] },
  { path: '/dashboard/editor', name: 'Editor', expects: ['Editor', 'Overlays', 'Captions'] },
];

for (const p of dashboardPages) {
  test(p.name + ' page loads without crashing', async ({ page }) => {
    const response = await page.goto(p.path);
    expect(response?.status()).toBeLessThan(500);
    const text = await page.locator('body').innerText();
    expect(text.trim().length).toBeGreaterThan(10);
    await expect(page.locator('text=Application error')).not.toBeVisible();
  });

  test(p.name + ' page has expected content', async ({ page }) => {
    await page.goto(p.path);
    for (const exp of p.expects) {
      await expect(page.getByText(exp, { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  });
}

test('Preview page has View in Editor button', async ({ page }) => {
  await page.goto('/dashboard/preview');
  const btn = page.getByRole('button', { name: /View in Editor/i });
  await expect(btn.first()).toBeVisible();
});

test('Preview page has platform mockups', async ({ page }) => {
  await page.goto('/dashboard/preview');
  await expect(page.getByText('TikTok')).toBeVisible();
  await expect(page.getByText('IG Reels')).toBeVisible();
  await expect(page.getByText('YT Shorts')).toBeVisible();
});

test('Preview page has scene grid', async ({ page }) => {
  await page.goto('/dashboard/preview');
  await expect(page.getByText('Hook')).toBeVisible();
  await expect(page.getByText('CTA')).toBeVisible();
});

test('Editor page has timeline tracks', async ({ page }) => {
  await page.goto('/dashboard/editor');
  await expect(page.getByText('Voiceover')).toBeVisible();
  await expect(page.getByText('Hero Shot')).toBeVisible();
});

test('Editor page tab switching works', async ({ page }) => {
  await page.goto('/dashboard/editor');
  await page.getByText('Captions').click();
  await expect(page.getByText('Caption Styles')).toBeVisible();
  await page.getByText('Transitions').click();
  await expect(page.getByText('Transition Library')).toBeVisible();
});

test('Preview View in Editor navigates to editor', async ({ page }) => {
  await page.goto('/dashboard/preview');
  await page.getByRole('button', { name: /View in Editor/i }).first().click();
  await page.waitForURL('**/dashboard/editor');
  await expect(page.getByText('Video Editor')).toBeVisible();
});

test('Editor Back to Preview navigates to preview', async ({ page }) => {
  await page.goto('/dashboard/editor');
  await page.getByRole('button', { name: /Back to Preview/i }).click();
  await page.waitForURL('**/dashboard/preview');
  await expect(page.getByText('Safe Zone Compliance')).toBeVisible();
});

test('Generate page has Preview in Platforms button', async ({ page }) => {
  await page.goto('/dashboard/generate');
  await expect(page.getByText('Preview in Platforms')).toBeVisible();
});
