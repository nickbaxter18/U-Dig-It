// Frontend performance monitoring
import { logger } from '@/lib/logger';

export class FrontendPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    pageLoad: 0,
    renderTime: 0,
    bundleSize: 0,
    errors: [],
    userInteractions: [],
  };

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor page load performance
    this.monitorPageLoad();

    // Monitor render performance
    this.monitorRenderPerformance();

    // Monitor bundle size
    this.monitorBundleSize();

    // Monitor errors
    this.monitorErrors();

    // Monitor user interactions
    this.monitorUserInteractions();
  }

  private monitorPageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;

        // Report to monitoring service
        this.reportMetric('page_load', this.metrics.pageLoad);
      });
    }
  }

  private monitorRenderPerformance() {
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.metrics.renderTime = entry.duration;
            this.reportMetric('render_time', entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  private monitorBundleSize() {
    // Monitor bundle size through performance API
    if (typeof window !== 'undefined') {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(
        resource => resource.name.includes('.js') && !resource.name.includes('node_modules')
      );

      const totalSize = jsResources.reduce((sum: any, resource: any) => {
        return sum + (resource as PerformanceResourceTiming).transferSize;
      }, 0);

      this.metrics.bundleSize = totalSize;
      this.reportMetric('bundle_size', totalSize);
    }
  }

  private monitorErrors() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        const error = {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now(),
        };

        this.metrics.errors.push(error);
        this.reportError(error);
      });

      window.addEventListener('unhandledrejection', event => {
        const error = {
          message: event.reason?.message || 'Unhandled Promise Rejection',
          timestamp: Date.now(),
        };

        this.metrics.errors.push(error);
        this.reportError(error);
      });
    }
  }

  private monitorUserInteractions() {
    if (typeof window !== 'undefined') {
      const interactionTypes = ['click', 'scroll', 'keydown', 'resize'];

      interactionTypes.forEach(type => {
        window.addEventListener(type, event => {
          const interaction = {
            type,
            timestamp: Date.now(),
            target: (event.target as Element)?.tagName || 'unknown',
          };

          this.metrics.userInteractions.push(interaction);
          this.reportMetric('user_interaction', interaction);
        });
      });
    }
  }

  private reportMetric(name: string, value: number | object) {
    // Send metrics to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          value,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      }).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to report metric:', {
            component: 'performance-monitor',
            action: 'warning',
          }, error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
  }

  private reportError(error: ErrorInfo) {
    // Send errors to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(err => {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to report error:', {
            component: 'performance-monitor',
            action: 'warning',
          }, err instanceof Error ? err : new Error(String(err)));
        }
      });
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  generateReport(): string {
    return `
Performance Report:
==================
Page Load Time: ${this.metrics.pageLoad}ms
Render Time: ${this.metrics.renderTime}ms
Bundle Size: ${this.metrics.bundleSize} bytes
Errors: ${this.metrics.errors.length}
User Interactions: ${this.metrics.userInteractions.length}
    `;
  }
}

interface PerformanceMetrics {
  pageLoad: number;
  renderTime: number;
  bundleSize: number;
  errors: ErrorInfo[];
  userInteractions: UserInteraction[];
}

interface ErrorInfo {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
}

interface UserInteraction {
  type: string;
  timestamp: number;
  target: string;
}

// Export singleton instance
export const performanceMonitor = new FrontendPerformanceMonitor();
