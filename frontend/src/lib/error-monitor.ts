// import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  component?: string;
  action?: string;
  state?: unknown;
  timestamp: string;
}

export class ErrorMonitor {
  static setup() {
    if (process.env.NODE_ENV === 'production') {
      // Sentry.init({
      //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      //   tracesSampleRate: 1.0,
      //   environment: process.env.NODE_ENV,
      //   attachStacktrace: true,
      //   beforeSend: (event: any, hint: any) => {
      //     // Sanitize sensitive data
      //     if (event.extra) {
      //       delete event.extra.password;
      //       delete event.extra.token;
      //       delete event.extra.creditCard;
      //     }
      //     return event;
      //   },
      // });
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Sentry disabled for development', {
          component: 'error-monitor',
          action: 'debug',
        });
      }
    }

    // Global error handlers
    this.setupGlobalErrorHandlers();
  }

  private static setupGlobalErrorHandlers() {
    window.addEventListener('error', event => {
      this.captureError(event.error, {
        component: 'GlobalErrorHandler',
        action: 'window.error',
        timestamp: new Date().toISOString(),
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.captureError(event.reason, {
        component: 'GlobalErrorHandler',
        action: 'unhandledrejection',
        timestamp: new Date().toISOString(),
      });
    });
  }

  static captureError(error: Error, context: Partial<ErrorContext> = {}) {
    const fullContext: ErrorContext = {
      correlationId: this.getCurrentCorrelationId(),
      userId: this.getCurrentUserId(),
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (process.env.NODE_ENV !== 'production') {
      logger.error('Error captured:', {
        component: 'error-monitor',
        action: 'error',
        metadata: fullContext,
      }, error instanceof Error ? error : new Error(String(error)));
    }

    if (process.env.NODE_ENV === 'production') {
      // Sentry.withScope((scope: any) => {
      //   scope.setTag('component', context.component || 'Unknown');
      //   scope.setTag('action', context.action || 'Unknown');
      //   if (context.correlationId) {
      //     scope.setTag('correlationId', context.correlationId);
      //   }
      //   if (context.userId) {
      //     scope.setUser({ id: context.userId });
      //   }
      //   if (context.state) {
      //     scope.setContext('state', this.sanitizeState(context.state));
      //   }
      //   Sentry.captureException(error);
      // });
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Sentry disabled - error logged to console', {
          component: 'error-monitor',
          action: 'debug',
        });
      }
    }
  }

  static captureStateSnapshot(state: unknown, component: string) {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`State snapshot for ${component}:`, {
          component: 'error-monitor',
          action: 'debug',
          metadata: this.sanitizeState(state) as Record<string, any> | undefined,
        });
      }
    }

    if (process.env.NODE_ENV === 'production') {
      // Sentry.withScope((scope: any) => {
      //   scope.setTag('component', component);
      //   scope.setContext('stateSnapshot', this.sanitizeState(state));
      //   scope.addBreadcrumb({
      //     category: 'state',
      //     message: `State snapshot captured for ${component}`,
      //     level: 'info',
      //   });
      // });
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`State snapshot captured (Sentry disabled): ${component}`, {
          component: 'error-monitor',
          action: 'debug',
        });
      }
    }
  }

  private static sanitizeState(state: unknown): unknown {
    if (!state) return state;

    const sensitiveKeys = ['password', 'token', 'creditCard', 'ssn', 'secret'];
    const sanitized = { ...state };

    const sanitizeObject = (obj: unknown) => {
      for (const key in obj as any) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          (obj as any)[key] = '[REDACTED]';
        } else if (typeof (obj as any)[key] === 'object' && (obj as any)[key] !== null) {
          sanitizeObject((obj as any)[key]);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  private static getCurrentCorrelationId(): string | undefined {
    // Try to get correlation ID from current request context
    if (typeof window !== 'undefined') {
      return (window as any).__CORRELATION_ID__;
    }
    return undefined;
  }

  private static getCurrentUserId(): string | undefined {
    // Try to get user ID from current user context
    if (typeof window !== 'undefined') {
      return (window as any).__USER_ID__;
    }
    return undefined;
  }
}
