import { describe, expect, it } from 'vitest';

/**
 * Unit Tests for Payment Business Logic
 *
 * Tests cover:
 * - Refund amount calculations
 * - Payment status transitions
 * - Balance calculations
 * - Financial calculations
 */

// Type definitions for tests
interface Payment {
  id: string;
  amount: number;
  amountRefunded: number;
  status: PaymentStatus;
}

type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'partially_refunded'
  | 'refunded'
  | 'cancelled';

// Business logic functions to test
function calculateMaxRefundable(payment: Payment): number {
  return Math.max(payment.amount - payment.amountRefunded, 0);
}

function determineStatusAfterRefund(
  originalAmount: number,
  totalRefunded: number
): PaymentStatus {
  if (totalRefunded >= originalAmount) {
    return 'refunded';
  }
  if (totalRefunded > 0) {
    return 'partially_refunded';
  }
  return 'succeeded';
}

function isValidRefundAmount(
  amount: number,
  maxRefundable: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Refund amount must be greater than 0' };
  }
  if (amount > maxRefundable) {
    return {
      valid: false,
      error: `Maximum refundable amount is $${maxRefundable.toFixed(2)}`,
    };
  }
  return { valid: true };
}

function calculateBookingBalance(
  totalAmount: number,
  paidAmount: number,
  refundedAmount: number
): number {
  return Math.max(totalAmount - paidAmount + refundedAmount, 0);
}

function determineBillingStatus(
  balance: number,
  totalAmount: number
): 'pending' | 'partial' | 'paid' | 'refunded' {
  if (balance === 0) {
    return 'paid';
  }
  if (balance === totalAmount) {
    return 'pending';
  }
  if (balance > totalAmount) {
    return 'refunded';
  }
  return 'partial';
}

function convertToCents(amount: number): number {
  return Math.round(amount * 100);
}

function convertFromCents(cents: number): number {
  return cents / 100;
}

// Tests
describe('Payment Calculations', () => {
  describe('calculateMaxRefundable', () => {
    it('should return full amount when nothing refunded', () => {
      const payment: Payment = {
        id: '1',
        amount: 500,
        amountRefunded: 0,
        status: 'succeeded',
      };
      expect(calculateMaxRefundable(payment)).toBe(500);
    });

    it('should return remaining amount after partial refund', () => {
      const payment: Payment = {
        id: '1',
        amount: 500,
        amountRefunded: 200,
        status: 'partially_refunded',
      };
      expect(calculateMaxRefundable(payment)).toBe(300);
    });

    it('should return 0 when fully refunded', () => {
      const payment: Payment = {
        id: '1',
        amount: 500,
        amountRefunded: 500,
        status: 'refunded',
      };
      expect(calculateMaxRefundable(payment)).toBe(0);
    });

    it('should handle over-refunded edge case gracefully', () => {
      const payment: Payment = {
        id: '1',
        amount: 500,
        amountRefunded: 600,
        status: 'refunded',
      };
      expect(calculateMaxRefundable(payment)).toBe(0);
    });

    it('should handle decimal amounts correctly', () => {
      const payment: Payment = {
        id: '1',
        amount: 499.99,
        amountRefunded: 199.99,
        status: 'partially_refunded',
      };
      expect(calculateMaxRefundable(payment)).toBeCloseTo(300, 2);
    });
  });

  describe('determineStatusAfterRefund', () => {
    it('should return refunded when fully refunded', () => {
      expect(determineStatusAfterRefund(500, 500)).toBe('refunded');
    });

    it('should return partially_refunded when partially refunded', () => {
      expect(determineStatusAfterRefund(500, 200)).toBe('partially_refunded');
    });

    it('should return succeeded when no refund', () => {
      expect(determineStatusAfterRefund(500, 0)).toBe('succeeded');
    });

    it('should handle refund exceeding original amount', () => {
      expect(determineStatusAfterRefund(500, 600)).toBe('refunded');
    });

    it('should handle very small partial refunds', () => {
      expect(determineStatusAfterRefund(500, 0.01)).toBe('partially_refunded');
    });
  });

  describe('isValidRefundAmount', () => {
    it('should reject zero amount', () => {
      const result = isValidRefundAmount(0, 500);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should reject negative amount', () => {
      const result = isValidRefundAmount(-100, 500);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should reject amount exceeding max refundable', () => {
      const result = isValidRefundAmount(600, 500);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('$500.00');
    });

    it('should accept valid amount', () => {
      const result = isValidRefundAmount(250, 500);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept amount equal to max refundable', () => {
      const result = isValidRefundAmount(500, 500);
      expect(result.valid).toBe(true);
    });

    it('should format max amount with 2 decimal places', () => {
      const result = isValidRefundAmount(600, 499.99);
      expect(result.error).toContain('$499.99');
    });
  });
});

