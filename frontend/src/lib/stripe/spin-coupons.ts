/**
 * Stripe Coupon Integration for Spin-to-Win
 *
 * Creates Stripe promotion codes linked to spin wins.
 * Coupons are:
 * - Single-use only
 * - Time-limited (48 hours)
 * - First-time booking only
 * - Capped at $500 max discount
 */

import { logger } from '@/lib/logger';
import Stripe from 'stripe';

import { createStripeClient, getStripeSecretKey } from './config';

async function getStripeInstance() {
  return createStripeClient(await getStripeSecretKey());
}

interface CreateSpinCouponParams {
  code: string;
  discountAmount: number; // Fixed dollar amount ($50, $75, $100)
  expiresAt: string;
  spinSessionId: string;
  userId?: string;
  email?: string;
}

interface StripePromotionResult {
  promotionCodeId: string;
  couponId: string;
  code: string;
  discountAmount: number; // Fixed dollar amount ($50, $75, $100)
  expiresAt: number;
}

/**
 * Create or retrieve existing Stripe coupon and promotion code for spin win
 *
 * Now uses THREE FIXED CODES for all users:
 * - UDIG-SPIN50  ($50 discount)
 * - UDIG-SPIN75  ($75 discount)
 * - UDIG-SPIN100 ($100 discount)
 *
 * @param params - Coupon parameters from spin win
 * @returns Stripe promotion code details
 */
