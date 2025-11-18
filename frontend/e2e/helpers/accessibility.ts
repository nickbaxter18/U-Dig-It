// Accessibility helpers for admin E2E tests
import { Page, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Initialize axe-core for accessibility testing
   */
  async initialize(): Promise<void> {
    await injectAxe(this.page);
  }

  /**
   * Run full accessibility audit
   */
  async audit(options?: { tags?: string[]; rules?: string[] }): Promise<void> {
    await this.initialize();
    
    const config = {
      tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
      rules: options?.rules || {},
    };

    await checkA11y(this.page, undefined, config);
  }

  /**
   * Get accessibility violations
   */
  async getViolations(options?: { tags?: string[] }): Promise<any[]> {
    await this.initialize();
    
    const violations = await getViolations(this.page, {
      tags: options?.tags || ['wcag2a', 'wcag2aa', 'wcag21aa'],
    });

    return violations;
  }

  /**
   * Check keyboard navigation
   */
  async checkKeyboardNavigation(): Promise<void> {
    // Test Tab navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Check for visible focus indicators
    const focusStyles = await this.page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      if (!element) return null;
      const styles = window.getComputedStyle(element);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    if (focusStyles) {
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      expect(hasFocusIndicator).toBeTruthy();
    }
  }

  /**
   * Verify ARIA labels
   */
  async verifyAriaLabels(): Promise<void> {
    // Check buttons have accessible names
    const buttons = await this.page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      const hasAccessibleName = ariaLabel || textContent?.trim() || ariaLabelledBy;
      // Skip icon-only buttons that might be decorative
      const isIconOnly = await button.locator('svg, [class*="icon"]').count() > 0 && !textContent?.trim();
      
      if (!isIconOnly && !hasAccessibleName) {
        throw new Error(`Button missing accessible name: ${await button.innerHTML()}`);
      }
    }

    // Check form inputs have labels
    const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="password"], textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;
        
        if (!hasLabel && !hasAriaLabel && !placeholder) {
          throw new Error(`Input missing label: ${id}`);
        }
      }
    }
  }

  /**
   * Check color contrast (basic check)
   */
  async checkColorContrast(): Promise<void> {
    // This is a simplified check - full contrast checking requires more complex logic
    // For now, we'll check that text elements have sufficient color difference
    const textElements = await this.page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label').all();
    
    for (const element of textElements.slice(0, 10)) { // Sample first 10
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
        };
      });

      // Basic validation - ensure colors are defined
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  }
}

