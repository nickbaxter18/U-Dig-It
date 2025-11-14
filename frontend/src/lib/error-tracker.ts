// Enhanced error tracking and monitoring
import { logger } from '@/lib/logger';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  component?: string;
  action?: string;
}

class ErrorTracker {
  private errors: Array<Error & { context: ErrorContext }> = [];
  private maxErrors = 100;

  track(error: Error, context: ErrorContext = {}) {
    const errorWithContext = {
      ...error,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      },
    };

    this.errors.push(errorWithContext);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error tracked:', {
          component: 'error-tracker',
          action: 'error',
          metadata: errorWithContext,
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorWithContext);
    }
  }

  private async sendToExternalService(error: Error & { context: ErrorContext }) {
    try {
      // In a real application, you would send this to your error tracking service
      // like Sentry, LogRocket, or Bugsnag
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Sending error to external service:', {
          component: 'error-tracker',
          action: 'debug',
          metadata: { error },
        });
      }

      // Example: Send to your backend API
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to send error to external service:', {
          component: 'error-tracker',
          action: 'error',
        }, err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(
      error => new Date(error.context.timestamp || 0) > last24Hours
    );

    return {
      total: this.errors.length,
      last24Hours: recentErrors.length,
      byComponent: this.groupByComponent(),
      byType: this.groupByType(),
    };
  }

  private groupByComponent() {
    const groups: Record<string, number> = {};
    this.errors.forEach(error => {
      const component = error.context.component || 'unknown';
      groups[component] = (groups[component] || 0) + 1;
    });
    return groups;
  }

  private groupByType() {
    const groups: Record<string, number> = {};
    this.errors.forEach(error => {
      const type = error.name || 'Error';
      groups[type] = (groups[type] || 0) + 1;
    });
    return groups;
  }
}

export const errorTracker = new ErrorTracker();

// React error boundary integration
export const trackError = (error: Error, context: ErrorContext = {}) => {
  errorTracker.track(error, context);
};

// Utility function for async operations
export const withErrorTracking = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    trackError(error as Error, context);
    return null;
  }
};

// Hook for tracking component errors
export const useErrorTracking = (componentName: string) => {
  const trackComponentError = (error: Error, action?: string) => {
    trackError(error, {
      component: componentName,
      action,
    });
  };

  return { trackComponentError };
};
