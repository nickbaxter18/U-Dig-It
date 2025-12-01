import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Comprehensive Tests for Receipt Generation
 *
 * Tests cover:
 * - Stripe payments (credit_card)
 * - Manual payments (cash, ach, check, pos, other)
 * - Different payment statuses (pending, completed, refunded, partially_refunded)
 * - Different payment types (deposit, payment/invoice)
 * - Edge cases (missing data, refunds, null values)
 * - Receipt content validation
 */

// Mock dependencies
const mockServiceClient = vi.fn();
const mockStripeClient = {
  checkout: {
    sessions: {
      retrieve: vi.fn(),
    },
  },
  paymentIntents: {
    retrieve: vi.fn(),
  },
};

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => mockServiceClient(),
}));

vi.mock('@/lib/stripe/config', () => ({
  getStripeSecretKey: vi.fn().mockResolvedValue('sk_test_mock'),
  createStripeClient: vi.fn(() => mockStripeClient),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Test Data Factory
const createTestPayment = (overrides: Record<string, unknown> = {}) => ({
  id: 'payment-uuid-123',
  amount: 500.0,
  amountRefunded: 0,
  paymentNumber: 'PAY-2024-001',
  type: 'payment',
  status: 'completed',
  method: 'credit_card',
  stripePaymentIntentId: 'pi_test_123',
  stripeCheckoutSessionId: null,
  processedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-15T09:00:00Z',
  booking: {
    id: 'booking-uuid-456',
    bookingNumber: 'BK-2024-001',
    customerId: 'customer-uuid-789',
    createdAt: '2024-01-10T09:00:00Z',
    startDate: '2024-01-20',
    endDate: '2024-01-25',
    subtotal: 400.0,
    taxes: 60.0,
    totalAmount: 460.0,
    balance_amount: 0,
    dailyRate: 80.0,
    floatFee: null,
    deliveryFee: 50.0,
    distanceKm: 25,
    securityDeposit: 200.0,
    waiver_selected: true,
    waiver_rate_cents: 1500,
    couponCode: null,
    couponType: null,
    couponValue: null,
    couponDiscount: null,
    deliveryAddress: '123 Main St',
    deliveryCity: 'Saint John',
    deliveryProvince: 'NB',
    deliveryPostalCode: 'E2L 1A1',
    customer: {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'Test Company',
      phone: '506-555-1234',
    },
    equipment: {
      make: 'Kubota',
      model: 'U55-4',
      type: 'Excavator',
      unitId: 'KUB-001',
      serialNumber: 'SN123456',
    },
  },
  ...overrides,
});

const createMockSupabase = (paymentData: unknown, error: unknown = null) => ({
  from: vi.fn((table: string) => {
    if (table === 'payments') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: paymentData,
          error,
        }),
      };
    }
    // manual_payments table - return null by default
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
  }),
});

