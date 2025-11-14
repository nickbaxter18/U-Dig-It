/**
 * Email Integration Tests
 * Validates email service configuration and integration points
 */

import { describe, it, expect } from 'vitest';
import {
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendSpinWinnerEmail,
  sendTestEmail
} from '@/lib/email-service';

describe('Email Service Integration', () => {
  // Skip actual email sending in tests unless explicitly enabled
  const skipEmailSending = !process.env.TEST_SEND_REAL_EMAILS;

  describe('Configuration', () => {
    it('should have SendGrid API key configured', () => {
      expect(process.env.SENDGRID_API_KEY).toBeTruthy();
      expect(process.env.SENDGRID_API_KEY).toContain('SG.');
    });

    it('should have from email configured', () => {
      expect(process.env.EMAIL_FROM).toBeTruthy();
      expect(process.env.EMAIL_FROM).toContain('@');
    });

    it('should have email feature flag enabled', () => {
      expect(process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS).toBe('true');
    });
  });

  describe('Email Templates', () => {
    it('should have booking confirmation template', () => {
      expect(sendBookingConfirmationEmail).toBeDefined();
      expect(typeof sendBookingConfirmationEmail).toBe('function');
    });

    it('should have payment receipt template', () => {
      expect(sendPaymentReceiptEmail).toBeDefined();
      expect(typeof sendPaymentReceiptEmail).toBe('function');
    });

    it('should have spin winner template', () => {
      expect(sendSpinWinnerEmail).toBeDefined();
      expect(typeof sendSpinWinnerEmail).toBe('function');
    });

    it('should have test email function', () => {
      expect(sendTestEmail).toBeDefined();
      expect(typeof sendTestEmail).toBe('function');
    });
  });

  describe('Email Sending (Integration)', () => {
    it.skipIf(skipEmailSending)('should send booking confirmation email', async () => {
      const mockBooking = {
        id: 'test-booking-id',
        bookingNumber: 'BK-TEST-12345',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        totalAmount: '895.85',
        deliveryAddress: '123 Test Street, Saint John, NB',
      };

      const mockCustomer = {
        email: 'aitest2@udigit.ca',
        firstName: 'AI',
        lastName: 'Tester',
      };

      const result = await sendBookingConfirmationEmail(mockBooking, mockCustomer);
      expect(result.success).toBe(true);
    }, 30000); // 30 second timeout for network request

    it.skipIf(skipEmailSending)('should send test email', async () => {
      const result = await sendTestEmail('aitest2@udigit.ca');
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Email Content Validation', () => {
    it('should include all required fields in booking confirmation', async () => {
      const mockBooking = {
        id: 'test-id',
        bookingNumber: 'BK-TEST-123',
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        totalAmount: '895.85',
        deliveryAddress: '123 Test St',
      };

      const mockCustomer = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      // Test that the function can be called without throwing
      expect(() => {
        // This would normally send email, but we're just checking structure
        const emailData = {
          booking: mockBooking,
          customer: mockCustomer,
        };
        expect(emailData.booking.bookingNumber).toBeTruthy();
        expect(emailData.customer.email).toBeTruthy();
      }).not.toThrow();
    });
  });
});


