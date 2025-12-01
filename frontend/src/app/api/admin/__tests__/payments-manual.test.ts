import { createMockRequest, expectErrorResponse } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NextResponse } from 'next/server';

import { GET, POST } from '../payments/manual/route';

const mockRequireAdmin = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/booking/balance', () => ({
  recalculateBookingBalance: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/booking/billing-status', () => ({
  updateBillingStatus: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

interface BuildSupabaseOptions {
  manualPayments?: unknown[];
  manualPaymentsError?: unknown;
  insertError?: unknown;
  booking?: unknown;
  bookingError?: unknown;
}

const buildSupabase = (options: BuildSupabaseOptions = {}) => {
  const manualPayments = options.manualPayments ?? [];
  const manualPaymentsError = options.manualPaymentsError ?? null;
  const insertError = options.insertError ?? null;
  const booking = options.booking ?? {
    id: 'booking-123',
    totalAmount: '1000',
    billingStatus: 'pending',
  };
  const bookingError = options.bookingError ?? null;

  const insertedData: unknown[] = [];

  const manualPaymentsBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({
      data: manualPayments,
      error: manualPaymentsError,
      count: manualPayments.length,
    }),
    insert: vi.fn((data: unknown) => {
      insertedData.push(data);
      return {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-payment-123', ...data },
          error: insertError,
        }),
      };
    }),
  };

  const bookingsBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: booking,
      error: bookingError,
    }),
    update: vi.fn().mockReturnThis(),
  };

  const ledgerInsert = vi.fn().mockResolvedValue({ error: null });
  const auditInsert = vi.fn().mockResolvedValue({ error: null });

  const supabase = {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'manual_payments':
          return manualPaymentsBuilder;
        case 'bookings':
          return bookingsBuilder;
        case 'financial_ledger':
          return { insert: ledgerInsert };
        case 'audit_logs':
          return { insert: auditInsert };
        default:
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
      }
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    supabase,
    insertedData,
    ledgerInsert,
    auditInsert,
    manualPaymentsBuilder,
    bookingsBuilder,
  };
};

describe('Manual Payments API', () => {
  const mockAdmin = { id: 'admin-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/payments/manual', () => {
    it('should return list of manual payments', async () => {
      const mockPayments = [
        { id: '1', amount: 500, status: 'completed' },
        { id: '2', amount: 300, status: 'pending' },
      ];

      const { supabase } = buildSupabase({ manualPayments: mockPayments });
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('GET');
      const response = await GET(request);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.manualPayments).toHaveLength(2);
    });

    it('should require admin role', async () => {
      mockRequireAdmin.mockResolvedValue({
        supabase: null as any,
        user: null,
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      });

      const request = createMockRequest('GET');
      const response = await GET(request);

      await expectErrorResponse(response, 403);
    });

    it('should handle empty results', async () => {
      const { supabase } = buildSupabase({ manualPayments: [] });
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('GET');
      const response = await GET(request);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.manualPayments).toHaveLength(0);
    });
  });

  describe('POST /api/admin/payments/manual', () => {
    it('should require bookingId', async () => {
      const { supabase } = buildSupabase();
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('POST', {
        amount: 500,
        method: 'cash',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 400);
    });

    it('should require amount', async () => {
      const { supabase } = buildSupabase();
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('POST', {
        bookingId: 'booking-123',
        method: 'cash',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 400);
    });

    it('should require valid payment method', async () => {
      const { supabase } = buildSupabase();
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('POST', {
        bookingId: 'booking-123',
        amount: 500,
        method: 'invalid_method',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 400);
    });

    it('should require admin role', async () => {
      mockRequireAdmin.mockResolvedValue({
        supabase: null as any,
        user: null,
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      });

      const request = createMockRequest('POST', {
        bookingId: 'booking-123',
        amount: 500,
        method: 'cash',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 403);
    });
  });
});

describe('Payment Validation', () => {
  const mockAdmin = { id: 'admin-123' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Amount Validation', () => {
    it('should reject negative amounts', async () => {
      const { supabase } = buildSupabase();
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('POST', {
        bookingId: 'booking-123',
        amount: -100,
        method: 'cash',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 400);
    });

    it('should reject zero amounts', async () => {
      const { supabase } = buildSupabase();
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('POST', {
        bookingId: 'booking-123',
        amount: 0,
        method: 'cash',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 400);
    });

    it('should reject unreasonably large amounts', async () => {
      const { supabase } = buildSupabase();
      mockRequireAdmin.mockResolvedValue({
        supabase,
        user: mockAdmin,
        error: null,
      });

      const request = createMockRequest('POST', {
        bookingId: 'booking-123',
        amount: 1_000_000_000, // 1 billion
        method: 'cash',
      });

      const response = await POST(request);

      await expectErrorResponse(response, 400);
    });
  });
});
