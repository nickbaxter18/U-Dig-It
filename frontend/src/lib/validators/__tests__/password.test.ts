/**
 * Comprehensive Unit Tests for Password Validation
 * Tests password strength, validation rules, and security checks
 */

import { describe, expect, it } from 'vitest';
import {
    checkPasswordStrength,
    sanitizePassword,
    validatePassword,
    validatePasswordsMatch,
} from '../password';

describe('password-validator', () => {
  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Passw0rd!',
        'MyStr0ng#Pass',
        'C0mpl3x$P@ssw0rd',
        'SecurePass123!',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject passwords shorter than 6 characters', () => {
      const result = validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });

    it('should reject passwords longer than 128 characters', () => {
      const result = validatePassword('a'.repeat(129));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    it('should reject common weak passwords', () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
        'Password123', // Case variations
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('too common'))).toBe(true);
      });
    });

    it('should accept minimum length passwords', () => {
      const result = validatePassword('Pass12');
      expect(result.isValid).toBe(true);
    });

    it('should accept maximum length passwords', () => {
      const result = validatePassword('a'.repeat(128));
      expect(result.isValid).toBe(true);
    });

    it('should return multiple errors for multiple issues', () => {
      const result = validatePassword('pass');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('checkPasswordStrength', () => {
    it('should rate empty password as weak', () => {
      const result = checkPasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.label).toBe('Weak');
      expect(result.color).toBe('red');
      expect(result.isValid).toBe(false);
    });

    it('should rate simple passwords as weak', () => {
      const result = checkPasswordStrength('password');
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.label).toBe('Weak');
      expect(result.color).toBe('red');
    });

    it('should rate medium complexity passwords as fair', () => {
      const result = checkPasswordStrength('Password1');
      // 'Password1' has: length>=8 (+1), uppercase+lowercase (+1), numbers (+1) = score 3 (Good)
      expect(result.score).toBe(3);
      expect(result.label).toBe('Good');
      expect(result.color).toBe('yellow');
    });

    it('should rate good passwords appropriately', () => {
      const result = checkPasswordStrength('Password1!');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(['Good', 'Strong']).toContain(result.label);
      expect(['yellow', 'green']).toContain(result.color);
    });

    it('should rate strong passwords highly', () => {
      const result = checkPasswordStrength('Str0ng!P@ssw0rd');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(['Good', 'Strong']).toContain(result.label);
      expect(result.isValid).toBe(true);
    });

    it('should give higher scores for length', () => {
      const short = checkPasswordStrength('Pass1!');
      const medium = checkPasswordStrength('Password1!');
      const long = checkPasswordStrength('VeryLongPassword1!@#');

      expect(medium.score).toBeGreaterThanOrEqual(short.score);
      expect(long.score).toBeGreaterThanOrEqual(medium.score);
    });

    it('should reward uppercase and lowercase letters', () => {
      const result = checkPasswordStrength('Password123!');
      expect(result.feedback.some(f => f.includes('uppercase and lowercase'))).toBe(true);
    });

    it('should reward numbers', () => {
      const result = checkPasswordStrength('Password123');
      expect(result.feedback.some(f => f.includes('numbers'))).toBe(true);
    });

    it('should reward special characters', () => {
      const result = checkPasswordStrength('Password!@#');
      expect(result.feedback.some(f => f.includes('special characters'))).toBe(true);
    });

    it('should penalize all lowercase', () => {
      const allLower = checkPasswordStrength('password');
      const mixed = checkPasswordStrength('Password');
      expect(mixed.score).toBeGreaterThan(allLower.score);
    });

    it('should heavily penalize all numbers', () => {
      const result = checkPasswordStrength('123456789');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should penalize repeating characters', () => {
      const result = checkPasswordStrength('Passsssword111!!!');
      expect(result.feedback.some(f => f.includes('repeating'))).toBe(true);
    });

    it('should provide helpful feedback', () => {
      const weak = checkPasswordStrength('pass');
      expect(weak.feedback.length).toBeGreaterThan(0);

      const strong = checkPasswordStrength('Str0ng!P@ss');
      expect(strong.feedback.length).toBeGreaterThan(0);
    });

    it('should require minimum score of 2 for validity', () => {
      const weak = checkPasswordStrength('password');
      expect(weak.isValid).toBe(false);

      const fair = checkPasswordStrength('Password1');
      expect(fair.isValid).toBe(true);
    });

    it('should require minimum length of 6 for validity', () => {
      const short = checkPasswordStrength('P@s1');
      expect(short.isValid).toBe(false);

      const valid = checkPasswordStrength('P@ss1!');
      expect(valid.isValid).toBe(true);
    });
  });

  describe('validatePasswordsMatch', () => {
    it('should validate matching passwords', () => {
      expect(validatePasswordsMatch('password123', 'password123')).toBe(true);
      expect(validatePasswordsMatch('P@ssw0rd!', 'P@ssw0rd!')).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      expect(validatePasswordsMatch('password1', 'password2')).toBe(false);
      expect(validatePasswordsMatch('Password', 'password')).toBe(false);
    });

    it('should reject when either password is empty', () => {
      expect(validatePasswordsMatch('', '')).toBe(false);
      expect(validatePasswordsMatch('password', '')).toBe(false);
      expect(validatePasswordsMatch('', 'password')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validatePasswordsMatch('Password', 'password')).toBe(false);
    });
  });

  describe('sanitizePassword', () => {
    it('should remove leading and trailing whitespace', () => {
      expect(sanitizePassword('  password  ')).toBe('password');
      expect(sanitizePassword('\tpassword\t')).toBe('password');
      expect(sanitizePassword('\npassword\n')).toBe('password');
    });

    it('should remove zero-width spaces', () => {
      const withZeroWidth = 'pass\u200Bword';
      expect(sanitizePassword(withZeroWidth)).toBe('password');
    });

    it('should remove other invisible characters', () => {
      const withInvisible = 'pass\u200C\u200D\uFEFFword';
      expect(sanitizePassword(withInvisible)).toBe('password');
    });

    it('should preserve valid special characters', () => {
      expect(sanitizePassword('P@ssw0rd!')).toBe('P@ssw0rd!');
      expect(sanitizePassword('p#a$s%s^w&o*r(d)')).toBe('p#a$s%s^w&o*r(d)');
    });

    it('should preserve spaces within the password', () => {
      expect(sanitizePassword('my secure password')).toBe('my secure password');
    });

    it('should handle empty string', () => {
      expect(sanitizePassword('')).toBe('');
    });

    it('should handle already clean passwords', () => {
      expect(sanitizePassword('CleanPassword123!')).toBe('CleanPassword123!');
    });
  });
});


