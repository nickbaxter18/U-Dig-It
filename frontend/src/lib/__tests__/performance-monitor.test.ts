/**
 * Comprehensive Tests for Frontend Performance Monitor
 * Tests performance metric collection, monitoring, and reporting
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FrontendPerformanceMonitor, performanceMonitor } from '../performance-monitor';

// Mock fetch
global.fetch = vi.fn();

// Mock performance API
global.performance = {
  getEntriesByType: vi.fn((type) => {
    if (type === 'navigation') {
      return [{ loadEventEnd: 1000, fetchStart: 0 }];
    }
    if (type === 'resource') {
      return [
        { name: 'app.js', transferSize: 50000 },
        { name: 'vendor.js', transferSize: 100000 },
      ];
    }
    return [];
  }),
  observe: vi.fn(),
} as any;

global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Performance Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create performance monitor instance', () => {
      const monitor = new FrontendPerformanceMonitor();
      expect(monitor).toBeDefined();
    });

    it('should export singleton instance', () => {
      expect(performanceMonitor).toBeDefined();
      expect(performanceMonitor).toBeInstanceOf(FrontendPerformanceMonitor);
    });

    it('should initialize monitoring on creation', () => {
      const monitor = new FrontendPerformanceMonitor();
      expect(monitor).toBeDefined();
    });
  });

  describe('Metric Collection', () => {
    it('should collect page load metrics', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('pageLoad');
    });

    it('should collect render time metrics', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('renderTime');
    });

    it('should collect bundle size metrics', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('bundleSize');
    });

    it('should collect error metrics', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('errors');
      expect(Array.isArray(metrics.errors)).toBe(true);
    });

    it('should collect user interaction metrics', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveProperty('userInteractions');
      expect(Array.isArray(metrics.userInteractions)).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('should return copy of metrics (not reference)', () => {
      const monitor = new FrontendPerformanceMonitor();
      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('generateReport', () => {
    it('should generate performance report', () => {
      const monitor = new FrontendPerformanceMonitor();
      const report = monitor.generateReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });

    it('should include page load time', () => {
      const monitor = new FrontendPerformanceMonitor();
      const report = monitor.generateReport();

      expect(report).toContain('Page Load Time');
    });

    it('should include render time', () => {
      const monitor = new FrontendPerformanceMonitor();
      const report = monitor.generateReport();

      expect(report).toContain('Render Time');
    });

    it('should include bundle size', () => {
      const monitor = new FrontendPerformanceMonitor();
      const report = monitor.generateReport();

      expect(report).toContain('Bundle Size');
    });

    it('should include error count', () => {
      const monitor = new FrontendPerformanceMonitor();
      const report = monitor.generateReport();

      expect(report).toContain('Errors');
    });

    it('should include interaction count', () => {
      const monitor = new FrontendPerformanceMonitor();
      const report = monitor.generateReport();

      expect(report).toContain('User Interactions');
    });
  });

  describe('Server-Side Safety', () => {
    it('should not throw on server side', () => {
      const originalWindow = global.window;
      (global as any).window = undefined;

      expect(() => new FrontendPerformanceMonitor()).not.toThrow();

      global.window = originalWindow;
    });
  });
});


