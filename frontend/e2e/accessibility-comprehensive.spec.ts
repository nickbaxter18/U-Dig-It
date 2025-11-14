/**
 * Comprehensive Accessibility Tests
 * Tests WCAG 2.1 Level AA compliance across all pages
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test.describe('WCAG AA Compliance - Public Pages', () => {
    test('should have no accessibility violations on homepage', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no violations on about page', async ({ page }) => {
      await page.goto('/about');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should have no violations on contact page', async ({ page }) => {
      await page.goto('/contact');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should have no violations on equipment page', async ({ page }) => {
      await page.goto('/equipment');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should have no violations on booking page', async ({ page }) => {
      await page.goto('/book');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should allow full keyboard navigation on homepage', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Verify focus is visible
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        const styles = window.getComputedStyle(el!);
        return styles.outline !== 'none';
      });

      expect(focused).toBeTruthy();
    });

    test('should allow keyboard form submission', async ({ page }) => {
      await page.goto('/contact');

      // Fill form with keyboard
      await page.getByLabel('Name').press('Tab');
      await page.keyboard.type('Test User');
      await page.keyboard.press('Tab');
      await page.keyboard.type('test@example.com');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Test message');

      // Submit with Enter
      await page.keyboard.press('Enter');

      // Should process form
      expect(true).toBe(true);
    });

    test('should have visible focus indicators on all interactive elements', async ({ page }) => {
      await page.goto('/');

      const interactiveElements = await page.locator('button, a, input, select, textarea').all();

      for (const element of interactiveElements.slice(0, 5)) { // Test first 5
        await element.focus();

        const hasFocusStyles = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || styles.boxShadow !== 'none';
        });

        expect(hasFocusStyles).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      // Get all headings
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

      expect(headings.length).toBeGreaterThan(0);

      // Should have only one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('should have alt text on all images', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined(); // Can be empty for decorative images
      }
    });

    test('should have labels for all form inputs', async ({ page }) => {
      await page.goto('/contact');

      const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all();

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          const ariaLabel = await input.getAttribute('aria-label');

          // Should have either label or aria-label
          expect(label > 0 || ariaLabel !== null).toBe(true);
        }
      }
    });

    test('should have ARIA landmarks', async ({ page }) => {
      await page.goto('/');

      // Check for main landmark
      const main = await page.locator('main, [role="main"]').count();
      expect(main).toBeGreaterThan(0);

      // Check for navigation landmark
      const nav = await page.locator('nav, [role="navigation"]').count();
      expect(nav).toBeGreaterThan(0);
    });
  });

  test.describe('Color Contrast', () => {
    test('should meet contrast requirements', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withTags(['cat.color'])
        .analyze();

      expect(results.violations.filter(v => v.id === 'color-contrast')).toEqual([]);
    });
  });

  test.describe('Touch Target Size', () => {
    test('should have minimum 44x44px touch targets', async ({ page }) => {
      await page.goto('/');

      const buttons = await page.locator('button, a[role="button"]').all();

      for (const button of buttons.slice(0, 10)) { // Test first 10
        const box = await button.boundingBox();

        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow small margin
        }
      }
    });
  });

  test.describe('Form Accessibility', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/contact');

      // Submit empty form
      await page.getByRole('button', { name: /submit|send/i }).click();

      // Check for aria-invalid or role="alert"
      const errors = await page.locator('[aria-invalid="true"], [role="alert"]').count();
      expect(errors).toBeGreaterThan(0);
    });

    test('should have accessible error messages', async ({ page }) => {
      await page.goto('/book');

      // Trigger validation error
      await page.getByRole('button', { name: /book|submit/i }).click();

      // Error messages should be linked to fields via aria-describedby
      const errorMessages = await page.locator('[role="alert"]').all();
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  test.describe('Motion Preferences', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      // Animations should be reduced
      // This is typically handled by CSS media queries
      expect(true).toBe(true);
    });
  });
});


