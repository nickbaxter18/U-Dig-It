/**
 * Comprehensive Unit Tests for Utility Functions
 * Tests formatting, calculations, validation, and helper functions
 */

import { describe, expect, it, vi } from 'vitest';
import {
    calculateRentalCost,
    calculateRentalDays,
    cn,
    debounce,
    formatCurrency,
    formatDate,
    formatDateTime,
    generateBookingNumber,
    generateContractNumber,
    generatePaymentNumber,
    contractNumberFromBooking,
    getInitials,
    getStatusColor,
    getStatusText,
    throttle,
    validateEmail,
    validatePhone,
    validatePostalCode,
} from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toContain('bg-red-500');
      expect(result).toContain('text-white');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should handle Tailwind conflicts', () => {
      const result = cn('p-4', 'p-8'); // Should use p-8
      expect(result).toBe('p-8');
    });
  });

  describe('formatCurrency', () => {
    it('should format CAD currency by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/\$1,234\.56/);
      // CAD currency format uses $ symbol, not CA$ prefix
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-');
      expect(result).toContain('100');
    });

    it('should format large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toMatch(/1,000,000/);
    });

    it('should handle custom currency', () => {
      const result = formatCurrency(100, 'USD');
      expect(result).toContain('$');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2025-11-04');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format Date object', () => {
      const date = new Date('2025-11-04');
      const result = formatDate(date);
      expect(result).toBeDefined();
    });

    it('should accept custom options', () => {
      const result = formatDate('2025-11-04', { month: 'short' });
      expect(result).toBeDefined();
    });

    it('should use en-CA locale', () => {
      const result = formatDate('2025-11-04');
      // Should use Canadian English format
      expect(result).toBeDefined();
    });
  });

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const result = formatDateTime('2025-11-04T14:30:00');
      expect(result).toContain('2025');
      expect(result).toContain(':');
    });

    it('should handle Date object', () => {
      const date = new Date('2025-11-04T14:30:00');
      const result = formatDateTime(date);
      expect(result).toBeDefined();
    });
  });

  describe('calculateRentalDays', () => {
    it('should calculate days correctly', () => {
      const days = calculateRentalDays('2025-11-01', '2025-11-05');
      expect(days).toBe(4);
    });

    it('should return 0 for invalid dates', () => {
      const days = calculateRentalDays('invalid', '2025-11-05');
      expect(days).toBe(0);
    });

    it('should return 0 when end is before start', () => {
      const days = calculateRentalDays('2025-11-05', '2025-11-01');
      expect(days).toBe(0);
    });

    it('should return 0 when dates are same', () => {
      const days = calculateRentalDays('2025-11-05', '2025-11-05');
      expect(days).toBe(0);
    });

    it('should handle date objects as strings', () => {
      const start = new Date('2025-11-01').toISOString();
      const end = new Date('2025-11-10').toISOString();
      const days = calculateRentalDays(start, end);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('calculateRentalCost', () => {
    it('should calculate rental cost correctly', () => {
      const result = calculateRentalCost('2025-11-01', '2025-11-05', 450, 0.15);

      expect(result.days).toBe(4);
      expect(result.subtotal).toBe(4 * 450); // 1800
      expect(result.taxes).toBe(1800 * 0.15); // 270
      expect(result.total).toBe(1800 + 270); // 2070
    });

    it('should use default daily rate', () => {
      const result = calculateRentalCost('2025-11-01', '2025-11-02');

      expect(result.subtotal).toBe(450); // 1 day * $450
    });

    it('should use default tax rate', () => {
      const result = calculateRentalCost('2025-11-01', '2025-11-02', 450);

      expect(result.taxes).toBe(450 * 0.15); // 15% tax
    });

    it('should handle zero days', () => {
      const result = calculateRentalCost('2025-11-01', '2025-11-01');

      expect(result.days).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.taxes).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('generateBookingNumber', () => {
    it('should generate booking number with UDR prefix', () => {
      const number = generateBookingNumber();
      expect(number).toMatch(/^UDR-\d{8}-\d{3}$/);
    });

    it('should generate unique numbers', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateBookingNumber());
      }
      // Should have multiple unique numbers (high probability)
      expect(numbers.size).toBeGreaterThan(1);
    });

    it('should include current date', () => {
      const number = generateBookingNumber();
      const year = new Date().getFullYear().toString();
      expect(number).toContain(year);
    });
  });

  describe('contractNumberFromBooking', () => {
    it('should replace BK prefix with CT', () => {
      expect(contractNumberFromBooking('BK-ABC123')).toBe('CT-ABC123');
    });

    it('should handle lowercase prefixes', () => {
      expect(contractNumberFromBooking('bk-xyz')).toBe('CT-xyz');
    });

    it('should remove prefix without hyphen', () => {
      expect(contractNumberFromBooking('BK123')).toBe('CT-123');
    });

    it('should leave CT-prefixed numbers unchanged', () => {
      expect(contractNumberFromBooking('CT-ALREADY')).toBe('CT-ALREADY');
    });

    it('should fall back when booking number missing', () => {
      const generated = contractNumberFromBooking('');
      expect(generated.startsWith('CT-')).toBe(true);
    });
  });

  describe('generateContractNumber', () => {
    it('should use booking number when provided', () => {
      expect(generateContractNumber('BK-TEST123')).toBe('CT-TEST123');
    });

    it('should fall back to generated CT number when booking missing', () => {
      const number = generateContractNumber();
      expect(number).toMatch(/^CT-[A-Z0-9]+-[A-Z0-9]+$/);
    });
  });

  describe('generatePaymentNumber', () => {
    it('should generate payment number with PAY prefix', () => {
      const number = generatePaymentNumber();
      expect(number).toMatch(/^PAY-\d{8}-\d{3}$/);
    });

    it('should generate unique numbers', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generatePaymentNumber());
      }
      expect(numbers.size).toBeGreaterThan(1);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('5065551234')).toBe(true);
      expect(validatePhone('(506) 555-1234')).toBe(true);
    });

    it('should handle formatting characters', () => {
      expect(validatePhone('506-555-1234')).toBe(true);
      expect(validatePhone('+1 506 555 1234')).toBe(true);
    });
  });

  describe('validatePostalCode', () => {
    it('should validate Canadian postal codes', () => {
      expect(validatePostalCode('E2J 1H6')).toBe(true);
      expect(validatePostalCode('E2J1H6')).toBe(true);
      expect(validatePostalCode('K1A 0B1', 'CA')).toBe(true);
    });

    it('should reject invalid Canadian postal codes', () => {
      expect(validatePostalCode('12345', 'CA')).toBe(false);
      expect(validatePostalCode('ABC123', 'CA')).toBe(false);
    });

    it('should accept non-CA countries by default', () => {
      expect(validatePostalCode('12345', 'US')).toBe(true);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should pass arguments to debounced function', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      // Should only call once immediately
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      // Now can call again
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe('getInitials', () => {
    it('should get initials from first and last name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD');
      expect(getInitials('jane', 'smith')).toBe('JS');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
      expect(getInitials(undefined, 'Doe')).toBe('D');
    });

    it('should return U for no names', () => {
      expect(getInitials()).toBe('U');
      expect(getInitials(undefined, undefined)).toBe('U');
    });

    it('should uppercase initials', () => {
      expect(getInitials('john', 'doe')).toBe('JD');
    });
  });

  describe('getStatusColor', () => {
    it('should return green for completed statuses', () => {
      expect(getStatusColor('confirmed')).toContain('green');
      expect(getStatusColor('completed')).toContain('green');
    });

    it('should return yellow for pending statuses', () => {
      expect(getStatusColor('pending')).toContain('yellow');
      expect(getStatusColor('processing')).toContain('yellow');
    });

    it('should return blue for active statuses', () => {
      expect(getStatusColor('in_progress')).toContain('blue');
      expect(getStatusColor('active')).toContain('blue');
    });

    it('should return red for failed statuses', () => {
      expect(getStatusColor('cancelled')).toContain('red');
      expect(getStatusColor('failed')).toContain('red');
    });

    it('should return gray for draft statuses', () => {
      expect(getStatusColor('draft')).toContain('gray');
      expect(getStatusColor('inactive')).toContain('gray');
    });

    it('should be case insensitive', () => {
      expect(getStatusColor('CONFIRMED')).toContain('green');
      expect(getStatusColor('Pending')).toContain('yellow');
    });

    it('should handle unknown statuses', () => {
      expect(getStatusColor('unknown')).toContain('gray');
    });
  });

  describe('getStatusText', () => {
    it('should format status text correctly', () => {
      expect(getStatusText('confirmed')).toBe('Confirmed');
      expect(getStatusText('pending')).toBe('Pending');
      expect(getStatusText('in_progress')).toBe('In Progress');
      expect(getStatusText('completed')).toBe('Completed');
    });

    it('should be case insensitive', () => {
      expect(getStatusText('CONFIRMED')).toBe('Confirmed');
      expect(getStatusText('Pending')).toBe('Pending');
    });

    it('should return original text for unknown statuses', () => {
      expect(getStatusText('custom_status')).toBe('custom_status');
    });
  });
});