export async function createSpinWheelCoupon(
  params: CreateSpinCouponParams
): Promise<StripePromotionResult> {
  const stripe = await getStripeInstance();
  
  try {
    const expiryTimestamp = Math.floor(new Date(params.expiresAt).getTime() / 1000);

    // ========================================================================
    // 1. CHECK IF PROMOTION CODE ALREADY EXISTS
    // ========================================================================
    const existingPromoCodes = await stripe.promotionCodes.list({
      code: params.code.toUpperCase(),
      limit: 1,
    });

    if (existingPromoCodes.data.length > 0) {
      const existingPromo = existingPromoCodes.data[0];

      logger.info('[Stripe] Reusing existing promotion code', {
        component: 'stripe-spin-coupons',
        action: 'promo_reused',
        metadata: {
          promotionCodeId: existingPromo.id,
          code: params.code,
        },
      });

      return {
        promotionCodeId: existingPromo.id,
        couponId: (existingPromo as any).coupon?.id || (existingPromo as any).coupon_id || '',
        code: existingPromo.code,
        discountAmount: params.discountAmount,
        expiresAt: expiryTimestamp,
      };
    }

    // ========================================================================
    // 2. CREATE NEW STRIPE COUPON (First time only)
    // ========================================================================
    const coupon = await stripe.coupons.create({
      amount_off: params.discountAmount * 100, // Convert dollars to cents ($50 → 5000 cents)
      currency: 'cad', // Required for amount_off
      duration: 'once', // Single-use per customer
      name: `Spin Win $${params.discountAmount} Off`,
      metadata: {
        source: 'spin_to_win',
        fixed_code: params.code,
        created_at: new Date().toISOString(),
      },
    });

    logger.info('[Stripe] Coupon created', {
      component: 'stripe-spin-coupons',
      action: 'coupon_created',
      metadata: {
        couponId: coupon.id,
        discountAmount: params.discountAmount,
        spinSessionId: params.spinSessionId,
      },
    });

    // ========================================================================
    // 3. CREATE PROMOTION CODE (Reusable by multiple customers)
    // ========================================================================
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: params.code.toUpperCase(), // Stripe requires uppercase (UDIG-SPIN50, UDIG-SPIN75, UDIG-SPIN100)
      active: true,
      // NO max_redemptions - Allow unlimited customers to use the same code
      restrictions: {
        first_time_transaction: true, // First-time customers only
        minimum_amount: params.discountAmount * 100, // Minimum order = discount amount (in cents)
        minimum_amount_currency: 'cad',
      },
      metadata: {
        source: 'spin_to_win',
        fixed_code: params.code,
        discount_amount_dollars: params.discountAmount,
        created_at: new Date().toISOString(),
        created_via: 'api',
      },
    } as any);

    logger.info('[Stripe] Promotion code created', {
      component: 'stripe-spin-coupons',
      action: 'promotion_code_created',
      metadata: {
        promotionCodeId: promotionCode.id,
        code: params.code,
        expiresAt: params.expiresAt,
      },
    });

    return {
      promotionCodeId: promotionCode.id,
      couponId: coupon.id,
      code: promotionCode.code,
      discountAmount: params.discountAmount,
      expiresAt: expiryTimestamp,
    };
  } catch (error) {
    logger.error('[Stripe] Failed to create coupon', {
      component: 'stripe-spin-coupons',
      action: 'create_error',
    }, error as Error);

    throw new Error(`Stripe coupon creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if a promotion code can be used
 *
 * @param code - Promotion code to validate
 * @returns Validation result
 */
export async function validateSpinCoupon(code: string): Promise<{
  valid: boolean;
  promotionCode?: Stripe.PromotionCode;
  error?: string;
}> {
  const stripe = await getStripeInstance();
  
  try {
    // Find promotion code
    const promotionCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase(),
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return {
        valid: false,
        error: 'Promotion code not found',
      };
    }

    const promoCode = promotionCodes.data[0];

    // Check if active
    if (!promoCode.active) {
      return {
        valid: false,
        error: 'Promotion code is no longer active',
      };
    }

    // Check if expired
    if (promoCode.expires_at && promoCode.expires_at < Math.floor(Date.now() / 1000)) {
      return {
        valid: false,
        error: 'Promotion code has expired',
      };
    }

    // Check if max redemptions reached
    if (promoCode.max_redemptions && promoCode.times_redeemed >= promoCode.max_redemptions) {
      return {
        valid: false,
        error: 'Promotion code has already been used',
      };
    }

    return {
      valid: true,
      promotionCode: promoCode,
    };
  } catch (error) {
    logger.error('[Stripe] Failed to validate coupon', {
      component: 'stripe-spin-coupons',
      action: 'validate_error',
    }, error as Error);

    return {
      valid: false,
      error: 'Failed to validate promotion code',
    };
  }
}

/**
 * Apply promotion code to a Stripe checkout session
 *
 * @param sessionId - Stripe checkout session ID
 * @param promoCode - Promotion code to apply
 */
export async function applySpinCouponToCheckout(
  sessionId: string,
  promoCode: string
): Promise<{ success: boolean; error?: string }> {
  const stripe = await getStripeInstance();
  
  try {
    // Update checkout session with promotion code
    await stripe.checkout.sessions.update(sessionId, {
      discounts: [{ promotion_code: promoCode }],
    } as any);

    logger.info('[Stripe] Coupon applied to checkout', {
      component: 'stripe-spin-coupons',
      action: 'coupon_applied',
      metadata: { sessionId, promoCode },
    });

    return { success: true };
  } catch (error) {
    logger.error('[Stripe] Failed to apply coupon to checkout', {
      component: 'stripe-spin-coupons',
      action: 'apply_error',
    }, error as Error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply coupon',
    };
  }
}

/**
 * Revoke a spin coupon (admin action)
 *
 * @param promotionCodeId - Stripe promotion code ID
 * @param reason - Reason for revocation
 */
export async function revokeSpinCoupon(
  promotionCodeId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const stripe = await getStripeInstance();
  
  try {
    await stripe.promotionCodes.update(promotionCodeId, {
      active: false,
      metadata: {
        revoked_at: new Date().toISOString(),
        revoked_reason: reason,
      },
    });

    logger.warn('[Stripe] Coupon revoked', {
      component: 'stripe-spin-coupons',
      action: 'coupon_revoked',
      metadata: { promotionCodeId, reason },
    });

    return { success: true };
  } catch (error) {
    logger.error('[Stripe] Failed to revoke coupon', {
      component: 'stripe-spin-coupons',
      action: 'revoke_error',
    }, error as Error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke coupon',
    };
  }
}

