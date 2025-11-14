import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from '../bookings/send-email/route.ts';
import { createMockRequest, expectErrorResponse } from '@/test-utils';

const { mockSupabase, mockSendAdminEmail, mockRequireAdmin } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
  mockSendAdminEmail: vi.fn(),
  mockRequireAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/sendgrid', () => ({
  sendAdminEmail: mockSendAdminEmail,
}));

describe('POST /api/admin/bookings/send-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.from.mockReset();
    process.env.SENDGRID_API_KEY = 'sg-key';
    process.env.EMAIL_FROM = 'no-reply@example.com';
    process.env.EMAIL_FROM_NAME = 'Kubota Rentals';

    const bookingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'booking-1', bookingNumber: 'BK-001' },
        error: null,
      }),
    };

    const emailLogChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'email-log-1' },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingChain;
      }
      if (table === 'email_logs') {
        return emailLogChain;
      }
      if (table === 'email_templates') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockRequireAdmin.mockResolvedValue({
      supabase: mockSupabase,
      user: { id: 'admin-123', email: 'admin@example.com' },
      role: 'admin',
    });

    mockSendAdminEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.SENDGRID_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_FROM_NAME;
  });

  it('should require admin role', async () => {
    const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    mockRequireAdmin.mockResolvedValueOnce({
      supabase: mockSupabase,
      error: forbidden,
    });

    const response = await POST(
      createMockRequest('POST', {
        bookingId: 'booking-1',
        recipientEmail: 'customer@test.com',
        recipientName: 'Customer',
        subject: 'Test',
        message: 'Message',
      })
    );

    expect(response.status).toBe(403);
  });

  it('should require recipient email', async () => {
    const response = await POST(
      createMockRequest('POST', {
        bookingId: 'booking-1',
        subject: 'Test',
        message: 'Message',
      })
    );

    await expectErrorResponse(response, 400, /Missing required fields/);
  });

  it('should send email via SendGrid helper and update log', async () => {
    const response = await POST(
      createMockRequest('POST', {
        bookingId: 'booking-1',
        recipientEmail: 'customer@test.com',
        recipientName: 'Customer',
        subject: 'Booking Update',
        message: 'Your booking is confirmed',
      })
    );

    expect(response.status).toBe(200);
    expect(mockSendAdminEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@test.com',
        subject: 'Booking Update',
      })
    );
  });

  it('should handle SendGrid errors gracefully', async () => {
    mockSendAdminEmail.mockRejectedValueOnce(new Error('SendGrid error'));

    const response = await POST(
      createMockRequest('POST', {
        bookingId: 'booking-1',
        recipientEmail: 'customer@test.com',
        recipientName: 'Customer',
        subject: 'Test',
        message: 'Message',
      })
    );

    await expectErrorResponse(response, 500);
  });
});