describe('Balance Calculations', () => {
  describe('calculateBookingBalance', () => {
    it('should return full amount when nothing paid', () => {
      expect(calculateBookingBalance(1000, 0, 0)).toBe(1000);
    });

    it('should return 0 when fully paid', () => {
      expect(calculateBookingBalance(1000, 1000, 0)).toBe(0);
    });

    it('should return remaining balance after partial payment', () => {
      expect(calculateBookingBalance(1000, 300, 0)).toBe(700);
    });

    it('should add back refunded amount', () => {
      expect(calculateBookingBalance(1000, 1000, 200)).toBe(200);
    });

    it('should handle complex scenario', () => {
      // Total: 1000, Paid: 800, Refunded: 100
      // Balance: 1000 - 800 + 100 = 300
      expect(calculateBookingBalance(1000, 800, 100)).toBe(300);
    });

    it('should not return negative balance', () => {
      // Over-payment scenario
      expect(calculateBookingBalance(1000, 1500, 0)).toBe(0);
    });
  });

  describe('determineBillingStatus', () => {
    it('should return paid when balance is 0', () => {
      expect(determineBillingStatus(0, 1000)).toBe('paid');
    });

    it('should return pending when balance equals total', () => {
      expect(determineBillingStatus(1000, 1000)).toBe('pending');
    });

    it('should return partial when partially paid', () => {
      expect(determineBillingStatus(300, 1000)).toBe('partial');
    });

    it('should return refunded when balance exceeds total', () => {
      expect(determineBillingStatus(1200, 1000)).toBe('refunded');
    });
  });
});

describe('Currency Conversion', () => {
  describe('convertToCents', () => {
    it('should convert dollars to cents', () => {
      expect(convertToCents(10)).toBe(1000);
    });

    it('should handle decimal amounts', () => {
      expect(convertToCents(10.5)).toBe(1050);
    });

    it('should round to nearest cent', () => {
      expect(convertToCents(10.999)).toBe(1100);
    });

    it('should handle floating point precision', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      expect(convertToCents(0.1 + 0.2)).toBe(30);
    });

    it('should handle zero', () => {
      expect(convertToCents(0)).toBe(0);
    });
  });

  describe('convertFromCents', () => {
    it('should convert cents to dollars', () => {
      expect(convertFromCents(1000)).toBe(10);
    });

    it('should handle fractional cents', () => {
      expect(convertFromCents(1050)).toBe(10.5);
    });

    it('should handle zero', () => {
      expect(convertFromCents(0)).toBe(0);
    });
  });
});

describe('Payment Status Transitions', () => {
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ['succeeded', 'failed', 'cancelled'],
    succeeded: ['partially_refunded', 'refunded'],
    failed: ['pending'], // Can retry
    partially_refunded: ['refunded'],
    refunded: [], // Terminal state
    cancelled: [], // Terminal state
  };

  function isValidTransition(
    from: PaymentStatus,
    to: PaymentStatus
  ): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  describe('Valid transitions', () => {
    it('pending -> succeeded is valid', () => {
      expect(isValidTransition('pending', 'succeeded')).toBe(true);
    });

    it('pending -> failed is valid', () => {
      expect(isValidTransition('pending', 'failed')).toBe(true);
    });

    it('succeeded -> partially_refunded is valid', () => {
      expect(isValidTransition('succeeded', 'partially_refunded')).toBe(true);
    });

    it('succeeded -> refunded is valid', () => {
      expect(isValidTransition('succeeded', 'refunded')).toBe(true);
    });

    it('partially_refunded -> refunded is valid', () => {
      expect(isValidTransition('partially_refunded', 'refunded')).toBe(true);
    });

    it('failed -> pending is valid (retry)', () => {
      expect(isValidTransition('failed', 'pending')).toBe(true);
    });
  });

  describe('Invalid transitions', () => {
    it('refunded -> any is invalid (terminal state)', () => {
      expect(isValidTransition('refunded', 'pending')).toBe(false);
      expect(isValidTransition('refunded', 'succeeded')).toBe(false);
    });

    it('cancelled -> any is invalid (terminal state)', () => {
      expect(isValidTransition('cancelled', 'pending')).toBe(false);
      expect(isValidTransition('cancelled', 'succeeded')).toBe(false);
    });

    it('succeeded -> pending is invalid', () => {
      expect(isValidTransition('succeeded', 'pending')).toBe(false);
    });

    it('partially_refunded -> succeeded is invalid', () => {
      expect(isValidTransition('partially_refunded', 'succeeded')).toBe(false);
    });
  });
});

