/**
 * Comprehensive E2E Tests for Authentication Flows
 * Tests login, signup, logout, and session management
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Login Flow', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      // Wait for page to load
      await expect(page.getByText('Welcome back')).toBeVisible();

      // Click email sign in
      await page.getByRole('button', { name: /sign in with email/i }).click();

      // Fill credentials
      await page.getByLabel('Email').fill('aitest2@udigit.ca');
      await page.getByLabel('Password').fill('TestAI2024!@#$');

      // Submit
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Verify redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText('Welcome back, AI!')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.getByRole('button', { name: /sign in with email/i }).click();
      await page.getByLabel('Email').fill('wrong@example.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid email or password/i)).toBeVisible();

      // Should stay on signin page
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.getByRole('button', { name: /sign in with email/i }).click();
      await page.getByLabel('Email').fill('not-an-email');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Should show validation error
      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should require password', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.getByRole('button', { name: /sign in with email/i }).click();
      await page.getByLabel('Email').fill('test@example.com');
      // Don't fill password
      await page.getByRole('button', { name: /^sign in$/i }).click();

      // Should show validation error
      await expect(page.getByText(/password.*required/i)).toBeVisible();
    });
  });

  test.describe('Signup Flow', () => {
    test('should signup with valid information', async ({ page }) => {
      await page.goto('/auth/signup');

      // Fill signup form
      await page.getByLabel('First Name').fill('Test');
      await page.getByLabel('Last Name').fill('User');
      await page.getByLabel('Email').fill(`test${Date.now()}@example.com`);
      await page.getByLabel('Phone').fill('506-555-1234');
      await page.getByLabel('Password').fill('SecureP@ss123');
      await page.getByLabel('Confirm Password').fill('SecureP@ss123');

      // Accept terms
      await page.getByLabel(/accept terms/i).check();

      // Submit
      await page.getByRole('button', { name: /sign up/i }).click();

      // Should show success or verification message
      await expect(
        page.getByText(/check your email|success|welcome/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Password').fill('weak');

      // Should show strength indicator
      await expect(page.getByText(/weak|password strength/i)).toBeVisible();
    });

    test('should require matching passwords', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Password').fill('SecureP@ss123');
      await page.getByLabel('Confirm Password').fill('DifferentP@ss123');

      await page.getByRole('button', { name: /sign up/i }).click();

      // Should show error
      await expect(page.getByText(/passwords.*match/i)).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('SecureP@ss123');
      // Don't check terms

      await page.getByRole('button', { name: /sign up/i }).click();

      // Should show error or button disabled
      const submitButton = page.getByRole('button', { name: /sign up/i });
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/auth/signin');
      await page.getByRole('button', { name: /sign in with email/i }).click();
      await page.getByLabel('Email').fill('aitest2@udigit.ca');
      await page.getByLabel('Password').fill('TestAI2024!@#$');
      await page.getByRole('button', { name: /^sign in$/i }).click();
      await page.waitForURL('/dashboard');

      // Logout
      await page.goto('/auth/signout');

      // Should redirect to home or signin
      await expect(page).toHaveURL(/\/(auth\/signin)?$/);
    });

    test('should clear session on logout', async ({ page }) => {
      // Login
      await page.goto('/auth/signin');
      await page.getByRole('button', { name: /sign in with email/i }).click();
      await page.getByLabel('Email').fill('aitest2@udigit.ca');
      await page.getByLabel('Password').fill('TestAI2024!@#$');
      await page.getByRole('button', { name: /^sign in$/i }).click();
      await page.waitForURL('/dashboard');

      // Logout
      await page.goto('/auth/signout');

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to signin
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page navigations', async ({ page }) => {
      // Login
      await page.goto('/auth/signin');
      await page.getByRole('button', { name: /sign in with email/i }).click();
      await page.getByLabel('Email').fill('aitest2@udigit.ca');
      await page.getByLabel('Password').fill('TestAI2024!@#$');
      await page.getByRole('button', { name: /^sign in$/i }).click();
      await page.waitForURL('/dashboard');

      // Navigate to profile
      await page.goto('/profile');
      await expect(page.getByText('Profile Settings')).toBeVisible();

      // Navigate to bookings
      await page.goto('/bookings');

      // Should still be logged in (not redirected to signin)
      await expect(page).not.toHaveURL(/\/auth\/signin/);
    });

    test('should redirect to signin if session expired', async ({ page }) => {
      // Try to access protected route without login
      await page.goto('/dashboard');

      // Should redirect to signin
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should protect /dashboard route', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should protect /profile route', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should protect /bookings route', async ({ page }) => {
      await page.goto('/bookings');
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should allow access to public routes', async ({ page }) => {
      const publicRoutes = ['/', '/about', '/contact', '/equipment', '/faq'];

      for (const route of publicRoutes) {
        await page.goto(route);
        // Should not redirect to signin
        await expect(page).not.toHaveURL(/\/auth\/signin/);
      }
    });
  });
});


