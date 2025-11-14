/**
 * TypeScript Fix Helper
 *
 * This module documents the correct logger signatures for the codebase.
 * Use this as a reference when fixing logger calls.
 *
 * @see frontend/src/lib/logger.ts for the LogContext interface
 */

import type { LogContext } from './logger';

/**
 * CORRECT Logger Signatures
 *
 * The logger accepts these signatures:
 * 1. logger.level(message: string, context?: LogContext)
 * 2. logger.level(message: string, context: LogContext, error?: Error)
 *
 * Note: Error must come LAST, not second!
 */

// ✅ CORRECT Examples:
export const correctExamples = {
  // Simple log with context
  example1: () => {
    // logger.info('User logged in', {
    //   component: 'auth',
    //   action: 'login',
    //   metadata: { userId: 'abc123' }
    // });
  },

  // Log with error
  example2: () => {
    // const error = new Error('Database connection failed');
    // logger.error('Database error', {
    //   component: 'database',
    //   action: 'connection_error',
    //   metadata: { host: 'localhost' }
    // }, error);
  },

  // Log without context (minimal)
  example3: () => {
    // logger.debug('Processing request');
  },
};

// ❌ WRONG Examples (what to fix):
export const wrongExamples = {
  // Wrong: Error as second parameter
  wrong1: () => {
    // ❌ logger.error('Error occurred', { component: 'x' }, error instanceof Error ? error : new Error(String(error)));
    // ✅ logger.error('Error occurred', { component: 'x' }, error);
  },

  // Wrong: Value as second parameter
  wrong2: () => {
    // ❌ logger.debug('User ID:', userId, { component: 'x' });
    // ✅ logger.debug('User ID', { component: 'x', metadata: { userId } });
  },

  // Wrong: Multiple values
  wrong3: () => {
    // ❌ logger.info('Values:', val1, val2, { component: 'x' });
    // ✅ logger.info('Values', { component: 'x', metadata: { val1, val2 } });
  },
};

/**
 * Search & Replace Patterns
 *
 * Use your IDE's regex search/replace:
 *
 * Pattern 1 - Error as second param:
 * Find:    logger\.(error|warn)\('([^']+)',\s*(\w+),\s*\{([^}]+)\}\)
 * Replace: logger.$1('$2', {$4, metadata: { error: $3 instanceof Error ? $3.message : String($3) }}, $3 instanceof Error ? $3 : undefined)
 *
 * Pattern 2 - Value as second param:
 * Find:    logger\.(debug|info)\('([^']+):',\s*(\w+),\s*\{([^}]+)\}\)
 * Replace: logger.$1('$2', {$4, metadata: { value: $3 }})
 *
 * Pattern 3 - Multiple params:
 * Needs manual review - too complex for regex
 */

/**
 * Files Most Affected (sorted by priority):
 *
 * High Priority (API routes):
 * - src/app/api/availability/route.ts
 * - src/app/api/bookings/route.ts
 * - src/app/api/payments/create-intent/route.ts
 * - src/app/api/admin/payments/refund/route.ts
 *
 * Medium Priority (Components):
 * - src/components/EnhancedBookingFlow.tsx
 * - src/components/admin/*.tsx
 *
 * Low Priority (Utilities):
 * - src/lib/*.ts
 */

export {};


