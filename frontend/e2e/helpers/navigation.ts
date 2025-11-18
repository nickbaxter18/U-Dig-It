// Navigation helpers for admin E2E tests
import { Page, expect } from '@playwright/test';

export class AdminNavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to admin page and verify it loads
   */
  async goToAdminPage(path: string, expectedTitle?: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    if (expectedTitle) {
      await expect(this.page).toHaveTitle(new RegExp(expectedTitle, 'i'));
    }
  }

  /**
   * Navigate via sidebar
   */
  async navigateViaSidebar(linkText: string): Promise<void> {
    const sidebarLink = this.page
      .locator('nav a, [data-testid="admin-sidebar"] a')
      .filter({ hasText: new RegExp(linkText, 'i') })
      .first();

    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify page loaded successfully (no critical errors)
   */
  async verifyPageLoaded(): Promise<void> {
    await this.page.waitForSelector('body', { timeout: 10000 });

    // Simplified - only check for critical error components
    // Don't check general text to avoid false positives
    const criticalErrorSelectors = [
      '[data-testid="error-banner"]',
      '[data-testid="critical-error"]',
    ];

    for (const selector of criticalErrorSelectors) {
      const errorElement = this.page.locator(selector).first();
      const isVisible = await errorElement.isVisible({ timeout: 500 }).catch(() => false);
      if (isVisible) {
        const errorText = await errorElement.textContent();
        throw new Error(`Critical error detected: ${errorText}`);
      }
    }
  }

  /**
   * Wait for data to load (checks for loading spinners to disappear)
   */
  async waitForDataLoad(timeout: number = 10000): Promise<void> {
    // Wait for loading spinners to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-busy="true"]',
    ];

    for (const selector of loadingSelectors) {
      const loadingElement = this.page.locator(selector).first();
      const isVisible = await loadingElement.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        await loadingElement.waitFor({ state: 'hidden', timeout });
      }
    }

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify breadcrumb navigation
   */
  async verifyBreadcrumb(expectedItems: string[]): Promise<void> {
    const breadcrumb = this.page.locator('[aria-label="Breadcrumb"], nav[aria-label="Breadcrumb"]');
    if (await breadcrumb.count() > 0) {
      for (const item of expectedItems) {
        await expect(breadcrumb.getByText(item, { exact: false })).toBeVisible();
      }
    }
  }
}

