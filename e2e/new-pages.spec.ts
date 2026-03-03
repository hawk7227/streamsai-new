import { test, expect } from '@playwright/test';

const newPages = [
  { path: '/dashboard/compose', name: 'Composition Studio', expects: ['Composition Studio', 'Template', 'Assets'] },
  { path: '/dashboard/renders', name: 'Renders Dashboard', expects: ['Renders Dashboard', 'SSE Live'] },
  { path: '/dashboard/characters', name: 'Characters', expects: ['Characters', 'Brand Kit'] },
];

for (const p of newPages) {
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

test('Compose page has template grid', async ({ page }) => {
  await page.goto('/dashboard/compose');
  await expect(page.getByText('TikTok Reel')).toBeVisible();
  await expect(page.getByText('YouTube Intro')).toBeVisible();
  await expect(page.getByText('IG Story')).toBeVisible();
});

test('Compose page has render button', async ({ page }) => {
  await page.goto('/dashboard/compose');
  await expect(page.getByRole('button', { name: /Render/i })).toBeVisible();
});

test('Renders page has filter tabs', async ({ page }) => {
  await page.goto('/dashboard/renders');
  await expect(page.getByText('All')).toBeVisible();
  await expect(page.getByText('AI', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Failed')).toBeVisible();
});

test('Characters page tab switching works', async ({ page }) => {
  await page.goto('/dashboard/characters');
  await page.getByText('Brand Kit').click();
  await expect(page.getByText('Brand Colors')).toBeVisible();
  await expect(page.getByText('Voice Profiles')).toBeVisible();
});
