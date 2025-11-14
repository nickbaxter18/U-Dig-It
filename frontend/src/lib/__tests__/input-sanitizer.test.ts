/**
 * Input Sanitizer Test Suite
 * Tests for XSS prevention, SQL injection blocking, and malicious input detection
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeTextInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeNumber,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizePostalCode,
  sanitizeAddress,
  sanitizeBookingID,
  sanitizeBookingFormData,
  sanitizeContactFormData,
  detectMaliciousInput,
} from '../input-sanitizer';

describe('Input Sanitizer', () => {
  describe('sanitizeTextInput', () => {
    it('should remove null bytes', () => {
      const input = 'Hello\x00World';
      expect(sanitizeTextInput(input)).toBe('HelloWorld');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x01\x02\x03World';
      expect(sanitizeTextInput(input)).toBe('HelloWorld');
    });

    it('should remove zero-width spaces', () => {
      const input = 'Hello\u200BWorld';
      expect(sanitizeTextInput(input)).toBe('HelloWorld');
    });

    it('should truncate long inputs', () => {
      const input = 'a'.repeat(2000);
      expect(sanitizeTextInput(input, 100)).toHaveLength(100);
    });

    it('should preserve valid text', () => {
      const input = 'Hello, World! This is valid text.';
      expect(sanitizeTextInput(input)).toBe(input);
    });

    it('should handle empty input', () => {
      expect(sanitizeTextInput('')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeEmail('test<>@example.com')).toBe('test@example.com');
    });

    it('should handle multiple @ symbols', () => {
      expect(sanitizeEmail('test@@example.com')).toBe('test@example.com');
    });

    it('should limit length to 254 characters', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(sanitizeEmail(longEmail)).toHaveLength(254);
    });

    it('should preserve valid emails', () => {
      const email = 'test+tag@example.co.uk';
      expect(sanitizeEmail(email)).toBe(email);
    });
  });

  describe('sanitizePhone', () => {
    it('should allow valid phone characters', () => {
      expect(sanitizePhone('(506) 123-4567')).toBe('(506) 123-4567');
    });

    it('should remove invalid characters', () => {
      expect(sanitizePhone('abc(506)def123')).toBe('(506)123');
    });

    it('should limit length', () => {
      const longPhone = '1'.repeat(50);
      expect(sanitizePhone(longPhone)).toHaveLength(20);
    });

    it('should handle international format', () => {
      expect(sanitizePhone('+1 506 123 4567')).toBe('+1 506 123 4567');
    });
  });

  describe('sanitizeURL', () => {
    it('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      expect(sanitizeURL(url)).toBe(url);
    });

    it('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com/path?query=value';
      expect(sanitizeURL(url)).toBe(url);
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeURL('javascript:alert("xss")')).toBe('');
    });

    it('should reject data: protocol', () => {
      expect(sanitizeURL('data:text/html,<script>alert("xss")</script>')).toBe('');
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('should sanitize valid numbers', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42')).toBe(42);
    });

    it('should return null for NaN', () => {
      expect(sanitizeNumber('not a number')).toBeNull();
    });

    it('should apply min constraint', () => {
      expect(sanitizeNumber(5, { min: 10 })).toBe(10);
    });

    it('should apply max constraint', () => {
      expect(sanitizeNumber(100, { max: 50 })).toBe(50);
    });

    it('should round to decimals', () => {
      expect(sanitizeNumber(3.14159, { decimals: 2 })).toBe(3.14);
    });

    it('should reject Infinity', () => {
      expect(sanitizeNumber(Infinity)).toBeNull();
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('file<>:|?*.txt')).toBe('file.txt');
    });

    it('should prevent reserved Windows names', () => {
      expect(sanitizeFilename('CON.txt')).toBe('_CON.txt');
      expect(sanitizeFilename('NUL.txt')).toBe('_NUL.txt');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      expect(sanitizeFilename(longName)).toHaveLength(255);
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFilename('contract-2024-11-03.pdf')).toBe('contract-2024-11-03.pdf');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove SQL keywords', () => {
      expect(sanitizeSearchQuery('SELECT * FROM users')).toBe('*  users');
    });

    it('should remove NoSQL operators', () => {
      expect(sanitizeSearchQuery('test $ne admin')).toBe('test  admin');
    });

    it('should remove script tags', () => {
      expect(sanitizeSearchQuery('test<script>alert(1)</script>')).toBe('test');
    });

    it('should limit length', () => {
      const longQuery = 'a'.repeat(1000);
      expect(sanitizeSearchQuery(longQuery)).toHaveLength(500);
    });

    it('should preserve valid search queries', () => {
      const query = 'kubota svl75 rental';
      expect(sanitizeSearchQuery(query)).toBe(query);
    });
  });

  describe('detectMaliciousInput', () => {
    it('should detect XSS - script tags', () => {
      const result = detectMaliciousInput('<script>alert("xss")</script>');
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('Script tag detected');
    });

    it('should detect XSS - event handlers', () => {
      const result = detectMaliciousInput('<img src=x onerror="alert(1)">');
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('Event handler attribute detected');
    });

    it('should detect XSS - javascript: protocol', () => {
      const result = detectMaliciousInput('<a href="javascript:alert(1)">click</a>');
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('JavaScript protocol detected');
    });

    it('should detect SQL injection - UNION SELECT', () => {
      const result = detectMaliciousInput("' UNION SELECT password FROM users--");
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('SQL injection pattern detected');
    });

    it('should detect SQL injection - boolean', () => {
      const result = detectMaliciousInput("' OR '1'='1");
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('SQL boolean injection detected');
    });

    it('should detect path traversal', () => {
      const result = detectMaliciousInput('../../etc/passwd');
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('Path traversal detected');
    });

    it('should detect NoSQL injection', () => {
      const result = detectMaliciousInput('{"$where": "this.password == \'secret\'"}');
      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBe('NoSQL operator detected');
    });

    it('should allow safe input', () => {
      const result = detectMaliciousInput('Please deliver the equipment by 9am tomorrow.');
      expect(result.isMalicious).toBe(false);
    });
  });

  describe('sanitizeBookingFormData', () => {
    it('should sanitize valid booking data', () => {
      const data = {
        equipmentId: '123e4567-e89b-12d3-a456-426614174000',
        startDate: '2025-11-05',
        endDate: '2025-11-10',
        deliveryAddress: '123 Main St',
        notes: 'Please call when arriving',
      };

      const result = sanitizeBookingFormData(data);
      expect(result.equipmentId).toBe(data.equipmentId);
      expect(result.startDate).toBe(data.startDate);
      expect(result.notes).toBe(data.notes);
    });

    it('should throw on malicious notes', () => {
      const data = {
        notes: '<script>alert("xss")</script>',
      };

      expect(() => sanitizeBookingFormData(data)).toThrow('Invalid booking data');
    });

    it('should sanitize SQL injection attempts', () => {
      const data = {
        notes: "'; DROP TABLE bookings;--",
      };

      expect(() => sanitizeBookingFormData(data)).toThrow('Invalid booking data');
    });

    it('should handle missing fields', () => {
      const data = {};
      const result = sanitizeBookingFormData(data);
      expect(result).toBeDefined();
    });

    it('should sanitize addresses properly', () => {
      const data = {
        deliveryAddress: '123 Main St <script>alert(1)</script>',
      };

      const result = sanitizeBookingFormData(data);
      expect(result.deliveryAddress).not.toContain('<script>');
    });
  });

  describe('sanitizeContactFormData', () => {
    it('should sanitize valid contact data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(506) 123-4567',
        subject: 'Booking inquiry',
        message: 'I would like to rent equipment',
      };

      const result = sanitizeContactFormData(data);
      expect(result.email).toBe(data.email);
      expect(result.phone).toBe(data.phone);
    });

    it('should throw on malicious message', () => {
      const data = {
        message: '<script>document.location="evil.com"</script>',
      };

      expect(() => sanitizeContactFormData(data)).toThrow('Invalid message');
    });

    it('should sanitize email addresses', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
      };

      const result = sanitizeContactFormData(data);
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('sanitizePostalCode', () => {
    it('should format Canadian postal codes', () => {
      expect(sanitizePostalCode('E2L4V5', 'CA')).toBe('E2L4V5');
      expect(sanitizePostalCode('e2l 4v5', 'CA')).toBe('E2L 4V5');
    });

    it('should remove invalid characters from postal codes', () => {
      expect(sanitizePostalCode('E2L-4V5', 'CA')).toBe('E2L4V5');
    });

    it('should limit Canadian postal code length', () => {
      expect(sanitizePostalCode('E2L4V5999', 'CA')).toHaveLength(7);
    });

    it('should format US ZIP codes', () => {
      expect(sanitizePostalCode('12345', 'US')).toBe('12345');
      expect(sanitizePostalCode('12345-6789', 'US')).toBe('12345-6789');
    });
  });

  describe('sanitizeAddress', () => {
    it('should allow valid address characters', () => {
      const address = '123 Main St, Apt 4B';
      expect(sanitizeAddress(address)).toBe(address);
    });

    it('should remove special characters', () => {
      expect(sanitizeAddress('123 Main<script>alert()</script>')).not.toContain('<script>');
    });

    it('should remove multiple spaces', () => {
      expect(sanitizeAddress('123    Main    St')).toBe('123 Main St');
    });

    it('should limit length', () => {
      const longAddress = 'a'.repeat(300);
      expect(sanitizeAddress(longAddress)).toHaveLength(200);
    });
  });

  describe('sanitizeBookingID', () => {
    it('should allow valid UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(sanitizeBookingID(uuid)).toBe(uuid);
    });

    it('should remove special characters', () => {
      expect(sanitizeBookingID('abc@#$123')).toBe('abc123');
    });

    it('should limit length', () => {
      const longId = 'a'.repeat(100);
      expect(sanitizeBookingID(longId)).toHaveLength(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined input', () => {
      expect(sanitizeTextInput(undefined as any)).toBe('');
      expect(sanitizeEmail(undefined as any)).toBe('');
      expect(sanitizePhone(undefined as any)).toBe('');
    });

    it('should handle null input', () => {
      expect(sanitizeTextInput(null as any)).toBe('');
      expect(sanitizeEmail(null as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeTextInput(123 as any)).toBe('');
      expect(sanitizeEmail([] as any)).toBe('');
    });

    it('should handle empty strings', () => {
      expect(sanitizeTextInput('')).toBe('');
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizePhone('')).toBe('');
    });
  });

  describe('Security - XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      'javascript:void(0)',
      'data:text/html,<script>alert(1)</script>',
      '<svg onload=alert(1)>',
      '<body onload=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      it(`should detect XSS: ${payload.substring(0, 30)}...`, () => {
        const result = detectMaliciousInput(payload);
        expect(result.isMalicious).toBe(true);
      });
    });
  });

  describe('Security - SQL Injection Prevention', () => {
    const sqlPayloads = [
      "' OR '1'='1",
      "' OR 1=1--",
      "'; DROP TABLE users;--",
      "' UNION SELECT password FROM users--",
      "admin'--",
      "' AND 1=0 UNION ALL SELECT 'admin', 'admin'--",
    ];

    sqlPayloads.forEach((payload) => {
      it(`should detect SQL injection: ${payload}`, () => {
        const result = detectMaliciousInput(payload);
        expect(result.isMalicious).toBe(true);
      });
    });
  });

  describe('Security - Path Traversal Prevention', () => {
    const pathPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      './../../config/database.yml',
    ];

    pathPayloads.forEach((payload) => {
      it(`should detect path traversal: ${payload}`, () => {
        const result = detectMaliciousInput(payload);
        expect(result.isMalicious).toBe(true);
      });
    });
  });

  describe('Security - NoSQL Injection Prevention', () => {
    const nosqlPayloads = [
      '{"$ne": null}',
      '{"$gt": ""}',
      '{"$where": "this.password"}',
      '{$ne: 1}',
    ];

    nosqlPayloads.forEach((payload) => {
      it(`should detect NoSQL injection: ${payload}`, () => {
        const result = detectMaliciousInput(payload);
        expect(result.isMalicious).toBe(true);
      });
    });
  });
});













