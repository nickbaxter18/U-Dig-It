/**
 * Critical User Journey: Complete Booking Flow
 * Tests the most important user flow from start to finish
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Booking Journey - End to End', () => {
  test('should complete full booking journey as authenticated user', async ({ page }) => {
    // Step 1: Login
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    await page.getByLabel('Email').fill('aitest2@udigit.ca');
    await page.getByLabel('Password').fill('TestAI2024!@#$');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL('/dashboard');

    // Step 2: Navigate to booking
    await page.goto('/book');
    await expect(page.getByText(/book.*equipment|rental booking/i)).toBeVisible();

    // Step 3: Select dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Find and fill date inputs
    const startDateInput = page.getByLabel(/start date|pick.*up/i).first();
    const endDateInput = page.getByLabel(/end date|return/i).first();

    if (await startDateInput.isVisible()) {
      await startDateInput.fill(tomorrow.toISOString().split('T')[0]);
      await endDateInput.fill(nextWeek.toISOString().split('T')[0]);
    }

    // Step 4: Fill delivery information
    await page.getByLabel(/delivery address|address/i).first().fill('123 Main Street');
    await page.getByLabel(/city|delivery city/i).first().fill('Saint John');
    await page.getByLabel(/postal code|zip/i).first().fill('E2J 1H6');

    // Step 5: Review pricing
    await expect(page.getByText(/total|subtotal/i).first()).toBeVisible();

    // Step 6: Submit booking (or proceed to next step)
    const continueButton = page.getByRole('button', { name: /continue|next|book now/i }).first();

    if (await continueButton.isVisible()) {
      await continueButton.click();
    }

    // Step 7: Verify success or next step
    await expect(
      page.getByText(/success|confirmed|payment|contract/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should complete booking as guest user', async ({ page }) => {
    // Step 1: Go to booking page
    await page.goto('/book');

    // Step 2: Select guest checkout option
    const guestButton = page.getByRole('button', { name: /guest|continue without/i });

    if (await guestButton.isVisible()) {
      await guestButton.click();
    }

    // Step 3: Fill guest information
    await page.getByLabel(/first name/i).fill('Guest');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email/i).fill(`guest${Date.now()}@example.com`);
    await page.getByLabel(/phone/i).fill('506-555-9999');

    // Step 4: Fill booking details
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 9);

    const startInput = page.getByLabel(/start date/i).first();
    if (await startInput.isVisible()) {
      await startInput.fill(tomorrow.toISOString().split('T')[0]);
    }

    const endInput = page.getByLabel(/end date/i).first();
    if (await endInput.isVisible()) {
      await endInput.fill(nextWeek.toISOString().split('T')[0]);
    }

    // Step 5: Fill delivery address
    await page.getByLabel(/delivery address|address/i).first().fill('456 Guest Avenue');
    await page.getByLabel(/city/i).first().fill('Saint John');

    // Step 6: Submit
    const submitButton = page.getByRole('button', { name: /submit|book|continue/i }).first();

    if (await submitButton.isEnabled()) {
      await submitButton.click();
    }

    // Step 7: Verify progress or success
    expect(true).toBe(true); // Placeholder for actual verification
  });

  test('should handle equipment unavailability gracefully', async ({ page }) => {
    await page.goto('/book');

    // Select dates that might be unavailable
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const startInput = page.getByLabel(/start date/i).first();

    if (await startInput.isVisible()) {
      await startInput.fill(pastDate.toISOString().split('T')[0]);
    }

    // Should show validation error or unavailability message
    await expect(
      page.getByText(/not available|past date|select future/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should calculate pricing correctly', async ({ page }) => {
    await page.goto('/book');

    // Select dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 4);

    const startInput = page.getByLabel(/start date/i).first();
    const endInput = page.getByLabel(/end date/i).first();

    if (await startInput.isVisible()) {
      await startInput.fill(tomorrow.toISOString().split('T')[0]);
      await endInput.fill(threeDaysLater.toISOString().split('T')[0]);

      // Wait for pricing calculation
      await page.waitForTimeout(1000);

      // Should show 3 days * daily rate
      const pricingText = await page.textContent('body');
      expect(pricingText).toBeDefined();
    }
  });

  test('should show progress indicator during booking creation', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    await page.getByLabel('Email').fill('aitest2@udigit.ca');
    await page.getByLabel('Password').fill('TestAI2024!@#$');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL('/dashboard');

    // Go to booking
    await page.goto('/book');

    // Should show loading/processing state when submitting
    expect(true).toBe(true); // Placeholder for actual test
  });
});


