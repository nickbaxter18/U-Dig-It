// Authentication helpers for admin E2E tests
import { Page, BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export const ADMIN_TEST_ACCOUNT = {
  email: 'aitest2@udigit.ca',
  password: 'TestAI2024!@#$',
};

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bnimazxnqligusckahab.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc';

export class AdminAuthHelper {
  constructor(private page: Page, private context: BrowserContext) {}

  /**
   * Login as admin user via UI (most reliable for SSR apps)
   */
  async login(): Promise<void> {
    await this.page.goto('/auth/signin');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);

    // Check if email form is visible, if not click to show it
    const emailInput = this.page.locator('input[type="email"], input[name="email"], input#email');
    const emailInputCount = await emailInput.count();

    if (emailInputCount === 0) {
      // Click "Sign in with email" button
      const emailButton = this.page
        .getByRole('button', { name: /sign in with email/i })
        .or(this.page.locator('button:has-text("Sign in with email")'));

      if (await emailButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailButton.first().click();
        await this.page.waitForTimeout(800);
      }
    }

    // Wait for email input
    await this.page.waitForSelector('input[type="email"], input[name="email"], input#email', {
      timeout: 15000,
      state: 'visible'
    });

    // Fill form
    const emailField = this.page.locator('input[type="email"], input[name="email"], input#email').first();
    const passwordField = this.page.locator('input[type="password"], input[name="password"], input#password').first();

    await emailField.clear();
    await emailField.fill(ADMIN_TEST_ACCOUNT.email);
    await this.page.waitForTimeout(200);

    await passwordField.clear();
    await passwordField.fill(ADMIN_TEST_ACCOUNT.password);
    await this.page.waitForTimeout(200);

    // Submit form and wait for navigation
    const submitButton = this.page.locator('button[type="submit"]')
      .or(this.page.getByRole('button', { name: /sign in/i }))
      .first();

    // Wait for navigation to complete
    await Promise.all([
      this.page.waitForURL(/\/admin|\/dashboard|\/$/, { timeout: 30000 }),
      submitButton.click(),
    ]);

    // If redirected to dashboard, go to admin
    const currentUrl = this.page.url();
    if (currentUrl.includes('/dashboard') && !currentUrl.includes('/admin')) {
      await this.page.goto('/admin/dashboard');
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
    }

    // Verify we're on admin page
    const finalUrl = this.page.url();
    if (finalUrl.includes('/auth/signin') || finalUrl.includes('/admin-login')) {
      throw new Error(`Login failed: Still on login page. URL: ${finalUrl}`);
    }
  }

  /**
   * Check if user is authenticated as admin
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check for admin-specific elements
      const hasAdminNav = await this.page.locator('nav, [data-testid="admin-sidebar"]').count() > 0;
      const isOnAdminPage = this.page.url().includes('/admin');
      return hasAdminNav || isOnAdminPage;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to admin page (will redirect to login if not authenticated)
   */
  async navigateToAdmin(path: string = '/admin/dashboard'): Promise<void> {
    await this.page.goto(path);

    // If redirected to login, authenticate first
    if (this.page.url().includes('/auth/signin') || this.page.url().includes('/admin-login')) {
      await this.login();
      await this.page.goto(path);
    }

    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Try to find logout button in various locations
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        '[data-testid="logout-button"]',
        'a:has-text("Logout")',
      ];

      for (const selector of logoutSelectors) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          await element.click();
          await this.page.waitForURL(/\/auth|\/login|\/$/, { timeout: 5000 });
          return;
        }
      }

      // Fallback: clear cookies and storage
      await this.context.clearCookies();
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.warn('Logout failed:', error);
    }
  }

  /**
   * Save authentication state for reuse
   */
  async saveAuthState(path: string = 'test-results/admin-auth.json'): Promise<void> {
    await this.context.storageState({ path });
  }

  /**
   * Load saved authentication state
   */
  static async loadAuthState(
    context: BrowserContext,
    path: string = 'test-results/admin-auth.json'
  ): Promise<void> {
    try {
      await context.addCookies(require(path).cookies);
    } catch {
      // Auth state doesn't exist, will need to login
    }
  }
}

