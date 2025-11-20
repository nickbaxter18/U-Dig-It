/**
 * Logger Test Suite
 * Tests structured logging, sensitive data filtering, and rate limiting
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LogLevel as _LogLevel, logger } from '../logger';

// Reserved for future log level testing

describe('Logger', () => {
  beforeEach(() => {
    // Clear console mocks
    vi.clearAllMocks();
  });

  describe('Log Levels', () => {
    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.error('Test error');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.warn('Test warning');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Test info');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log debug messages in development', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.debug('Test debug');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should redact password fields', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('User login', {
        metadata: { password: 'secret123' },
      });

      const loggedData = consoleSpy.mock.calls[0];
      expect(JSON.stringify(loggedData)).not.toContain('secret123');
      expect(JSON.stringify(loggedData)).toContain('[REDACTED]');
    });

    it('should redact token fields', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('Auth token', {
        metadata: { accessToken: 'abc123xyz' },
      });

      const loggedData = consoleSpy.mock.calls[0];
      expect(JSON.stringify(loggedData)).not.toContain('abc123xyz');
    });

    it('should redact API keys', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('API call', {
        metadata: { apiKey: 'sk_test_12345' },
      });

      const loggedData = consoleSpy.mock.calls[0];
      expect(JSON.stringify(loggedData)).not.toContain('sk_test_12345');
    });

    it('should not redact safe data', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.info('User info', {
        metadata: { email: 'test@example.com', userId: '123' },
      });

      const loggedData = consoleSpy.mock.calls[0];
      expect(JSON.stringify(loggedData)).toContain('test@example.com');
    });
  });

  describe('Contextual Logging', () => {
    it('should log auth events', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.auth('User logged in');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log API events', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.api('Request processed');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log payment events', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.payment('Payment processed');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log booking events', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.booking('Booking created');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.performance('API response', 250);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log errors with stack traces', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const error = new Error('Test error');
      logger.error('Error occurred', {}, error);

      const loggedData = consoleSpy.mock.calls[0];
      expect(JSON.stringify(loggedData)).toContain('Test error');
    });
  });
});
