/**
 * Stripe Integration Tests
 * Validates Stripe payment configuration and security holds
 */

import { describe, it, expect } from 'vitest';
import Stripe from 'stripe';
import { createStripeClient, STRIPE_API_VERSION } from '@/lib/stripe/config';

const asStripeMode = (key: string | undefined): 'test' | 'live' | 'unknown' => {
  if (!key) return 'unknown';
  if (key.includes('_test_') || key.includes('_test')) return 'test';
  if (key.includes('_live_') || key.includes('_live')) return 'live';
  return 'unknown';
};

describe('Stripe Integration', () => {
  describe('Configuration', () => {
    it('should have Stripe publishable key configured', () => {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      expect(publishableKey).toBeTruthy();
      expect(publishableKey).toMatch(/^pk_[a-z]+_/);
    });

    it('should have Stripe secret key configured', () => {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      expect(secretKey).toBeTruthy();
      expect(secretKey).toMatch(/^(sk|rk)_[a-z]+_/);
    });

    it('should have webhook secret configured', () => {
      expect(process.env.STRIPE_WEBHOOK_SECRET).toBeTruthy();
      expect(process.env.STRIPE_WEBHOOK_SECRET).toContain('whsec_');
    });

    it('should report configured Stripe mode', () => {
      const secretMode = asStripeMode(process.env.STRIPE_SECRET_KEY);
      const publishableMode = asStripeMode(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      expect(['test', 'live', 'unknown']).toContain(secretMode);
      expect(['test', 'live', 'unknown']).toContain(publishableMode);
      expect(secretMode === 'unknown' ? publishableMode : secretMode).toBe(publishableMode === 'unknown' ? secretMode : publishableMode);
    });
  });

  describe('Stripe Client Initialization', () => {
    it('should create Stripe client without errors', () => {
      expect(() => {
        const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY!);
        expect(stripe).toBeDefined();
      }).not.toThrow();
    });

    it('should use the expected API version', () => {
      const stripe = createStripeClient('sk_test_placeholder');
      expect(stripe.getApiField('version')).toBe(STRIPE_API_VERSION);
    });
  });

  describe('Payment Intent Creation', () => {
    it('should have payment intent endpoint', async () => {
      // This requires authentication, so we expect 401
      const response = await fetch('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking-id',
          amount: 500,
        }),
      });

      // Should return 401 (unauthorized) since we're not authenticated
      expect(response.status).toBe(401);
    });
  });

  describe('Security Hold Endpoints', () => {
    it('should have verify hold endpoint', async () => {
      const response = await fetch('http://localhost:3000/api/stripe/place-verify-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking-id',
        }),
      });

      // Should return 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
    });

    it('should have security hold endpoint', async () => {
      const response = await fetch('http://localhost:3000/api/stripe/place-security-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking-id',
        }),
      });

      // Should return 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
    });

    it('should have release hold endpoint', async () => {
      const response = await fetch('http://localhost:3000/api/stripe/release-security-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: 'test-booking-id',
        }),
      });

      // Should return 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Webhook Handling', () => {
    it('should have Stripe webhook endpoint', async () => {
      const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' }),
      });

      // Webhook will fail signature verification, but endpoint should exist
      expect([400, 500]).toContain(response.status);
    });
  });
});


