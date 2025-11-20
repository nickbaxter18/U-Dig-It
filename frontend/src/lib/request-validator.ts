/**
 * Request/Response Size and Timeout Validation
 * Prevents resource exhaustion attacks and ensures API responsiveness
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

// Configuration constants
export const REQUEST_LIMITS = {
  // Maximum request body sizes (in bytes)
  MAX_JSON_SIZE: 1 * 1024 * 1024, // 1MB for JSON requests
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB for file uploads
  MAX_MULTIPART_SIZE: 20 * 1024 * 1024, // 20MB for multipart forms

  // Maximum response sizes
  MAX_RESPONSE_SIZE: 5 * 1024 * 1024, // 5MB for responses

  // Timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 30000, // 30 seconds default
  FILE_UPLOAD_TIMEOUT: 120000, // 2 minutes for file uploads
  LONG_RUNNING_TIMEOUT: 300000, // 5 minutes for long operations

  // Rate limits
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
};

/**
 * Validate request body size
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSize: number = REQUEST_LIMITS.MAX_JSON_SIZE
): Promise<{ valid: boolean; error?: string; size?: number }> {
  try {
    // Get content-length header
    const contentLength = request.headers.get('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);

      if (size > maxSize) {
        logger.warn('Request body size exceeds limit', {
          component: 'request-validator',
          action: 'size_validation_failed',
          metadata: {
            size,
            maxSize,
            path:
              (request as { nextUrl?: { pathname?: string }; url?: string } | null)?.nextUrl
                ?.pathname || request.url,
          },
        });

        return {
          valid: false,
          error: `Request body too large. Maximum size is ${formatBytes(maxSize)}`,
          size,
        };
      }

      return { valid: true, size };
    }

    // If no content-length header, check the actual body size
    const body = await request.text();
    const size = new TextEncoder().encode(body).length;

    if (size > maxSize) {
      logger.warn('Request body size exceeds limit (no content-length)', {
        component: 'request-validator',
        action: 'size_validation_failed',
        metadata: {
          size,
          maxSize,
          path: request.nextUrl.pathname,
        },
      });

      return {
        valid: false,
        error: `Request body too large. Maximum size is ${formatBytes(maxSize)}`,
        size,
      };
    }

    return { valid: true, size };
  } catch (error) {
    logger.error('Request size validation error', {
      component: 'request-validator',
      action: 'validation_error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      valid: false,
      error: 'Failed to validate request size',
    };
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Middleware to validate request size
 */
export async function withRequestSizeLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  maxSize: number = REQUEST_LIMITS.MAX_JSON_SIZE
): Promise<NextResponse> {
  const validation = await validateRequestSize(request, maxSize);

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error,
        code: 'REQUEST_TOO_LARGE',
      },
      {
        status: 413, // Payload Too Large
        headers: {
          'Retry-After': '60', // Suggest retry after 1 minute
        },
      }
    );
  }

  return handler(request);
}

/**
 * Validate content type
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): { valid: boolean; error?: string; contentType?: string } {
  const contentType = request.headers.get('content-type');

  if (!contentType) {
    return {
      valid: false,
      error: 'Content-Type header is required',
    };
  }

  const normalizedType = contentType.toLowerCase().split(';')[0].trim();
  const isAllowed = allowedTypes.some(
    (type) =>
      normalizedType === type.toLowerCase() || normalizedType.startsWith(type.toLowerCase() + '/')
  );

  if (!isAllowed) {
    logger.warn('Invalid content type rejected', {
      component: 'request-validator',
      action: 'content_type_validation_failed',
      metadata: {
        contentType: normalizedType,
        allowedTypes,
        path: (request as any).nextUrl?.pathname || request.url,
      },
    });

    return {
      valid: false,
      error: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      contentType: normalizedType,
    };
  }

  return { valid: true, contentType: normalizedType };
}

/**
 * Create timeout promise
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Wrap handler with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = REQUEST_LIMITS.DEFAULT_TIMEOUT,
  context?: string
): Promise<T> {
  try {
    return await Promise.race([promise, createTimeout(timeoutMs)]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      logger.error(
        'Request timeout',
        {
          component: 'request-validator',
          action: 'timeout',
          metadata: {
            timeoutMs,
            context,
          },
        },
        error
      );
    }
    throw error;
  }
}

/**
 * Validate response size
 */
export function validateResponseSize(
  data: unknown,
  maxSize: number = REQUEST_LIMITS.MAX_RESPONSE_SIZE
): { valid: boolean; error?: string; size?: number } {
  try {
    const json = JSON.stringify(data);
    const size = new TextEncoder().encode(json).length;

    if (size > maxSize) {
      logger.warn('Response size exceeds limit', {
        component: 'request-validator',
        action: 'response_size_exceeded',
        metadata: {
          size,
          maxSize,
        },
      });

      return {
        valid: false,
        error: `Response too large. Maximum size is ${formatBytes(maxSize)}`,
        size,
      };
    }

    return { valid: true, size };
  } catch (error) {
    logger.error('Response size validation error', {
      component: 'request-validator',
      action: 'response_validation_error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      valid: false,
      error: 'Failed to validate response size',
    };
  }
}

/**
 * Create safe API response with size validation
 */
export function createSafeResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const validation = validateResponseSize(data);

  if (!validation.valid) {
    // If response is too large, return error
    return NextResponse.json(
      {
        success: false,
        error: 'Response data too large',
        code: 'RESPONSE_TOO_LARGE',
      },
      {
        status: 507, // Insufficient Storage
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    );
  }

  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Length': validation.size?.toString() || '0',
      ...headers,
    },
  });
}

/**
 * Comprehensive request validation middleware
 */
export async function validateRequest(
  request: NextRequest,
  options: {
    maxSize?: number;
    allowedContentTypes?: string[];
    timeout?: number;
  } = {}
): Promise<{ valid: boolean; error?: NextResponse }> {
  const {
    maxSize = REQUEST_LIMITS.MAX_JSON_SIZE,
    allowedContentTypes = ['application/json'],
    timeout: _timeout = REQUEST_LIMITS.DEFAULT_TIMEOUT, // Reserved for future timeout implementation
  } = options;

  // Validate content type
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentTypeValidation = validateContentType(request, allowedContentTypes);
    if (!contentTypeValidation.valid) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            success: false,
            error: contentTypeValidation.error,
            code: 'INVALID_CONTENT_TYPE',
          },
          { status: 415 } // Unsupported Media Type
        ),
      };
    }
  }

  // Validate request size
  const sizeValidation = await validateRequestSize(request, maxSize);
  if (!sizeValidation.valid) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: sizeValidation.error,
          code: 'REQUEST_TOO_LARGE',
        },
        { status: 413 } // Payload Too Large
      ),
    };
  }

  logger.debug('Request validation passed', {
    component: 'request-validator',
    action: 'validation_passed',
    metadata: {
      method: request.method,
      path: (request as any).nextUrl?.pathname || request.url,
      size: sizeValidation.size,
    },
  });

  return { valid: true };
}
