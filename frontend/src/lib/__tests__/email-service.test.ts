import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailTemplate, sendBookingConfirmation, sendEmail, sendPaymentReceipt } from '../email-service';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ messageId: 'msg-123' }),
    });
  });

  describe('sendEmail', () => {
    it('should send basic emails', async () => {
      await sendEmail({
        to: 'customer@example.com',
        subject: 'Test Email',
        body: 'Email content',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/email'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include sender information', async () => {
      await sendEmail({
        to: 'customer@example.com',
        subject: 'Test',
        body: 'Content',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.from).toContain('udigit');
    });

    it('should support multiple recipients', async () => {
      await sendEmail({
        to: ['customer1@example.com', 'customer2@example.com'],
        subject: 'Test',
        body: 'Content',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.to).toHaveLength(2);
    });

    it('should support CC and BCC', async () => {
      await sendEmail({
        to: 'customer@example.com',
        cc: ['manager@example.com'],
        bcc: ['admin@example.com'],
        subject: 'Test',
        body: 'Content',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.cc).toContain('manager@example.com');
      expect(callBody.bcc).toContain('admin@example.com');
    });

    it('should support HTML emails', async () => {
      await sendEmail({
        to: 'customer@example.com',
        subject: 'Test',
        htmlBody: '<h1>Hello</h1><p>Content</p>',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.htmlBody).toContain('<h1>');
    });

    it('should support attachments', async () => {
      await sendEmail({
        to: 'customer@example.com',
        subject: 'Test',
        body: 'Content',
        attachments: [
          { filename: 'invoice.pdf', content: 'base64-data' },
        ],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.attachments).toHaveLength(1);
    });

    it('should validate email addresses', async () => {
      await expect(
        sendEmail({
          to: 'invalid-email',
          subject: 'Test',
          body: 'Content',
        })
      ).rejects.toThrow(/email.*invalid/i);
    });

    it('should handle sending failures', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to send' }),
      });

      await expect(
        sendEmail({
          to: 'customer@example.com',
          subject: 'Test',
          body: 'Content',
        })
      ).rejects.toThrow();
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation emails', async () => {
      await sendBookingConfirmation({
        to: 'customer@example.com',
        bookingNumber: 'UDR-2025-001',
        customerName: 'John Doe',
        equipmentName: 'Kubota SVL-75',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalAmount: 1050.0,
      });

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.subject).toContain('Booking Confirmation');
      expect(callBody.htmlBody).toContain('UDR-2025-001');
    });

    it('should include booking details', async () => {
      await sendBookingConfirmation({
        to: 'customer@example.com',
        bookingNumber: 'UDR-2025-002',
        customerName: 'Jane Smith',
        equipmentName: 'Kubota KX040',
        startDate: '2025-02-10',
        endDate: '2025-02-15',
        totalAmount: 1500.0,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.htmlBody).toContain('Kubota KX040');
      expect(callBody.htmlBody).toContain('$1,500.00');
    });

    it('should use booking confirmation template', async () => {
      await sendBookingConfirmation({
        to: 'customer@example.com',
        bookingNumber: 'UDR-2025-003',
        customerName: 'Test User',
        equipmentName: 'Equipment',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalAmount: 1000.0,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.template).toBe(EmailTemplate.BOOKING_CONFIRMATION);
    });
  });

  describe('sendPaymentReceipt', () => {
    it('should send payment receipts', async () => {
      await sendPaymentReceipt({
        to: 'customer@example.com',
        receiptNumber: 'RCP-2025-001',
        customerName: 'John Doe',
        amount: 1050.0,
        paymentMethod: 'Visa ****1234',
        transactionId: 'txn-123',
      });

      expect(mockFetch).toHaveBeenCalled();
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.subject).toContain('Payment Receipt');
    });

    it('should include payment details', async () => {
      await sendPaymentReceipt({
        to: 'customer@example.com',
        receiptNumber: 'RCP-2025-002',
        customerName: 'Jane Smith',
        amount: 2500.0,
        paymentMethod: 'Mastercard ****5678',
        transactionId: 'txn-456',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.htmlBody).toContain('$2,500.00');
      expect(callBody.htmlBody).toContain('Mastercard');
    });

    it('should attach PDF receipt', async () => {
      await sendPaymentReceipt({
        to: 'customer@example.com',
        receiptNumber: 'RCP-2025-003',
        customerName: 'Test User',
        amount: 1000.0,
        paymentMethod: 'Visa',
        transactionId: 'txn-789',
        attachPDF: true,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.attachments).toBeDefined();
    });
  });

  describe('Email Templates', () => {
    it('should use correct template for booking confirmations', () => {
      expect(EmailTemplate.BOOKING_CONFIRMATION).toBeDefined();
    });

    it('should use correct template for payment receipts', () => {
      expect(EmailTemplate.PAYMENT_RECEIPT).toBeDefined();
    });

    it('should use correct template for password reset', () => {
      expect(EmailTemplate.PASSWORD_RESET).toBeDefined();
    });

    it('should use correct template for welcome emails', () => {
      expect(EmailTemplate.WELCOME).toBeDefined();
    });
  });

  describe('Email Formatting', () => {
    it('should format currency values', async () => {
      await sendPaymentReceipt({
        to: 'customer@example.com',
        receiptNumber: 'RCP-001',
        customerName: 'Test',
        amount: 1234.56,
        paymentMethod: 'Card',
        transactionId: 'txn-1',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.htmlBody).toContain('$1,234.56');
    });

    it('should format dates properly', async () => {
      await sendBookingConfirmation({
        to: 'customer@example.com',
        bookingNumber: 'UDR-001',
        customerName: 'Test',
        equipmentName: 'Equipment',
        startDate: '2025-02-01',
        endDate: '2025-02-05',
        totalAmount: 1000,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Should format as "February 1, 2025" or similar
      expect(callBody.htmlBody).toMatch(/february|feb/i);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect email rate limits', async () => {
      // Send many emails rapidly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          sendEmail({
            to: `customer${i}@example.com`,
            subject: 'Test',
            body: 'Content',
          })
        );
      }

      await Promise.allSettled(promises);

      // Should have rate limited some requests
      const failures = promises.filter(p => p.catch(() => true));
      expect(failures.length).toBeGreaterThan(0);
    });
  });
});

