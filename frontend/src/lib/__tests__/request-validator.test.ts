import { describe, expect, it } from 'vitest';
import { REQUEST_LIMITS, validateRequest } from '../request-validator';

describe('Request Validator', () => {
  describe('Request Size Validation', () => {
    it('should accept requests within size limit', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: 'small payload' }),
      });

      const result = await validateRequest(request, {
        maxSize: REQUEST_LIMITS.MAX_JSON_SIZE,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject requests exceeding size limit', async () => {
      const largeData = 'x'.repeat(REQUEST_LIMITS.MAX_JSON_SIZE + 1000);
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: largeData }),
      });

      const result = await validateRequest(request, {
        maxSize: REQUEST_LIMITS.MAX_JSON_SIZE,
      });

      expect(result.valid).toBe(false);
      expect(result.error?.message).toMatch(/size|large/i);
    });
  });

  describe('Content Type Validation', () => {
    it('should accept allowed content types', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });

      const result = await validateRequest(request, {
        allowedContentTypes: ['application/json'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject disallowed content types', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'plain text',
      });

      const result = await validateRequest(request, {
        allowedContentTypes: ['application/json'],
      });

      expect(result.valid).toBe(false);
      expect(result.error?.message).toMatch(/content.*type/i);
    });

    it('should accept multipart/form-data', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['content']));

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await validateRequest(request, {
        allowedContentTypes: ['multipart/form-data'],
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Method Validation', () => {
    it('should accept allowed HTTP methods', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const result = await validateRequest(request, {
        allowedMethods: ['POST', 'PUT'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject disallowed HTTP methods', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'DELETE',
      });

      const result = await validateRequest(request, {
        allowedMethods: ['POST', 'PUT'],
      });

      expect(result.valid).toBe(false);
      expect(result.error?.message).toMatch(/method/i);
    });
  });

  describe('Required Headers', () => {
    it('should validate required headers are present', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'secret',
          'x-request-id': '123',
        },
      });

      const result = await validateRequest(request, {
        requiredHeaders: ['x-api-key', 'x-request-id'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject when required headers are missing', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'secret',
        },
      });

      const result = await validateRequest(request, {
        requiredHeaders: ['x-api-key', 'x-request-id'],
      });

      expect(result.valid).toBe(false);
      expect(result.error?.message).toMatch(/header|required/i);
    });
  });

  describe('Body Validation', () => {
    it('should require body when specified', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: 'value' }),
      });

      const result = await validateRequest(request, {
        requireBody: true,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject when body is required but missing', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      });

      const result = await validateRequest(request, {
        requireBody: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error?.message).toMatch(/body.*required/i);
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file uploads', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await validateRequest(request, {
        allowedContentTypes: ['multipart/form-data'],
        maxSize: REQUEST_LIMITS.MAX_FILE_SIZE,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit', async () => {
      const formData = new FormData();
      // Create 11MB file (over 10MB limit)
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const request = new Request('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await validateRequest(request, {
        maxSize: REQUEST_LIMITS.MAX_FILE_SIZE,
      });

      expect(result.valid).toBe(false);
      expect(result.error?.message).toMatch(/size|large/i);
    });
  });

  describe('Combined Validation', () => {
    it('should validate all rules together', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'secret',
        },
        body: JSON.stringify({ data: 'value' }),
      });

      const result = await validateRequest(request, {
        maxSize: REQUEST_LIMITS.MAX_JSON_SIZE,
        allowedContentTypes: ['application/json'],
        allowedMethods: ['POST'],
        requiredHeaders: ['x-api-key'],
        requireBody: true,
      });

      expect(result.valid).toBe(true);
    });

    it('should fail if any validation rule fails', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET', // Wrong method
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'secret',
        },
      });

      const result = await validateRequest(request, {
        allowedMethods: ['POST'],
        requiredHeaders: ['x-api-key'],
      });

      expect(result.valid).toBe(false);
    });
  });
});

