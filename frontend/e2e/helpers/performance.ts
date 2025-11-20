// Performance helpers for admin E2E tests
import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  networkRequests: number;
  totalTransferSize: number;
}

export class PerformanceHelper {
  constructor(private page: Page) {}

  /**
   * Measure page load performance
   */
  async measurePageLoad(url: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // Start performance monitoring
    const performancePromise = this.page.evaluate(() => {
      return new Promise<PerformanceMetrics>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const paintEntries = entries.filter(
            (e): e is PerformancePaintTiming => e.entryType === 'paint'
          );

          const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');
          const lcp = entries.find(
            (e): e is PerformanceEntry & { renderTime?: number; loadTime?: number } =>
              e.entryType === 'largest-contentful-paint'
          );

          resolve({
            firstContentfulPaint: fcp ? fcp.startTime : undefined,
            largestContentfulPaint: lcp ? lcp.renderTime || lcp.loadTime || 0 : undefined,
          } as PerformanceMetrics);
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve({} as PerformanceMetrics);
        }, 5000);
      });
    });

    // Navigate and wait
    const navigationPromise = this.page.goto(url, { waitUntil: 'networkidle' });
    await Promise.all([navigationPromise, performancePromise]);

    const loadTime = Date.now() - startTime;

    // Get DOM metrics
    const domMetrics = await this.page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        timeToInteractive: perfData.domInteractive - perfData.fetchStart,
      };
    });

    // Get network metrics
    const networkMetrics = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        networkRequests: resources.length,
        totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      };
    });

    return {
      loadTime,
      domContentLoaded: domMetrics.domContentLoaded,
      timeToInteractive: domMetrics.timeToInteractive,
      ...(await performancePromise),
      ...networkMetrics,
    };
  }

  /**
   * Assert performance meets targets
   */
  async assertPerformanceTargets(
    metrics: PerformanceMetrics,
    targets: {
      maxLoadTime?: number;
      maxDomContentLoaded?: number;
      maxFirstContentfulPaint?: number;
      maxLargestContentfulPaint?: number;
    } = {}
  ): Promise<void> {
    const defaults = {
      maxLoadTime: 3000,
      maxDomContentLoaded: 2000,
      maxFirstContentfulPaint: 2000,
      maxLargestContentfulPaint: 2500,
    };

    const limits = { ...defaults, ...targets };

    if (metrics.loadTime > limits.maxLoadTime!) {
      throw new Error(
        `Page load time ${metrics.loadTime}ms exceeds target ${limits.maxLoadTime}ms`
      );
    }

    if (metrics.domContentLoaded > limits.maxDomContentLoaded!) {
      throw new Error(
        `DOMContentLoaded ${metrics.domContentLoaded}ms exceeds target ${limits.maxDomContentLoaded}ms`
      );
    }

    if (
      metrics.firstContentfulPaint &&
      metrics.firstContentfulPaint > limits.maxFirstContentfulPaint!
    ) {
      throw new Error(
        `First Contentful Paint ${metrics.firstContentfulPaint}ms exceeds target ${limits.maxFirstContentfulPaint}ms`
      );
    }

    if (
      metrics.largestContentfulPaint &&
      metrics.largestContentfulPaint > limits.maxLargestContentfulPaint!
    ) {
      throw new Error(
        `Largest Contentful Paint ${metrics.largestContentfulPaint}ms exceeds target ${limits.maxLargestContentfulPaint}ms`
      );
    }
  }

  /**
   * Check for memory leaks (basic check)
   */
  async checkMemoryLeaks(): Promise<void> {
    const initialMemory = await this.page.evaluate(() => {
      return (
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0
      );
    });

    // Perform some actions
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');

    const afterReloadMemory = await this.page.evaluate(() => {
      return (
        (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0
      );
    });

    // Memory should not grow excessively (allow 50% growth for initial load)
    const memoryGrowth = afterReloadMemory - initialMemory;
    const maxAllowedGrowth = initialMemory * 0.5;

    if (memoryGrowth > maxAllowedGrowth && initialMemory > 0) {
      console.warn(
        `Potential memory leak detected: ${memoryGrowth} bytes growth (${((memoryGrowth / initialMemory) * 100).toFixed(2)}%)`
      );
    }
  }

  /**
   * Monitor API call performance
   */
  async monitorApiCalls(
    pattern: string | RegExp
  ): Promise<Array<{ url: string; duration: number; status: number }>> {
    const apiCalls: Array<{ url: string; duration: number; status: number }> = [];

    this.page.on('response', async (response) => {
      const url = response.url();
      const matches = typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);

      if (matches) {
        const _request = response.request();
        const timing = response.timing();
        const duration = timing ? timing.responseEnd - timing.requestStart : 0;

        apiCalls.push({
          url,
          duration,
          status: response.status(),
        });
      }
    });

    return apiCalls;
  }
}
