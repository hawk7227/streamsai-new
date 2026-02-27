import { test, expect } from '@playwright/test';

const publicPages = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/features', name: 'Features' },
  { path: '/products', name: 'Products' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
  { path: '/terms', name: 'Terms' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/help-center', name: 'Help Center' },
];

for (const p of publicPages) {
  test(`${p.name} (${p.path}) loads without crashing`, async ({ page }) => {
    const response = await page.goto(p.path);
    expect(response?.status()).toBeLessThan(500);
    const text = await page.locator('body').innerText();
    expect(text.trim().length).toBeGreaterThan(10);
    await expect(page.locator('text=Application error')).not.toBeVisible();
  });
}
