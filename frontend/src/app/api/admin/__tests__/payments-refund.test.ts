import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../payments/refund/route';
import { createMockRequest, expectErrorResponse, createTestPayment } from '@/test-utils';

const mockRequireAdmin = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/requireAdmin', () => ({
  requireAdmin: mockRequireAdmin,
}));

const mockStripeInstance = vi.hoisted(() => ({
  refunds: {
    create: vi.fn(),
  },
}));

const MockStripeConstructor = vi.hoisted(() =>
  vi.fn(function MockStripe() {
    return mockStripeInstance;
  }),
);

vi.mock('stripe', () => ({
  default: MockStripeConstructor,
}));

interface BuildSupabaseOptions {
  role?: string;
  payment?: any;
  paymentError?: any;
  updateError?: any;
}

const buildSupabase = (options: BuildSupabaseOptions = {}) => {
  const userRole = options.role ?? 'admin';
  const paymentRecord = options.payment ?? null;
  const paymentError = options.paymentError ?? null;
  const updateError = options.updateError ?? null;

  const updatePayloads: any[] = [];

  const paymentsSingle = vi.fn().mockResolvedValue({
    data: paymentRecord,
    error: paymentError,
  });

  const paymentsUpdateEq = vi.fn().mockResolvedValue({
    error: updateError,
  });

  const paymentsBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: paymentsSingle,
    update: vi.fn((payload: any) => {
      updatePayloads.push(payload);
      return { eq: paymentsUpdateEq };
    }),
  };

  const usersBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { role: userRole },
      error: null,
    }),
  };

  const auditInsert = vi.fn().mockResolvedValue({ error: null });

  const supabase = {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'users':
          return usersBuilder;
        case 'payments':
          return paymentsBuilder;
        case 'audit_logs':
          return {
            insert: auditInsert,
          };
        default:
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
      }
    }),
  };

  return {
    supabase,
    paymentsSingle,
    paymentsUpdateEq,
    auditInsert,
    updatePayloads,
  };
};

describe('POST /api/admin/payments/refund', () => {
  const mockAdmin = { id: 'admin-123' };
  let basePayment: ReturnType<typeof createTestPayment>;
  let supabaseMock: ReturnType<typeof buildSupabase>['supabase'];
  let updatePayloads: any[];
  let paymentsUpdateEq: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';

    basePayment = createTestPayment({
      stripePaymentIntentId: 'pi_test_123',
      amountRefunded: '0',
    });

    const build = buildSupabase({ payment: basePayment });
    supabaseMock = build.supabase;
    updatePayloads = build.updatePayloads;
    paymentsUpdateEq = build.paymentsUpdateEq;

    mockRequireAdmin.mockResolvedValue({
      supabase: supabaseMock,
      user: mockAdmin,
      error: null,
    });

    mockStripeInstance.refunds.create.mockResolvedValue({
      id: 're_test_123',
      amount: 100,
      status: 'succeeded',
    });
  });

  it('should require admin role', async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      supabase: null as any,
      user: null,
      error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
    });

    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      amount: basePayment.amount,
      reason: 'Customer requested refund',
    });
    const response = await POST(request);

    await expectErrorResponse(response, 403);
  });

  it('should require paymentId', async () => {
    const request = createMockRequest('POST', {
      amount: basePayment.amount,
      reason: 'Customer requested refund',
    });

    const response = await POST(request);

    await expectErrorResponse(response, 400, /paymentId/i);
  });

  it('should require amount value', async () => {
    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      reason: 'Customer requested refund',
    });

    const response = await POST(request);

    await expectErrorResponse(response, 400, /amount/i);
  });

  it('should require reason value', async () => {
    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      amount: basePayment.amount,
    });

    const response = await POST(request);

    await expectErrorResponse(response, 400, /reason/i);
  });

  it('should create Stripe refund for provided amount', async () => {
    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      amount: basePayment.amount,
      reason: 'Customer requested refund',
    });

    const response = await POST(request);
    expect(response.ok).toBe(true);

    expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: basePayment.stripePaymentIntentId,
        amount: Math.round(basePayment.amount * 100),
      }),
    );
  });

  it('should create partial refund when amount specified', async () => {
    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      amount: 250,
      reason: 'Partial damage fee',
    });

    await POST(request);

    expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25000,
      }),
    );
  });

  it('should update payment record with new refund totals', async () => {
    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      amount: 250,
      reason: 'Partial damage fee',
    });

    await POST(request);

    expect(updatePayloads[0]).toMatchObject({
      amountRefunded: 250,
      status: 'partially_refunded',
    });
    expect(paymentsUpdateEq).toHaveBeenCalledWith('id', basePayment.id);
  });

  it('should insert audit log for refund', async () => {
    const build = buildSupabase({ payment: basePayment });
    const auditInsert = build.auditInsert;
    mockRequireAdmin.mockResolvedValueOnce({
      supabase: build.supabase,
      user: mockAdmin,
      error: null,
    });

    const request = createMockRequest('POST', {
      paymentId: basePayment.id,
      amount: 100,
      reason: 'Audit test',
    });

    await POST(request);

    expect(auditInsert).toHaveBeenCalled();
  });

  it('should return 404 when payment does not exist', async () => {
    const { supabase } = buildSupabase({ payment: null });
    mockRequireAdmin.mockResolvedValueOnce({
      supabase,
      user: mockAdmin,
      error: null,
    });

    const request = createMockRequest('POST', {
      paymentId: 'missing-payment',
      amount: 250,
      reason: 'Not found',
    });

    const response = await POST(request);

    await expectErrorResponse(response, 404);
  });

  it('should handle Stripe refund errors gracefully', async () => {
    mockStripeInstance.refunds.create.mockRejectedValueOnce(new Error('Refund failed'));

    const response = await POST(
      createMockRequest('POST', {
        paymentId: basePayment.id,
        amount: 250,
        reason: 'Stripe failure',
      }),
    );

    await expectErrorResponse(response, 500, /Stripe error/i);
  });
});

