/**
 * Input Sanitization Utilities
 * Comprehensive input validation and sanitization to prevent XSS, injection attacks, and malicious inputs
 */
import { logger } from '@/lib/logger';

/**
 * Sanitize text input by removing potentially dangerous characters
 * Prevents XSS while preserving legitimate text content
 */
export function sanitizeTextInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove potentially dangerous Unicode characters
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  sanitized = sanitized.replace(/[\u202A-\u202E]/g, ''); // Text direction overrides

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    logger.warn('Input truncated due to length', {
      component: 'input-sanitizer',
      action: 'truncate',
      metadata: { originalLength: input.length, maxLength },
    });
  }

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();

  // Remove any characters that aren't valid in emails
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');

  // Prevent multiple @ symbols
  const parts = sanitized.split('@');
  if (parts.length > 2) {
    sanitized = parts[0] + '@' + parts.slice(1).join('');
  }

  // Max length 254 per RFC 5321
  if (sanitized.length > 254) {
    sanitized = sanitized.substring(0, 254);
  }

  return sanitized;
}

/**
 * Sanitize phone number input
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';

  // Remove all characters except digits, spaces, hyphens, parentheses, and plus
  let sanitized = phone.replace(/[^\d\s\-()+ ]/g, '');

  // Limit to reasonable length
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20);
  }

  return sanitized.trim();
}

/**
 * Sanitize URL input
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return '';

  try {
    // Parse URL to validate structure
    const parsedURL = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      logger.warn('Invalid URL protocol rejected', {
        component: 'input-sanitizer',
        action: 'url_validation',
        metadata: { protocol: parsedURL.protocol },
      });
      return '';
    }

    return parsedURL.href;
  } catch {
    logger.warn('Invalid URL format rejected', {
      component: 'input-sanitizer',
      action: 'url_validation',
    });
    return '';
  }
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(
  value: string | number,
  options: {
    min?: number;
    max?: number;
    decimals?: number;
  } = {}
): number | null {
  const num = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  let sanitized = num;

  // Apply min/max constraints
  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }
  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }

  // Round to specified decimal places
  if (options.decimals !== undefined) {
    sanitized =
      Math.round(sanitized * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals);
  }

  return sanitized;
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';

  // Remove path separators and null bytes
  let sanitized = filename.replace(/[/\\:\0]/g, '');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>"|?*]/g, '');

  // Prevent reserved Windows filenames
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'LPT1',
    'LPT2',
    'LPT3',
  ];
  const namePart = sanitized.split('.')[0].toUpperCase();
  if (reservedNames.includes(namePart)) {
    sanitized = '_' + sanitized;
  }

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * Sanitize SQL input by escaping dangerous characters
 * NOTE: This is a fallback. Always use parameterized queries!
 */
