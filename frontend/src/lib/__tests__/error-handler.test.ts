import { describe, expect, it, vi } from 'vitest';
import { ErrorType, createErrorResponse, handleError } from '../error-handler';

describe('Error Handler', () => {
  describe('handleError', () => {
    it('should format validation errors', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      const result = handleError(error, ErrorType.VALIDATION);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toContain('Validation');
      expect(result.statusCode).toBe(400);
    });

    it('should format authentication errors', () => {
      const error = new Error('Not authenticated');

      const result = handleError(error, ErrorType.AUTHENTICATION);

      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.statusCode).toBe(401);
    });

    it('should format authorization errors', () => {
      const error = new Error('Forbidden');

      const result = handleError(error, ErrorType.AUTHORIZATION);

      expect(result.type).toBe(ErrorType.AUTHORIZATION);
      expect(result.statusCode).toBe(403);
    });

    it('should format not found errors', () => {
      const error = new Error('Resource not found');

      const result = handleError(error, ErrorType.NOT_FOUND);

      expect(result.type).toBe(ErrorType.NOT_FOUND);
      expect(result.statusCode).toBe(404);
    });

    it('should format rate limit errors', () => {
      const error = new Error('Too many requests');

      const result = handleError(error, ErrorType.RATE_LIMIT);

      expect(result.type).toBe(ErrorType.RATE_LIMIT);
      expect(result.statusCode).toBe(429);
    });

    it('should format server errors', () => {
      const error = new Error('Internal error');

      const result = handleError(error, ErrorType.SERVER);

      expect(result.type).toBe(ErrorType.SERVER);
      expect(result.statusCode).toBe(500);
    });

    it('should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      const result = handleError(error);

      expect(result.details).toBeDefined();
      expect(result.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Sensitive error');
      error.stack = 'Sensitive stack trace';

      const result = handleError(error);

      expect(result.message).not.toContain('Sensitive');
      expect(result.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log errors', () => {
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Test error');
      handleError(error);

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct status', () => {
      const response = createErrorResponse('Error message', 400);

      expect(response.status).toBe(400);
    });

    it('should include error message in body', async () => {
      const response = createErrorResponse('Validation failed', 400);
      const body = await response.json();

      expect(body.error).toBe('Validation failed');
    });

    it('should include error code if provided', async () => {
      const response = createErrorResponse('Error', 400, 'VALIDATION_ERROR');
      const body = await response.json();

      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should set correct content type', () => {
      const response = createErrorResponse('Error', 400);

      expect(response.headers.get('Content-Type')).toContain('application/json');
    });
  });

  describe('Error Types', () => {
    it('should support validation errors', () => {
      const result = handleError(new Error('Invalid input'), ErrorType.VALIDATION);
      expect(result.statusCode).toBe(400);
    });

    it('should support auth errors', () => {
      const result = handleError(new Error('Unauthorized'), ErrorType.AUTHENTICATION);
      expect(result.statusCode).toBe(401);
    });

    it('should support permission errors', () => {
      const result = handleError(new Error('Forbidden'), ErrorType.AUTHORIZATION);
      expect(result.statusCode).toBe(403);
    });

    it('should support not found errors', () => {
      const result = handleError(new Error('Not found'), ErrorType.NOT_FOUND);
      expect(result.statusCode).toBe(404);
    });

    it('should support conflict errors', () => {
      const result = handleError(new Error('Conflict'), ErrorType.CONFLICT);
      expect(result.statusCode).toBe(409);
    });

    it('should support rate limit errors', () => {
      const result = handleError(new Error('Rate limited'), ErrorType.RATE_LIMIT);
      expect(result.statusCode).toBe(429);
    });

    it('should default to 500 for unknown errors', () => {
      const result = handleError(new Error('Unknown error'));
      expect(result.statusCode).toBe(500);
    });
  });

  describe('Error Sanitization', () => {
    it('should sanitize sensitive information', () => {
      const error = new Error('Password abc123 is invalid');

      const result = handleError(error);

      expect(result.message).not.toContain('abc123');
    });

    it('should remove stack traces in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Error');
      const result = handleError(error);

      expect(result.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should preserve stack traces in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Error');
      const result = handleError(error);

      expect(result.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
