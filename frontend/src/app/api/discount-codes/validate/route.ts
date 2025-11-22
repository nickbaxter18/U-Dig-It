import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createClient } from '@/lib/supabase/server';

const validateDiscountSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().min(0),
  customerId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Request validation
    const requestValidation = await validateRequest(request);
    if (!requestValidation.valid) {
      return requestValidation.error!;
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized discount code validation attempt', {
        component: 'discount-api',
        action: 'auth_failed',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = validateDiscountSchema.parse(body);

    logger.debug('[Discount API] Validating discount code', {
      component: 'discount-api',
      action: 'validate',
      metadata: {
        code: validated.code,
        subtotal: validated.subtotal,
        userId: user.id,
      },
    });

    // Query discount code from database
    const { data: discountCode, error: dbError } = await supabase
      .from('discount_codes')
      .select(
        'id, code, name, type, value, max_uses, used_count, max_uses_per_user, min_booking_amount, valid_from, valid_until, is_active'
      )
      .eq('code', validated.code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (dbError || !discountCode) {
      logger.info('[Discount API] Invalid or expired code', {
        component: 'discount-api',
        action: 'validation_failed',
        metadata: { code: validated.code },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid or expired discount code' },
        { status: 200 }
      );
    }

    // Check date validity
    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return NextResponse.json(
        { success: false, error: 'This code is not yet active' },
        { status: 200 }
      );
    }

    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return NextResponse.json({ success: false, error: 'This code has expired' }, { status: 200 });
    }

    // Check minimum booking amount
    if (
      discountCode.min_booking_amount &&
      validated.subtotal < parseFloat(discountCode.min_booking_amount)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum booking amount of $${parseFloat(discountCode.min_booking_amount).toFixed(2)} required`,
        },
        { status: 200 }
      );
    }

    // Check max uses
    if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
      return NextResponse.json(
        { success: false, error: 'This code has reached its maximum usage limit' },
        { status: 200 }
      );
    }

    // ✅ SECURITY: Check if this is a Spin to Win code and enforce user ownership
    // Spin codes can ONLY be used by the user who won them
    const { data: spinSession } = await supabase
      .from('spin_sessions')
      .select('user_id, email')
      .eq('coupon_code', validated.code.toUpperCase())
      .single();

    if (spinSession) {
      // This code was awarded via Spin to Win - enforce ownership
      if (spinSession.user_id && spinSession.user_id !== user.id) {
        logger.warn("[Discount API] Attempt to use someone else's Spin to Win code", {
          component: 'discount-api',
          action: 'unauthorized_code_use',
          metadata: {
            code: validated.code,
            attemptedBy: user.id,
            actualOwner: spinSession.user_id,
          },
        });
        return NextResponse.json(
          { success: false, error: 'This code was awarded to another user and cannot be shared' },
          { status: 200 }
        );
      }
    }

    // Check per-user usage limit
    if (validated.customerId && discountCode.max_uses_per_user) {
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('customerId', validated.customerId)
        .not('couponCode', 'is', null)
        .eq('couponCode', validated.code.toUpperCase());

      if (countError) {
        logger.error(
          '[Discount API] Error checking user usage',
          {
            component: 'discount-api',
            action: 'usage_check_error',
            metadata: { error: countError.message },
          },
          countError
        );
      } else if (count && count >= discountCode.max_uses_per_user) {
        return NextResponse.json(
          { success: false, error: 'You have already used this code the maximum number of times' },
          { status: 200 }
        );
      }
    }

    // Calculate discount amount
    const discountAmount =
      discountCode.type === 'percentage'
        ? validated.subtotal * (parseFloat(discountCode.value) / 100)
        : parseFloat(discountCode.value);

    logger.info('[Discount API] Valid code applied', {
      component: 'discount-api',
      action: 'code_applied',
      metadata: {
        code: validated.code,
        discountAmount,
        userId: user.id,
        isSpinCode: !!spinSession,
      },
    });

    return NextResponse.json({
      success: true,
      discount: {
        code: discountCode.code,
        name: discountCode.name,
        type: discountCode.type,
        value: parseFloat(discountCode.value),
        discountAmount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error(
      '[Discount API] Unexpected error',
      {
        component: 'discount-api',
        action: 'error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
