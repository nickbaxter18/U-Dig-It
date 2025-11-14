import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../place-security-hold/route';
import {
  createMockRequest,
  expectErrorResponse,
  createTestBooking,
  createRateLimiterModuleMock,
  createRequestValidatorModuleMock,
  createMockResponse,
} from '@/test-utils';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const { supabaseRef } = vi.hoisted(() => ({
  supabaseRef: {
    value: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(supabaseRef.value),
}));

const { rateLimiterModule } = vi.hoisted(() => ({
  rateLimiterModule: {
    rateLimit: vi.fn(),
    RateLimitPresets: {
      VERY_STRICT: { maxRequests: 5, windowMs: 60_000 },
      STRICT: { maxRequests: 10, windowMs: 60_000 },
      MODERATE: { maxRequests: 30, windowMs: 60_000 },
      LENIENT: { maxRequests: 100, windowMs: 60_000 },
    },
  },
}));

vi.mock('@/lib/rate-limiter', () => rateLimiterModule);

const { requestValidatorModule } = vi.hoisted(() => ({
  requestValidatorModule: {
    validateRequest: vi.fn(),
    REQUEST_LIMITS: {
      MAX_JSON_SIZE: 1024 * 1024,
      DEFAULT_TIMEOUT: 30_000,
    },
    withTimeout: vi.fn((promise: Promise<unknown>) => promise),
    createSafeResponse: vi.fn((data: unknown, status = 200) => createMockResponse(data, status)),
  },
}));

vi.mock('@/lib/request-validator', () => requestValidatorModule);

const { stripeRef } = vi.hoisted(() => ({
  stripeRef: {
    instance: {
      paymentIntents: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('stripe', () => ({
  default: vi.fn(function StripeMock(this: unknown) {
    return stripeRef.instance;
  }),
}));

let supabaseMock: typeof supabaseRef.value;
let stripeInstance: typeof stripeRef.instance;

const configureSupabase = (
  bookingData: any,
  options: {
    userRole?: string;
    bookingError?: string | null;
    bookingPaymentsError?: string | null;
  } = {}
) => {
  const bookingUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });

  const bookingChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: bookingData,
      error: options.bookingError ? new Error(options.bookingError) : null,
    }),
    update: vi.fn().mockReturnValue({
      eq: bookingUpdateEq,
    }),
  };

  const bookingPaymentsChain = {
    insert: vi.fn().mockResolvedValue(
      options.bookingPaymentsError
        ? { data: null, error: { message: options.bookingPaymentsError } }
        : { data: { id: 'booking-payment-1' }, error: null }
    ),
  };

  const usersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { role: options.userRole ?? 'admin' },
      error: null,
    }),
  };

  supabaseMock.from.mockReset();
  supabaseMock.from.mockImplementation((table: string) => {
    switch (table) {
      case 'bookings':
        return bookingChain;
      case 'booking_payments':
        return bookingPaymentsChain;
      case 'users':
        return usersChain;
      default:
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
    }
  });

  return {
    bookingChain,
    bookingPaymentsChain,
    usersChain,
    bookingUpdateEq,
  };
};

type SupabaseContext = ReturnType<typeof configureSupabase>;