export function sanitizeSQLInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Replace single quotes with two single quotes (SQL escape)
  let sanitized = input.replace(/'/g, "''");

  // Remove SQL comment markers
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');

  // Remove semicolons (prevents multi-statement injection)
  sanitized = sanitized.replace(/;/g, '');

  logger.debug('SQL input sanitized', {
    component: 'input-sanitizer',
    action: 'sql_sanitize',
    metadata: {
      originalLength: input.length,
      sanitizedLength: sanitized.length,
    },
  });

  return sanitized;
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (dangerousKeys.includes(key)) {
      logger.warn('Dangerous object key rejected', {
        component: 'input-sanitizer',
        action: 'object_key_validation',
        metadata: { key },
      });
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Sanitize JSON input
 */
export function sanitizeJSON(jsonString: string, maxDepth: number = 10): unknown | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Check for prototype pollution attempts
    const sanitized = sanitizeObjectKeys(parsed as Record<string, unknown>);

    // Check depth to prevent stack overflow
    const depth = getObjectDepth(sanitized);
    if (depth > maxDepth) {
      logger.warn('JSON depth exceeds maximum', {
        component: 'input-sanitizer',
        action: 'json_validation',
        metadata: { depth, maxDepth },
      });
      return null;
    }

    return sanitized;
  } catch (error) {
    logger.error('Invalid JSON rejected', {
      component: 'input-sanitizer',
      action: 'json_parse_error',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    return null;
  }
}

/**
 * Get object depth to prevent deeply nested objects
 */
function getObjectDepth(obj: unknown, currentDepth: number = 0): number {
  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }

  if (Array.isArray(obj)) {
    return Math.max(currentDepth, ...obj.map((item) => getObjectDepth(item, currentDepth + 1)));
  }

  const depths = Object.values(obj).map((value) => getObjectDepth(value, currentDepth + 1));
  return depths.length > 0 ? Math.max(...depths) : currentDepth;
}

/**
 * Sanitize search query to prevent SQL/NoSQL injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';

  // Remove special SQL/NoSQL operators
  let sanitized = query.trim();

  // Remove SQL injection attempts
  sanitized = sanitized.replace(
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|WHERE)\b)/gi,
    ''
  );

  // Remove NoSQL injection attempts
  sanitized = sanitized.replace(/[${}]/g, '');

  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
}

/**
 * Validate and sanitize postal code
 */
export function sanitizePostalCode(postalCode: string, country: string = 'CA'): string {
  if (!postalCode || typeof postalCode !== 'string') return '';

  let sanitized = postalCode.toUpperCase().trim();

  if (country === 'CA') {
    // Canadian postal code: A1A 1A1
    sanitized = sanitized.replace(/[^A-Z0-9\s]/g, '');
    sanitized = sanitized.substring(0, 7); // Max 7 chars (A1A 1A1)
  } else if (country === 'US') {
    // US ZIP code: 12345 or 12345-6789
    sanitized = sanitized.replace(/[^0-9-]/g, '');
    sanitized = sanitized.substring(0, 10); // Max 10 chars
  }

  return sanitized;
}

/**
 * Sanitize credit card number (remove non-digits, validate length)
 */
export function sanitizeCreditCard(cardNumber: string): string {
  if (!cardNumber || typeof cardNumber !== 'string') return '';

  // Remove all non-digits
  let sanitized = cardNumber.replace(/\D/g, '');

  // Limit to 19 digits (max for any card type)
  sanitized = sanitized.substring(0, 19);

  return sanitized;
}

/**
 * Sanitize address input
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') return '';

  // Allow letters, numbers, spaces, and common address punctuation
  let sanitized = address.replace(/[^a-zA-Z0-9\s,.-]/g, '');

  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 200);

  return sanitized;
}

/**
 * Sanitize booking ID to alphanumeric only
 */
export function sanitizeBookingID(id: string): string {
  if (!id || typeof id !== 'string') return '';

  // Allow only alphanumeric, hyphens, and underscores (typical UUID/booking ID pattern)
  let sanitized = id.replace(/[^a-zA-Z0-9\-_]/g, '');

  // Limit length
  sanitized = sanitized.substring(0, 50);

  return sanitized;
}

/**
 * Comprehensive form data sanitization
 */
export function sanitizeFormData(formData: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(formData)) {
    // Sanitize the key first
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');

    // Sanitize the value based on type
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeTextInput(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value);
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (value === null || value === undefined) {
      sanitized[sanitizedKey] = value;
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[sanitizedKey] = sanitizeFormData(value as Record<string, unknown>);
    }
  }

  return sanitized;
}

/**
 * Detect potentially malicious input patterns
 */
