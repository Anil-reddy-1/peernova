import { test, expect } from '@playwright/test';

test.describe('Security & Authentication', () => {
  test('unauthenticated users should be redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Expect redirection to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