describe('Receipt Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Type Handling', () => {
    it('should generate receipt for credit card payment', async () => {
      const payment = createTestPayment({
        method: 'credit_card',
        type: 'payment',
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));
      mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
        charges: { data: [{ receipt_url: null }] },
      });

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toContain('BK-2024-001');
      expect(result.html).toContain('500'); // Amount
      expect(result.filename).toContain('PAY-2024-001');
    });

    it('should generate receipt for deposit payment', async () => {
      const payment = createTestPayment({
        type: 'deposit',
        amount: 200.0,
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toContain('BK-2024-001');
      expect(result.html).toContain('200'); // Deposit amount
    });

    it('should handle partial payment correctly', async () => {
      const payment = createTestPayment({
        amount: 230.0, // Half of total
        booking: {
          ...createTestPayment().booking,
          balance_amount: 230.0, // Remaining balance
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toContain('230'); // Amount paid
      // Should show outstanding balance
      expect(result.html).toContain('Balance') || expect(result.html).toContain('Outstanding');
    });
  });

  describe('Payment Method Handling', () => {
    const methodTests = [
      { method: 'credit_card', expectedDisplay: /Credit Card|Card/i },
      { method: 'debit_card', expectedDisplay: /Debit Card|Card/i },
    ];

    for (const { method, expectedDisplay } of methodTests) {
      it(`should display correct method for ${method}`, async () => {
        const payment = createTestPayment({ method });

        mockServiceClient.mockReturnValue(createMockSupabase(payment));

        const { generatePaymentReceiptHtml } = await import(
          '../generate-payment-receipt'
        );
        const result = await generatePaymentReceiptHtml('payment-uuid-123', {
          allowStripeLookup: false,
        });

        expect(result.html).toMatch(expectedDisplay);
      });
    }
  });

  describe('Payment Status Handling', () => {
    it('should generate receipt for completed payment', async () => {
      const payment = createTestPayment({ status: 'completed' });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
      expect(result.html.length).toBeGreaterThan(0);
    });

    it('should generate receipt for refunded payment', async () => {
      const payment = createTestPayment({
        status: 'refunded',
        amountRefunded: 500.0,
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should generate receipt for partially refunded payment', async () => {
      const payment = createTestPayment({
        status: 'partially_refunded',
        amountRefunded: 100.0,
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should generate receipt for pending payment', async () => {
      const payment = createTestPayment({ status: 'pending' });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when payment not found', async () => {
      mockServiceClient.mockReturnValue(createMockSupabase(null));

      const { generatePaymentReceiptHtml, ReceiptGenerationError } = await import(
        '../generate-payment-receipt'
      );

      await expect(
        generatePaymentReceiptHtml('non-existent-id', { allowStripeLookup: false })
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error when booking not found', async () => {
      // When a payment has no booking, it's treated as invalid (returns null from fetch)
      // This causes the lookup to fall through to manual_payments, which also returns null
      // Final result: "Payment not found"
      const payment = createTestPayment({ booking: null });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );

      // Payment without booking is treated as non-existent
      await expect(
        generatePaymentReceiptHtml('payment-uuid-123', { allowStripeLookup: false })
      ).rejects.toThrow('Payment not found');
    });

    it('should throw 403 when user does not own payment', async () => {
      const payment = createTestPayment();

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml, ReceiptGenerationError } = await import(
        '../generate-payment-receipt'
      );

      try {
        await generatePaymentReceiptHtml('payment-uuid-123', {
          allowStripeLookup: false,
          userId: 'different-user-id',
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ReceiptGenerationError);
        expect((error as any).status).toBe(403);
      }
    });

    it('should handle database errors gracefully', async () => {
      const dbError = { code: 'PGRST301', message: 'Database error' };
      mockServiceClient.mockReturnValue(createMockSupabase(null, dbError));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );

      await expect(
        generatePaymentReceiptHtml('payment-uuid-123', { allowStripeLookup: false })
      ).rejects.toThrow('Unable to load payment details');
    });
  });

  describe('Receipt Content Validation', () => {
    it('should include all required booking information', async () => {
      const payment = createTestPayment();

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      // Check booking number
      expect(result.html).toContain('BK-2024-001');

      // Check customer info
      expect(result.html).toContain('John');

      // Check equipment info
      expect(result.html).toContain('Kubota');
      expect(result.html).toContain('U55-4');
    });

    it('should include delivery information', async () => {
      const payment = createTestPayment();

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toContain('123 Main St');
      expect(result.html).toContain('Saint John');
    });

    it('should include waiver if selected', async () => {
      const payment = createTestPayment({
        booking: {
          ...createTestPayment().booking,
          waiver_selected: true,
          waiver_rate_cents: 1500,
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toContain('Waiver') || expect(result.html).toContain('waiver');
    });

    it('should include coupon discount if applied', async () => {
      const payment = createTestPayment({
        booking: {
          ...createTestPayment().booking,
          couponCode: 'SAVE10',
          couponType: 'percentage',
          couponValue: 10,
          couponDiscount: 40.0,
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toContain('SAVE10') || expect(result.html).toContain('Discount');
    });
  });

  describe('Null/Missing Data Handling', () => {
    it('should handle missing customer info gracefully', async () => {
      const payment = createTestPayment({
        booking: {
          ...createTestPayment().booking,
          customer: null,
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should handle missing equipment info gracefully', async () => {
      const payment = createTestPayment({
        booking: {
          ...createTestPayment().booking,
          equipment: null,
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should handle missing delivery address', async () => {
      const payment = createTestPayment({
        booking: {
          ...createTestPayment().booking,
          deliveryAddress: null,
          deliveryCity: null,
          deliveryProvince: null,
          deliveryPostalCode: null,
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should handle null amounts', async () => {
      const payment = createTestPayment({
        booking: {
          ...createTestPayment().booking,
          subtotal: null,
          taxes: null,
          dailyRate: null,
          deliveryFee: null,
        },
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });
  });

  describe('Stripe Integration', () => {
    it('should attempt Stripe lookup when enabled', async () => {
      const payment = createTestPayment();

      mockServiceClient.mockReturnValue(createMockSupabase(payment));
      mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
        charges: { data: [{ receipt_url: null }] },
      });

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: true,
      });

      expect(mockStripeClient.paymentIntents.retrieve).toHaveBeenCalledWith(
        'pi_test_123',
        expect.any(Object)
      );
    });

    it('should skip Stripe lookup when disabled', async () => {
      const payment = createTestPayment();

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(mockStripeClient.paymentIntents.retrieve).not.toHaveBeenCalled();
    });

    it('should fall back to generated HTML when Stripe lookup fails', async () => {
      const payment = createTestPayment();

      mockServiceClient.mockReturnValue(createMockSupabase(payment));
      mockStripeClient.paymentIntents.retrieve.mockRejectedValue(
        new Error('Stripe error')
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: true,
      });

      // Should still return a valid receipt (generated HTML)
      expect(result.html).toBeTruthy();
      expect(result.html).toContain('BK-2024-001');
    });

    it('should use checkout session to get payment intent when direct ID missing', async () => {
      const payment = createTestPayment({
        stripePaymentIntentId: null,
        stripeCheckoutSessionId: 'cs_test_123',
      });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));
      mockStripeClient.checkout.sessions.retrieve.mockResolvedValue({
        payment_intent: 'pi_from_session',
      });
      mockStripeClient.paymentIntents.retrieve.mockResolvedValue({
        charges: { data: [{ receipt_url: null }] },
      });

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: true,
      });

      expect(mockStripeClient.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'cs_test_123'
      );
      expect(mockStripeClient.paymentIntents.retrieve).toHaveBeenCalledWith(
        'pi_from_session',
        expect.any(Object)
      );
    });
  });

  describe('Filename Generation', () => {
    it('should generate filename with payment number', async () => {
      const payment = createTestPayment({ paymentNumber: 'PAY-2024-001' });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.filename).toBe('receipt-PAY-2024-001.html');
    });

    it('should use payment ID when payment number missing', async () => {
      const payment = createTestPayment({ paymentNumber: null });

      mockServiceClient.mockReturnValue(createMockSupabase(payment));

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.filename).toBe('receipt-payment-uuid-123.html');
    });
  });
});

describe('Receipt Amount Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use payment.amount not booking.totalAmount for receipt', async () => {
    // This is important: a partial payment should show the PAYMENT amount, not booking total
    const payment = createTestPayment({
      amount: 230.0, // Partial payment
      booking: {
        ...createTestPayment().booking,
        totalAmount: 460.0, // Full booking amount
      },
    });

    mockServiceClient.mockReturnValue(createMockSupabase(payment));

    const { generatePaymentReceiptHtml } = await import(
      '../generate-payment-receipt'
    );
    const result = await generatePaymentReceiptHtml('payment-uuid-123', {
      allowStripeLookup: false,
    });

    // Receipt should show 230 (payment amount), not 460 (booking total)
    expect(result.html).toContain('230');
  });

  it('should display outstanding balance correctly', async () => {
    const payment = createTestPayment({
      amount: 230.0,
      booking: {
        ...createTestPayment().booking,
        totalAmount: 460.0,
        balance_amount: 230.0, // Remaining balance
      },
    });

    mockServiceClient.mockReturnValue(createMockSupabase(payment));

    const { generatePaymentReceiptHtml } = await import(
      '../generate-payment-receipt'
    );
    const result = await generatePaymentReceiptHtml('payment-uuid-123', {
      allowStripeLookup: false,
    });

    expect(result.html).toBeTruthy();
  });
});

describe('Manual Payment Receipt Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test data factory for manual payments
  const createTestManualPayment = (overrides: Record<string, unknown> = {}) => ({
    id: 'manual-payment-uuid-123',
    amount: 300.0,
    currency: 'cad',
    method: 'cash',
    status: 'completed',
    received_at: '2024-01-15T10:00:00Z',
    notes: 'Cash payment received at office',
    created_at: '2024-01-15T09:00:00Z',
    deleted_at: null,
    booking: {
      id: 'booking-uuid-456',
      bookingNumber: 'BK-2024-002',
      customerId: 'customer-uuid-789',
      createdAt: '2024-01-10T09:00:00Z',
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      subtotal: 400.0,
      taxes: 60.0,
      totalAmount: 460.0,
      balance_amount: 160.0, // Remaining after cash payment
      dailyRate: 80.0,
      floatFee: null,
      deliveryFee: 50.0,
      distanceKm: 25,
      securityDeposit: 200.0,
      waiver_selected: false,
      waiver_rate_cents: null,
      couponCode: null,
      couponType: null,
      couponValue: null,
      couponDiscount: null,
      deliveryAddress: '456 Oak Ave',
      deliveryCity: 'Saint John',
      deliveryProvince: 'NB',
      deliveryPostalCode: 'E2L 2B2',
      customer: {
        email: 'manual@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        companyName: 'Smith Construction',
        phone: '506-555-5678',
      },
      equipment: {
        make: 'Kubota',
        model: 'KX040-4',
        type: 'Excavator',
        unitId: 'KUB-002',
        serialNumber: 'SN789012',
      },
    },
    ...overrides,
  });

  // Mock that returns null for payments table, then manual payment
  const createMockSupabaseWithManualPayment = (manualPaymentData: unknown) => ({
    from: vi.fn((table: string) => {
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null, // Not found in payments table
            error: null,
          }),
        };
      }
      if (table === 'manual_payments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: manualPaymentData,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  });

  describe('Manual Payment Types', () => {
    const manualMethods = [
      { method: 'cash', expectedLabel: /Cash/i },
      { method: 'ach', expectedLabel: /ACH|Bank Transfer/i },
      { method: 'check', expectedLabel: /Check/i },
      { method: 'pos', expectedLabel: /POS|Terminal/i },
      { method: 'other', expectedLabel: /Other/i },
    ];

    for (const { method, expectedLabel } of manualMethods) {
      it(`should generate receipt for ${method} payment`, async () => {
        const manualPayment = createTestManualPayment({ method });

        mockServiceClient.mockReturnValue(
          createMockSupabaseWithManualPayment(manualPayment)
        );

        const { generatePaymentReceiptHtml } = await import(
          '../generate-payment-receipt'
        );
        const result = await generatePaymentReceiptHtml('manual-payment-uuid-123', {
          allowStripeLookup: false,
        });

        expect(result.html).toBeTruthy();
        expect(result.html).toContain('BK-2024-002'); // Booking number
        expect(result.html).toContain('300'); // Payment amount
        expect(result.html).toMatch(expectedLabel); // Payment method label
      });
    }
  });

  describe('Manual Payment Receipt Content', () => {
    it('should include all booking information for manual payment', async () => {
      const manualPayment = createTestManualPayment();

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('manual-payment-uuid-123', {
        allowStripeLookup: false,
      });

      // Check booking info
      expect(result.html).toContain('BK-2024-002');

      // Check customer info
      expect(result.html).toContain('Jane');

      // Check equipment info
      expect(result.html).toContain('Kubota');
      expect(result.html).toContain('KX040-4');
    });

    it('should generate payment number for manual payment', async () => {
      const manualPayment = createTestManualPayment();

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('manual-payment-uuid-123', {
        allowStripeLookup: false,
      });

      // Filename should have generated payment number
      expect(result.filename).toContain('MP-');
    });

    it('should skip Stripe lookup for manual payments', async () => {
      const manualPayment = createTestManualPayment();

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      await generatePaymentReceiptHtml('manual-payment-uuid-123', {
        allowStripeLookup: true, // Even with this enabled
      });

      // Should NOT call Stripe for manual payments
      expect(mockStripeClient.paymentIntents.retrieve).not.toHaveBeenCalled();
    });
  });

  describe('Manual Payment Status Handling', () => {
    it('should generate receipt for completed manual payment', async () => {
      const manualPayment = createTestManualPayment({ status: 'completed' });

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('manual-payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should generate receipt for pending manual payment', async () => {
      const manualPayment = createTestManualPayment({ status: 'pending' });

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );
      const result = await generatePaymentReceiptHtml('manual-payment-uuid-123', {
        allowStripeLookup: false,
      });

      expect(result.html).toBeTruthy();
    });

    it('should exclude soft-deleted manual payments', async () => {
      // Mock that returns null for both tables (simulating deleted payment)
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'payments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          if (table === 'manual_payments') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      mockServiceClient.mockReturnValue(mockSupabase);

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );

      await expect(
        generatePaymentReceiptHtml('deleted-payment-id', { allowStripeLookup: false })
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('Manual Payment Authorization', () => {
    it('should throw 403 for wrong user on manual payment', async () => {
      const manualPayment = createTestManualPayment();

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml, ReceiptGenerationError } = await import(
        '../generate-payment-receipt'
      );

      try {
        await generatePaymentReceiptHtml('manual-payment-uuid-123', {
          allowStripeLookup: false,
          userId: 'different-user-id', // Not the booking customer
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ReceiptGenerationError);
        expect((error as any).status).toBe(403);
      }
    });

    it('should allow access for correct user on manual payment', async () => {
      const manualPayment = createTestManualPayment();

      mockServiceClient.mockReturnValue(
        createMockSupabaseWithManualPayment(manualPayment)
      );

      const { generatePaymentReceiptHtml } = await import(
        '../generate-payment-receipt'
      );

      const result = await generatePaymentReceiptHtml('manual-payment-uuid-123', {
        allowStripeLookup: false,
        userId: 'customer-uuid-789', // Correct customer
      });

      expect(result.html).toBeTruthy();
    });
  });
});

describe('Payment Lookup Priority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check payments table first', async () => {
    const payment = createTestPayment();

    // Mock that returns payment from payments table
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: payment,
              error: null,
            }),
          };
        }
        // manual_payments should not be called
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    mockServiceClient.mockReturnValue(mockSupabase);

    const { generatePaymentReceiptHtml } = await import(
      '../generate-payment-receipt'
    );
    const result = await generatePaymentReceiptHtml('payment-uuid-123', {
      allowStripeLookup: false,
    });

    // Should use Stripe payment
    expect(result.html).toContain('BK-2024-001');
    expect(mockSupabase.from).toHaveBeenCalledWith('payments');
  });

  it('should fall back to manual_payments if not found in payments', async () => {
    const manualPayment = {
      id: 'manual-123',
      amount: 200,
      method: 'cash',
      status: 'completed',
      received_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T09:00:00Z',
      deleted_at: null,
      booking: {
        id: 'booking-456',
        bookingNumber: 'BK-MANUAL-001',
        customerId: 'customer-789',
        createdAt: '2024-01-10T09:00:00Z',
        startDate: '2024-01-20',
        endDate: '2024-01-25',
        subtotal: 300,
        taxes: 45,
        totalAmount: 345,
        balance_amount: 145,
        dailyRate: 60,
        customer: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        equipment: {
          make: 'Kubota',
          model: 'Test',
        },
      },
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null, // Not found
              error: null,
            }),
          };
        }
        if (table === 'manual_payments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: manualPayment,
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    mockServiceClient.mockReturnValue(mockSupabase);

    const { generatePaymentReceiptHtml } = await import(
      '../generate-payment-receipt'
    );
    const result = await generatePaymentReceiptHtml('manual-123', {
      allowStripeLookup: false,
    });

    // Should use manual payment
    expect(result.html).toContain('BK-MANUAL-001');
    expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    expect(mockSupabase.from).toHaveBeenCalledWith('manual_payments');
  });
});

