import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  bookingWizardStartSchema,
  BookingWizardStartInput,
  BookingWizardStatus,
} from '@/lib/validators/admin/bookings';

interface WizardSessionResponse {
  id: string;
  adminId: string;
  bookingId: string | null;
  status: BookingWizardStatus;
  payload: Record<string, unknown>;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

const SESSION_TIMEOUT_MINUTES = 30;

function serializeSession(session: any): WizardSessionResponse {
  return {
    id: session.id,
    adminId: session.admin_id,
    bookingId: session.booking_id,
    status: session.status,
    payload: session.payload ?? {},
    expiresAt: session.expires_at,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

function buildInitialPayload(
  input: BookingWizardStartInput,
  adminId: string
): Record<string, unknown> {
  return {
    context: {
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    },
    selections: {
      customerId: input.customerId,
      equipmentId: input.equipmentId,
      startDate: input.startDate,
      endDate: input.endDate,
      deliveryAddress: input.deliveryAddress ?? null,
    },
    draft: input.payload ?? {},
  };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const data = bookingWizardStartSchema.parse(body);

    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString();
    const payload = buildInitialPayload(data, user.id);

    const { data: session, error: insertError } = await supabase
      .from('booking_wizard_sessions')
      .insert({
        admin_id: user.id,
        booking_id: null,
        payload,
        status: 'in_progress',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create booking wizard session',
        {
          component: 'admin-bookings-wizard-start',
          action: 'create_session_failed',
          metadata: { adminId: user.id },
        },
        insertError
      );
      return NextResponse.json(
        { error: 'Unable to start booking wizard session' },
        { status: 500 }
      );
    }

    logger.info('Booking wizard session created', {
      component: 'admin-bookings-wizard-start',
      action: 'session_created',
      metadata: { adminId: user.id, sessionId: session.id },
    });

    return NextResponse.json({ session: serializeSession(session) });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error starting booking wizard',
      {
        component: 'admin-bookings-wizard-start',
        action: 'unexpected_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while starting booking wizard' },
      { status: 500 }
    );
  }
}


