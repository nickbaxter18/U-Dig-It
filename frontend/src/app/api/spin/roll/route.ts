/**
 * POST /api/spin/roll
 *
 * Performs a spin with server-side RNG and deterministic outcomes.
 *
 * BUSINESS LOGIC:
 * - Spins 1 & 2: Always land on "Try Again" (as disclosed)
 * - Spin 3: GUARANTEED to win with weighted distribution:
 *   - 5% discount  → 55% probability (0.55)
 *   - 10% discount → 30% probability (0.30)
 *   - 15% discount → 15% probability (0.15)
 * - Expected value: 8% discount
 *
 * Request body:
 * - sessionId: string (required)
 * - spin: number (1, 2, or 3)
 *
 * Returns:
 * - outcome: "try_again" | "50" | "75" | "100"
 * - spin: number
 * - couponCode?: string (if won)
 * - expiresAt?: string (if won)
 */
import crypto from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { sendSpinWinnerEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { createInAppNotification } from '@/lib/notification-service';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { createSpinWheelCoupon } from '@/lib/stripe/spin-coupons';
import { createClient } from '@/lib/supabase/server';

interface RollSpinRequest {
  sessionId: string;
  spinNumber?: number; // Optional, will auto-increment if not provided
}

interface SpinOutcome {
  spin: number;
  outcome: 'try_again' | '50' | '75' | '100';
  timestamp: string;
  couponCode?: string;
  expiresAt?: string;
  stripePromotionCodeId?: string;
  sliceIndex?: number; // Specific slice to land on (for dramatic effect)
}

/**
 * Secure server-side RNG for prize selection
 * Uses crypto.randomBytes for cryptographically secure randomness
 *
 * Distribution:
 * - $50  (0.00 - 0.55) → 55% probability
 * - $75  (0.55 - 0.85) → 30% probability
 * - $100 (0.85 - 1.00) → 15% probability
 *
 * Returns distinct coupon codes for each prize level:
 * - UDIG-GOLD50    ($50 discount - Gold tier)
 * - UDIG-SUPER75   ($75 discount - Super tier)
 * - UDIG-JACKPOT   ($100 discount - Jackpot tier)
 */
function selectWeightedPrize(): { amount: number; couponCode: string } {
  // Generate cryptographically secure random number between 0 and 1
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / 0xffffffff; // Normalize to [0, 1]

  // Weighted selection based on cumulative probability
  // Each prize level gets a distinct, memorable code
  if (randomValue < 0.55) {
    return { amount: 50, couponCode: 'UDIG-GOLD50' };
  } else if (randomValue < 0.85) {
    return { amount: 75, couponCode: 'UDIG-SUPER75' };
  } else {
    return { amount: 100, couponCode: 'UDIG-JACKPOT' };
  }
}

// Removed generateCouponCode() - Now using fixed codes from selectWeightedPrize()

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. RATE LIMITING
    // ========================================================================
    const apiRateLimit = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!apiRateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: apiRateLimit.headers }
      );
    }

    // ========================================================================
    // 2. AUTHENTICATION
    // ========================================================================
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body: RollSpinRequest = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // ========================================================================
    // 3. FETCH AND VALIDATE SESSION
    // ========================================================================
    const { data: session, error: fetchError } = await supabase
      .from('spin_sessions')
      .select('id, user_id, email, completed, expires_at, spins_used, spins_allowed, outcomes')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      logger.warn('[Spin Roll] Session not found', {
        component: 'spin-roll-api',
        action: 'session_not_found',
        metadata: { sessionId },
      });

      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ========================================================================
    // 4. AUTHORIZATION: Verify user owns this session
    // ========================================================================
    const isOwner = session.user_id === user?.id || session.email === user?.email;

    if (!isOwner && user) {
      logger.warn('[Spin Roll] Unauthorized access attempt', {
        component: 'spin-roll-api',
        action: 'unauthorized',
        metadata: { sessionId, userId: user.id },
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // ========================================================================
    // 5. VALIDATE SESSION STATE
    // ========================================================================
    if (session.completed) {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 400 });
    }

    if (session.spins_used >= session.spins_allowed) {
      return NextResponse.json({ error: 'No spins remaining' }, { status: 400 });
    }

    // ========================================================================
    // 6. DETERMINE SPIN NUMBER
    // ========================================================================
    const spinNumber = session.spins_used + 1;

    if (spinNumber > 3) {
      return NextResponse.json({ error: 'Maximum 3 spins allowed' }, { status: 400 });
    }

    // ========================================================================
    // 7. SERVER-SIDE OUTCOME DETERMINATION
    // ========================================================================
    let outcome: 'try_again' | '50' | '75' | '100';
    let prize: { amount: number; couponCode: string } | null = null;
    let couponCode: string | null = null;

    if (spinNumber <= 2) {
      // SPINS 1 & 2: Always "Try Again"
      outcome = 'try_again';

      logger.info('[Spin Roll] Spin result: Try Again', {
        component: 'spin-roll-api',
        action: 'spin_completed',
        metadata: {
          sessionId,
          spinNumber,
          outcome,
          sliceIndex: spinNumber === 2 ? 7 : undefined, // Spin 2 lands on slice 7 (try_again after $100)
        },
      });
    } else {
      // SPIN 3: GUARANTEED WIN with weighted distribution
      prize = selectWeightedPrize();
      outcome = prize.amount === 50 ? '50' : prize.amount === 75 ? '75' : '100';
      couponCode = prize.couponCode; // Use fixed code (UDIG-SPIN50, UDIG-SPIN75, or UDIG-SPIN100)

      logger.info('[Spin Roll] Spin result: Prize!', {
        component: 'spin-roll-api',
        action: 'prize_awarded',
        metadata: {
          amount: prize.amount,
          couponCode,
          spin: spinNumber,
          sessionId,
        },
      });

      if (session.user_id) {
        const promoPath = `/dashboard/promotions/${couponCode.toLowerCase()}`;
        await createInAppNotification({
          supabase,
          userId: session.user_id,
          category: 'marketing',
          priority: 'high',
          title: `You won $${prize.amount} off!`,
          message: `Congrats! Use code ${couponCode} on your next booking before it expires.`,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${promoPath}`,
          ctaLabel: 'View promo code',
          templateId: 'spin_wheel_prize_won',
          templateData: {
            couponCode,
            amount: prize.amount,
            spin: spinNumber,
            sessionId,
            expiresAt: session.expires_at,
            promotionPath: promoPath,
          },
          metadata: {
            sessionId,
            amount: prize.amount,
            couponCode,
            promotionPath: promoPath,
          },
        });
      }
    }

    // ========================================================================
    // 8. UPDATE SESSION WITH OUTCOME
    // ========================================================================
    const newOutcome: SpinOutcome = {
      spin: spinNumber,
      outcome,
      timestamp: new Date().toISOString(),
      ...(couponCode && { couponCode }),
      ...(spinNumber === 2 && { sliceIndex: 7 }), // Force spin 2 to land on slice 7 (try_again directly after $100)
    };

    const outcomes: Array<typeof newOutcome> = [
      ...(Array.isArray(session.outcomes) ? session.outcomes : []),
      newOutcome,
    ];

    const updateData: {
      spins_used: number;
      outcomes: typeof outcomes;
      updated_at: string;
      completed?: boolean;
      prize_pct?: number;
      coupon_code?: string;
    } = {
      spins_used: spinNumber,
      outcomes,
      updated_at: new Date().toISOString(),
    };

    // If this was a winning spin, mark session as completed
    if (spinNumber === 3 && prize) {
      updateData.completed = true;
      updateData.prize_pct = prize.amount; // Store dollar amount (50, 75, or 100)
      updateData.coupon_code = couponCode || undefined;
    }

    const { error: updateError } = await supabase
      .from('spin_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      logger.error(
        '[Spin Roll] Failed to update session',
        {
          component: 'spin-roll-api',
          action: 'update_error',
          metadata: {
            sessionId,
            spinNumber,
            updateData,
            supabaseError: {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint,
            },
          },
        },
        updateError
      );

      return NextResponse.json(
        {
          error: 'Failed to record spin',
          details: updateError.message, // Include actual error for debugging
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // 9. CREATE COUPON (IF WON) - STRIPE INTEGRATION
    // ========================================================================
    let stripePromotionCodeId: string | undefined;
    let stripeCouponId: string | undefined;

    if (spinNumber === 3 && prize && couponCode) {
      try {
        const stripePromo = await createSpinWheelCoupon({
          code: couponCode,
          discountAmount: prize.amount,
          expiresAt: session.expires_at,
          spinSessionId: sessionId,
          userId: session.user_id || undefined,
          email: session.email || undefined,
        });
        stripePromotionCodeId = stripePromo.promotionCodeId;
        stripeCouponId = stripePromo.couponId;

        logger.info('[Spin Roll] Stripe coupon created successfully', {
          component: 'spin-roll-api',
          action: 'stripe_coupon_created',
          metadata: {
            sessionId,
            couponCode,
            discountAmount: prize.amount,
            stripePromotionCodeId,
            stripeCouponId,
          },
        });
      } catch (error) {
        // Log error but don't fail the spin - coupon code is still valid
        logger.error(
          '[Spin Roll] Stripe coupon creation failed (non-fatal)',
          {
            component: 'spin-roll-api',
            action: 'stripe_coupon_error',
            metadata: {
              sessionId,
              couponCode,
              discountAmount: prize.amount,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
          error as Error
        );
        // Continue - coupon code is still saved to session and can be used manually
      }
    }

    // ========================================================================
    // 10. AUDIT LOG (Skipped - table doesn't exist yet)
    // ========================================================================
    // TODO: Create spin_audit_log table or use existing audit_logs table
    // const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
    // const userAgent = request.headers.get('user-agent') || 'unknown';

    logger.info('[Spin Roll] Audit log entry (table pending)', {
      component: 'spin-roll-api',
      action: 'audit_log',
      metadata: {
        sessionId,
        spinNumber,
        outcome,
        amount: prize?.amount || null,
        couponCode: couponCode || null,
      },
    });

    // ========================================================================
    // 11. SEND EMAIL NOTIFICATION (IF WON)
    // ========================================================================
    if (spinNumber === 3 && prize && couponCode && session.email) {
      // ✅ ENABLED: Send winner notification email immediately!
      try {
        await sendSpinWinnerEmail(
          session.email,
          prize.amount, // Dollar amount: 50, 75, or 100
          couponCode,
          new Date(session.expires_at)
        );

        logger.info('✅ [Spin Roll] Winner email sent successfully!', {
          component: 'spin-roll-api',
          action: 'email_sent',
          metadata: {
            sessionId,
            email: session.email,
            prizeAmount: prize.amount,
            couponCode,
          },
        });
      } catch (error) {
        logger.error(
          '❌ [Spin Roll] Failed to send winner email',
          {
            component: 'spin-roll-api',
            action: 'email_send_error',
            metadata: { sessionId, email: session.email },
          },
          error as Error
        );
        // Don't fail the spin if email fails - just log it
      }
    }

    // ========================================================================
    // 12. ANALYTICS EVENT
    // ========================================================================
    // TODO: Fire analytics events:
    // - spin_completed
    // - coupon_issued (if won)

    const duration = Date.now() - startTime;
    logger.info('[Spin Roll] Request completed', {
      component: 'spin-roll-api',
      action: 'request_completed',
      metadata: {
        sessionId,
        spinNumber,
        outcome,
        won: outcome !== 'try_again',
        duration,
      },
    });

    // ========================================================================
    // 13. RETURN RESPONSE
    // ========================================================================
    const response: SpinOutcome = {
      spin: spinNumber,
      outcome,
      timestamp: newOutcome.timestamp,
    };

    if (couponCode) {
      response.couponCode = couponCode;
      response.expiresAt = session.expires_at;
      response.stripePromotionCodeId = stripePromotionCodeId;
    }

    // Force spin 2 to land on specific slice (try_again beside $100)
    if (spinNumber === 2) {
      response.sliceIndex = 7; // Index 7 = try_again slice directly after $100 (index 6)
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      '[Spin Roll] Unexpected error',
      {
        component: 'spin-roll-api',
        action: 'error',
      },
      error as Error
    );

    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
