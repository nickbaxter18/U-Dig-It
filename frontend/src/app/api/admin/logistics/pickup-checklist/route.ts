import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { pickupChecklistSchema } from '@/lib/validators/admin/bookings';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = pickupChecklistSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('pickup_checklists')
      .insert({
        booking_id: payload.bookingId,
        checklist: payload.checklist,
        inspector_id: payload.inspectorId ?? user.id,
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
      return NextResponse.json(
        { error: 'Unable to save pickup checklist' },
        { status: 500 }
      );
    }

    logger.info('Pickup checklist recorded', {
      component: 'admin-logistics-pickup-checklist',
      action: 'checklist_created',
      metadata: { checklistId: data.id, bookingId: payload.bookingId, adminId: user.id },
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
}


