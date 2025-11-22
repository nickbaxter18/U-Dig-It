import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { pickupChecklistSchema } from '@/lib/validators/admin/bookings';

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

    const payload = pickupChecklistSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('pickup_checklists')
      .insert({
        booking_id: payload.bookingId,
        checklist: payload.checklist,
        inspector_id: payload.inspectorId ?? (user?.id || 'unknown'),
        signed_at: payload.signedAt ?? new Date().toISOString(),
        photos: payload.photos ?? [],
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create pickup checklist',
        {
          component: 'admin-logistics-pickup-checklist',
          action: 'insert_failed',
          metadata: { bookingId: payload.bookingId },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to save pickup checklist' }, { status: 500 });
    }

    logger.info('Pickup checklist recorded', {
      component: 'admin-logistics-pickup-checklist',
      action: 'checklist_created',
      metadata: {
        checklistId: data.id,
        bookingId: payload.bookingId,
        adminId: user?.id || 'unknown',
      },
    });

    return NextResponse.json({ checklist: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error saving pickup checklist',
      {
        component: 'admin-logistics-pickup-checklist',
        action: 'unexpected_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while saving pickup checklist' },
      { status: 500 }
    );
  }
});
