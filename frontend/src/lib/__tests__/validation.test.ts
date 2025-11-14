/**
 * Comprehensive Unit Tests for Validation Utilities
 * Tests all validation functions with edge cases and scenarios
 */

import { describe, expect, it } from 'vitest';
import {
    validateBookingForm,
    validateDateRange,
    validateEmail,
    validateGuestForm,
    validatePhone,
    validatePostalCode,
    validateRequired,
} from '../validation';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.com')).toBe(true);
      expect(validateEmail('firstname.lastname@company.ca')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('test..email@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should reject email with special characters in wrong places', () => {
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('.test@example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('5065551234')).toBe(true);
      expect(validatePhone('1-506-555-1234')).toBe(true);
      expect(validatePhone('(506) 555-1234')).toBe(true);
      expect(validatePhone('+1 506 555 1234')).toBe(true);
      expect(validatePhone('+15065551234')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('0000000000')).toBe(false); // Starts with 0
    });

    it('should handle international formats', () => {
      expect(validatePhone('+442071234567')).toBe(true); // UK
      expect(validatePhone('+33123456789')).toBe(true); // France
    });
  });

  describe('validatePostalCode', () => {
    it('should validate correct Canadian postal codes', () => {
      expect(validatePostalCode('E2J 1H6')).toBe(true);
      expect(validatePostalCode('E2J1H6')).toBe(true);
      expect(validatePostalCode('K1A 0B1')).toBe(true);
      expect(validatePostalCode('V6B 1A1')).toBe(true);
      expect(validatePostalCode('T5J 3S5')).toBe(true);
    });

    it('should handle case insensitivity', () => {
      expect(validatePostalCode('e2j 1h6')).toBe(true);
      expect(validatePostalCode('E2j1H6')).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      expect(validatePostalCode('12345')).toBe(false); // US ZIP
      expect(validatePostalCode('ABC123')).toBe(false);
      expect(validatePostalCode('E2J')).toBe(false); // Incomplete
      expect(validatePostalCode('')).toBe(false);
      expect(validatePostalCode('000 000')).toBe(false);
    });

    it('should handle hyphen separator', () => {
      expect(validatePostalCode('E2J-1H6')).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty strings', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired('a')).toBe(true);
      expect(validateRequired('  test  ')).toBe(true); // Trims whitespace
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired('\t\n')).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('should validate future date ranges', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      expect(
        validateDateRange(tomorrow.toISOString(), nextWeek.toISOString())
      ).toBe(true);
    });

    it('should validate today as start date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(validateDateRange(today.toISOString(), tomorrow.toISOString())).toBe(true);
    });

    it('should reject past start dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(
        validateDateRange(yesterday.toISOString(), tomorrow.toISOString())
      ).toBe(false);
    });

    it('should reject end date before start date', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(
        validateDateRange(nextWeek.toISOString(), tomorrow.toISOString())
      ).toBe(false);
    });

    it('should reject same day start and end', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(
        validateDateRange(tomorrow.toISOString(), tomorrow.toISOString())
      ).toBe(false);
    });

    it('should reject missing dates', () => {
      expect(validateDateRange('', '2025-12-01')).toBe(false);
      expect(validateDateRange('2025-11-15', '')).toBe(false);
      expect(validateDateRange('', '')).toBe(false);
    });
  });

  describe('validateBookingForm', () => {
    const validFormData = {
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      deliveryAddress: '123 Main Street',
      deliveryCity: 'Saint John',
      customerEmail: 'test@example.com',
      customerName: 'John Doe',
    };

    it('should validate correct booking form', () => {
      const result = validateBookingForm(validFormData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should require start date', () => {
      const result = validateBookingForm({
        ...validFormData,
        startDate: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.startDate).toBeDefined();
    });

    it('should require end date', () => {
      const result = validateBookingForm({
        ...validFormData,
        endDate: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.endDate).toBeDefined();
    });

    it('should validate end date is after start date', () => {
      const result = validateBookingForm({
        ...validFormData,
        startDate: new Date(Date.now() + 172800000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.endDate).toBe('End date must be after start date');
    });

    it('should require delivery address', () => {
      const result = validateBookingForm({
        ...validFormData,
        deliveryAddress: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.deliveryAddress).toBe('Delivery address is required');
    });

    it('should require delivery city', () => {
      const result = validateBookingForm({
        ...validFormData,
        deliveryCity: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.deliveryCity).toBe('Please select a delivery area');
    });

    it('should require customer name', () => {
      const result = validateBookingForm({
        ...validFormData,
        customerName: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.customerName).toBe('Customer name is required');
    });

    it('should require customer email', () => {
      const result = validateBookingForm({
        ...validFormData,
        customerEmail: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.customerEmail).toBe('Email address is required');
    });

    it('should validate email format', () => {
      const result = validateBookingForm({
        ...validFormData,
        customerEmail: 'invalid-email',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.customerEmail).toBe('Please enter a valid email address');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const result = validateBookingForm({
        startDate: '',
        endDate: '',
        deliveryAddress: '',
        deliveryCity: '',
        customerEmail: 'invalid',
        customerName: '',
      });
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(3);
    });
  });

  describe('validateGuestForm', () => {
    const validGuestData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '506-555-1234',
    };

    it('should validate correct guest form', () => {
      const result = validateGuestForm(validGuestData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate guest form without phone', () => {
      const result = validateGuestForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should require first name', () => {
      const result = validateGuestForm({
        ...validGuestData,
        firstName: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBe('First name is required');
    });

    it('should require last name', () => {
      const result = validateGuestForm({
        ...validGuestData,
        lastName: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.lastName).toBe('Last name is required');
    });

    it('should require email', () => {
      const result = validateGuestForm({
        ...validGuestData,
        email: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address is required');
    });

    it('should validate email format', () => {
      const result = validateGuestForm({
        ...validGuestData,
        email: 'not-an-email',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
    });

    it('should validate phone format if provided', () => {
      const result = validateGuestForm({
        ...validGuestData,
        phone: 'abc',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toBe('Please enter a valid phone number');
    });

    it('should accept valid phone formats', () => {
      const phones = [
        '5065551234',
        '506-555-1234',
        '(506) 555-1234',
        '+1 506 555 1234',
      ];

      phones.forEach(phone => {
        const result = validateGuestForm({
          ...validGuestData,
          phone,
        });
        expect(result.isValid).toBe(true);
      });
    });
  });
});