export function detectMaliciousInput(input: string): {
  isMalicious: boolean;
  reason?: string;
} {
  if (!input || typeof input !== 'string') return { isMalicious: false };

  const maliciousPatterns = [
    // XSS patterns
    { pattern: /<script[^>]*>.*?<\/script>/gi, reason: 'Script tag detected' },
    { pattern: /on\w+\s*=\s*["']?[^"']*["']?/gi, reason: 'Event handler attribute detected' },
    { pattern: /javascript:/gi, reason: 'JavaScript protocol detected' },
    { pattern: /data:text\/html/gi, reason: 'Data URI HTML detected' },

    // SQL Injection patterns
    {
      pattern: /(\bUNION\b.*\bSELECT\b|\bDROP\b.*\bTABLE\b)/gi,
      reason: 'SQL injection pattern detected',
    },
    {
      pattern: /('|")\s*(OR|AND)\s*('|"|\d+)\s*=\s*('|"|\d+)/gi,
      reason: 'SQL boolean injection detected',
    },

    // Command Injection patterns
    { pattern: /[;&|`$()]/g, reason: 'Shell metacharacters detected' },

    // Path Traversal patterns
    { pattern: /\.\.[/\\]/g, reason: 'Path traversal detected' },

    // LDAP Injection patterns
    { pattern: /[*()\\]/g, reason: 'LDAP special characters detected' },

    // NoSQL Injection patterns
    { pattern: /\$where|\$ne|\$gt|\$lt/gi, reason: 'NoSQL operator detected' },
  ];

  for (const { pattern, reason } of maliciousPatterns) {
    if (pattern.test(input)) {
      logger.warn('Malicious input detected', {
        component: 'input-sanitizer',
        action: 'malicious_input_detected',
        metadata: { reason, inputPreview: input.substring(0, 50) + '...' },
      });
      return { isMalicious: true, reason };
    }
  }

  return { isMalicious: false };
}

/**
 * Validate and sanitize booking form data
 */
export function sanitizeBookingFormData(data: {
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  notes?: string;
}) {
  const sanitized = {
    equipmentId: data.equipmentId ? sanitizeBookingID(data.equipmentId) : undefined,
    startDate: data.startDate ? sanitizeTextInput(data.startDate, 50) : undefined,
    endDate: data.endDate ? sanitizeTextInput(data.endDate, 50) : undefined,
    deliveryAddress: data.deliveryAddress ? sanitizeAddress(data.deliveryAddress) : undefined,
    deliveryCity: data.deliveryCity ? sanitizeTextInput(data.deliveryCity, 100) : undefined,
    deliveryProvince: data.deliveryProvince
      ? sanitizeTextInput(data.deliveryProvince, 50)
      : undefined,
    deliveryPostalCode: data.deliveryPostalCode
      ? sanitizePostalCode(data.deliveryPostalCode)
      : undefined,
    notes: data.notes ? sanitizeTextInput(data.notes, 2000) : undefined,
  };

  // Check for malicious patterns in notes
  if (sanitized.notes) {
    const maliciousCheck = detectMaliciousInput(sanitized.notes);
    if (maliciousCheck.isMalicious) {
      logger.error('Malicious content in booking notes', {
        component: 'input-sanitizer',
        action: 'booking_validation_failed',
        metadata: { reason: maliciousCheck.reason },
      });
      throw new Error('Invalid booking data: suspicious content detected');
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize contact form data
 */
export function sanitizeContactFormData(data: {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}) {
  const sanitized = {
    name: data.name ? sanitizeTextInput(data.name, 100) : undefined,
    email: data.email ? sanitizeEmail(data.email) : undefined,
    phone: data.phone ? sanitizePhone(data.phone) : undefined,
    subject: data.subject ? sanitizeTextInput(data.subject, 200) : undefined,
    message: data.message ? sanitizeTextInput(data.message, 5000) : undefined,
  };

  // Check for malicious patterns in message
  if (sanitized.message) {
    const maliciousCheck = detectMaliciousInput(sanitized.message);
    if (maliciousCheck.isMalicious) {
      logger.error('Malicious content in contact message', {
        component: 'input-sanitizer',
        action: 'contact_validation_failed',
        metadata: { reason: maliciousCheck.reason },
      });
      throw new Error('Invalid message: suspicious content detected');
    }
  }

  return sanitized;
}

/**
 * Sanitize user profile data
 */
export function sanitizeUserProfileData(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}) {
  return {
    firstName: data.firstName ? sanitizeTextInput(data.firstName, 50) : undefined,
    lastName: data.lastName ? sanitizeTextInput(data.lastName, 50) : undefined,
    phone: data.phone ? sanitizePhone(data.phone) : undefined,
    company: data.company ? sanitizeTextInput(data.company, 100) : undefined,
    address: data.address ? sanitizeAddress(data.address) : undefined,
    city: data.city ? sanitizeTextInput(data.city, 100) : undefined,
    province: data.province ? sanitizeTextInput(data.province, 50) : undefined,
    postalCode: data.postalCode ? sanitizePostalCode(data.postalCode) : undefined,
  };
}

/**
 * Content Security Policy (CSP) nonce generator
 */
export function generateCSPNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older environments
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate Content-Type header to prevent MIME type attacks
 */
export function validateContentType(contentType: string, allowed: string[]): boolean {
  if (!contentType) return false;

  const normalizedType = contentType.toLowerCase().split(';')[0].trim();

  return allowed.some((type) => normalizedType === type.toLowerCase());
}

/**
 * Rate limit key sanitization (for IP addresses and user IDs)
 */
export function sanitizeRateLimitKey(key: string): string {
  if (!key || typeof key !== 'string') return 'anonymous';

  // Allow only alphanumeric, dots, colons, and hyphens (for IPs and UUIDs)
  let sanitized = key.replace(/[^a-zA-Z0-9.:-]/g, '');

  // Limit length
  sanitized = sanitized.substring(0, 100);

  return sanitized || 'anonymous';
}
