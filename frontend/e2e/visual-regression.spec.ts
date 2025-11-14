import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('basic visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png');
  });
});
