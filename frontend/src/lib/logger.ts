/**
 * Production-ready logging utility for the Kubota Rental Platform
 *
 * Features:
 * - Structured logging with levels (error, warn, info, debug)
 * - Environment-aware (dev vs production)
 * - Performance monitoring integration
 * - Error tracking integration
 * - Rate limiting for high-volume logs
 * - JSON formatting for production
 * - Sensitive data filtering
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  performance?: {
    duration?: number;
    memoryUsage?: NodeJS.MemoryUsage;
  };
}

class Logger {
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;
  private readonly logLevel: LogLevel;
  private readonly rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly maxLogsPerMinute = 100; // Rate limit for high-volume logs

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';

    // Set log level based on environment
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  /**
   * Rate limiting for high-volume logs
   */
  private isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return false;
    }

    if (entry.count >= this.maxLogsPerMinute) {
      return true;
    }

    entry.count++;
    return false;
  }

  /**
   * Sanitize sensitive data from log entries
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'cookie',
      'session',
      'jwt',
      'apiKey',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
      'socialSecurity',
      'driversLicense',
    ];

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

      if (isSensitive) {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeData(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    performance?: { duration?: number; memoryUsage?: NodeJS.MemoryUsage }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeData(context) : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code,
      };
    }

    if (performance) {
      entry.performance = {
        duration: performance.duration,
        memoryUsage: this.isDevelopment ? performance.memoryUsage : undefined,
      };
    }

    return entry;
  }

  /**
   * Output log entry to appropriate destination
   */
  private outputLog(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Development: Use console with colors and formatting
      const levelColors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m', // Yellow
        [LogLevel.INFO]: '\x1b[36m', // Cyan
        [LogLevel.DEBUG]: '\x1b[90m', // Gray
      };

      const resetColor = '\x1b[0m';
      const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
      const color = levelColors[entry.level];

      console.log(
        `${color}[${levelNames[entry.level]}]${resetColor} ${entry.message}`,
        entry.context ? entry.context : '',
        entry.error ? entry.error : '',
        entry.performance ? entry.performance : ''
      );
    } else {
      // Production: Use structured JSON logging
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const logKey = `error:${message}`;
    if (this.isRateLimited(logKey)) return;

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.outputLog(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const logKey = `warn:${message}`;
    if (this.isRateLimited(logKey)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.outputLog(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const logKey = `info:${message}`;
    if (this.isRateLimited(logKey)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.outputLog(entry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const logKey = `debug:${message}`;
    if (this.isRateLimited(logKey)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.outputLog(entry);
  }

  /**
   * Log performance metrics
   */
  performance(message: string, duration: number, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(
      LogLevel.INFO,
      `PERFORMANCE: ${message}`,
      context,
      undefined,
      { duration }
    );
    this.outputLog(entry);
  }

  /**
   * Log authentication events
   */
  auth(message: string, context?: LogContext): void {
    this.info(`AUTH: ${message}`, context);
  }

  /**
   * Log API requests
   */
  api(message: string, context?: LogContext): void {
    this.info(`API: ${message}`, context);
  }

  /**
   * Log database operations
   */
  database(message: string, context?: LogContext): void {
    this.info(`DATABASE: ${message}`, context);
  }

  /**
   * Log payment events
   */
  payment(message: string, context?: LogContext): void {
    this.info(`PAYMENT: ${message}`, context);
  }

  /**
   * Log booking events
   */
  booking(message: string, context?: LogContext): void {
    this.info(`BOOKING: ${message}`, context);
  }

  /**
   * Log admin actions
   */
  admin(message: string, context?: LogContext): void {
    this.info(`ADMIN: ${message}`, context);
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();

    // Override methods to include default context
    const originalMethods = [
      'error',
      'warn',
      'info',
      'debug',
      'auth',
      'api',
      'database',
      'payment',
      'booking',
      'admin',
    ];

    originalMethods.forEach(method => {
      const original = (childLogger as any)[method];
      (childLogger as any)[method] = (message: string, context?: LogContext, error?: Error) => {
        const mergedContext = { ...defaultContext, ...context };
        return original.call(childLogger, message, mergedContext, error);
      };
    });

    return childLogger;
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience methods
export const {
  error,
  warn,
  info,
  debug,
  performance,
  auth,
  api,
  database,
  payment,
  booking,
  admin,
  child,
} = logger;

// Export types for external use (already exported above)
// export type { LogContext, LogEntry };