describe('POST /api/stripe/place-security-hold', () => {
  let baseBooking: ReturnType<typeof createTestBooking>;
  let supabaseContext: SupabaseContext;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.INTERNAL_SERVICE_KEY = 'internal-test-key';

    supabaseRef.value = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };
    supabaseMock = supabaseRef.value;

    Object.assign(rateLimiterModule, createRateLimiterModuleMock());
    Object.assign(requestValidatorModule, createRequestValidatorModuleMock());

    stripeRef.instance.paymentIntents.create = vi.fn();
    stripeInstance = stripeRef.instance;

    rateLimiterModule.rateLimit.mockResolvedValue({
      success: true,
      headers: new Headers(),
      reset: Date.now() + 60_000,
    });

    requestValidatorModule.validateRequest.mockResolvedValue({ valid: true });

    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    baseBooking = createTestBooking({
      customerId: mockUser.id,
      stripe_customer_id: 'cus_test',
      stripe_payment_method_id: 'pm_test',
      security_hold_intent_id: null,
      hold_security_amount_cents: 50_000,
    });

    supabaseContext = configureSupabase(baseBooking);

    stripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'secret_test123',
      amount: 50_000,
      status: 'requires_capture',
    });
  });

  describe('Request Guards', () => {
    it('rejects unauthenticated requests', async () => {
      supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      await expectErrorResponse(response, 401);
    });

    it('allows internal service key bypass', async () => {
      supabaseMock.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await POST(
        createMockRequest(
          'POST',
          { bookingId: baseBooking.id },
          { headers: { 'x-internal-service-key': 'internal-test-key' } }
        )
      );

      expect(response.status).toBe(200);
    });

    it('returns 429 when rate limit exceeded', async () => {
      rateLimiterModule.rateLimit.mockResolvedValueOnce({
        success: false,
        headers: new Headers({ 'Retry-After': '45' }),
        reset: Date.now() + 45_000,
      });

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      expect(response.status).toBe(429);
      expect(response.headers.get('retry-after')).toBe('45');
    });

    it('returns validator error when request invalid', async () => {
      requestValidatorModule.validateRequest.mockResolvedValueOnce({
        valid: false,
        error: createMockResponse({ error: 'Invalid payload' }, 415),
      });

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      await expectErrorResponse(response, 415, 'Invalid payload');
    });

    it('rejects requests without bookingId', async () => {
      const response = await POST(createMockRequest('POST', {}));
      await expectErrorResponse(response, 400, /bookingId/i);
    });
  });

  describe('Booking & Authorization', () => {
    it('returns 404 when booking not found', async () => {
      supabaseContext = configureSupabase(null, { bookingError: 'Not found' });

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      await expectErrorResponse(response, 404, 'Booking not found');
    });

    it('rejects when booking belongs to another user', async () => {
      supabaseContext = configureSupabase(
        { ...baseBooking, customerId: 'other-user' },
        { userRole: 'customer' }
      );

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      await expectErrorResponse(response, 403, 'Forbidden - Admin only');
    });

    it('allows admin override for other user bookings', async () => {
      supabaseContext = configureSupabase(
        { ...baseBooking, customerId: 'other-user' },
        { userRole: 'super_admin' }
      );

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      expect(response.status).toBe(200);
    });

    it('rejects when payment method is missing', async () => {
      supabaseContext = configureSupabase({
        ...baseBooking,
        stripe_payment_method_id: null,
      });

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      await expectErrorResponse(response, 400, 'No payment method on file');
    });

    it('returns existing intent when hold already placed', async () => {
      supabaseContext = configureSupabase({
        ...baseBooking,
        security_hold_intent_id: 'pi_existing',
      });

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.intentId).toBe('pi_existing');
      expect(stripeInstance.paymentIntents.create).not.toHaveBeenCalled();
    });
  });

  describe('Security Hold Creation', () => {
    it('creates payment intent and records booking payment', async () => {
      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));

      expect(response.status).toBe(200);
      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledTimes(1);
      expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50_000,
          currency: 'cad',
          customer: 'cus_test',
          payment_method: 'pm_test',
          capture_method: 'manual',
          off_session: true,
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringContaining(baseBooking.id),
        })
      );

      expect(supabaseContext.bookingPaymentsChain.insert).toHaveBeenCalledTimes(1);
      const insertPayload = supabaseContext.bookingPaymentsChain.insert.mock.calls[0][0];
      expect(insertPayload).toMatchObject({
        booking_id: baseBooking.id,
        purpose: 'security_hold',
        amount_cents: 50_000,
        stripe_payment_intent_id: 'pi_test123',
      });

      expect(supabaseContext.bookingUpdateEq).toHaveBeenCalledWith('id', baseBooking.id);
    });

    it('handles Stripe errors gracefully', async () => {
      stripeInstance.paymentIntents.create.mockRejectedValueOnce(new Error('Stripe error'));

      const response = await POST(createMockRequest('POST', { bookingId: baseBooking.id }));
      await expectErrorResponse(response, 500, 'Failed to place security hold');
    });
  });
});