describe('Financial Report Calculations', () => {
  interface PaymentRecord {
    amount: number;
    amountRefunded: number;
    status: PaymentStatus;
    method: string;
  }

  function calculateTotalRevenue(payments: PaymentRecord[]): number {
    return payments
      .filter((p) => p.status === 'succeeded' || p.status === 'partially_refunded')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  function calculateTotalRefunds(payments: PaymentRecord[]): number {
    return payments.reduce((sum, p) => sum + (p.amountRefunded || 0), 0);
  }

  function calculateNetRevenue(payments: PaymentRecord[]): number {
    return calculateTotalRevenue(payments) - calculateTotalRefunds(payments);
  }

  function calculateSuccessRate(payments: PaymentRecord[]): number {
    const total = payments.length;
    if (total === 0) return 0;
    const successful = payments.filter(
      (p) => p.status === 'succeeded' || p.status === 'partially_refunded' || p.status === 'refunded'
    ).length;
    return (successful / total) * 100;
  }

  function calculatePaymentMethodBreakdown(
    payments: PaymentRecord[]
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const p of payments) {
      breakdown[p.method] = (breakdown[p.method] || 0) + p.amount;
    }
    return breakdown;
  }

  const samplePayments: PaymentRecord[] = [
    { amount: 500, amountRefunded: 0, status: 'succeeded', method: 'card' },
    { amount: 300, amountRefunded: 100, status: 'partially_refunded', method: 'card' },
    { amount: 200, amountRefunded: 0, status: 'failed', method: 'bank_transfer' },
    { amount: 400, amountRefunded: 400, status: 'refunded', method: 'card' },
    { amount: 150, amountRefunded: 0, status: 'succeeded', method: 'bank_transfer' },
  ];

  describe('calculateTotalRevenue', () => {
    it('should sum succeeded and partially_refunded payments', () => {
      // 500 + 300 + 150 = 950 (excludes failed and fully refunded)
      expect(calculateTotalRevenue(samplePayments)).toBe(950);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalRevenue([])).toBe(0);
    });

    it('should return 0 when all payments failed', () => {
      const failedPayments: PaymentRecord[] = [
        { amount: 500, amountRefunded: 0, status: 'failed', method: 'card' },
      ];
      expect(calculateTotalRevenue(failedPayments)).toBe(0);
    });
  });

  describe('calculateTotalRefunds', () => {
    it('should sum all refunded amounts', () => {
      // 0 + 100 + 0 + 400 + 0 = 500
      expect(calculateTotalRefunds(samplePayments)).toBe(500);
    });

    it('should return 0 when no refunds', () => {
      const noRefunds: PaymentRecord[] = [
        { amount: 500, amountRefunded: 0, status: 'succeeded', method: 'card' },
      ];
      expect(calculateTotalRefunds(noRefunds)).toBe(0);
    });
  });

  describe('calculateNetRevenue', () => {
    it('should calculate revenue minus refunds', () => {
      // 950 - 500 = 450
      expect(calculateNetRevenue(samplePayments)).toBe(450);
    });
  });

  describe('calculateSuccessRate', () => {
    it('should calculate percentage of successful payments', () => {
      // 4 out of 5 (succeeded, partially_refunded, refunded count as successful)
      expect(calculateSuccessRate(samplePayments)).toBe(80);
    });

    it('should return 0 for empty array', () => {
      expect(calculateSuccessRate([])).toBe(0);
    });
  });

  describe('calculatePaymentMethodBreakdown', () => {
    it('should group amounts by payment method', () => {
      const breakdown = calculatePaymentMethodBreakdown(samplePayments);
      expect(breakdown.card).toBe(1200); // 500 + 300 + 400
      expect(breakdown.bank_transfer).toBe(350); // 200 + 150
    });
  });
});

