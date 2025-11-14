import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import {
  bookingWizardStatusEnum,
  bookingWizardUpdateSchema,
} from '@/lib/validators/admin/bookings';

const STATUS_ORDER: Record<(typeof bookingWizardStatusEnum)['enumValues'][number], number> = {
  draft: 0,
  in_progress: 1,
  ready_to_commit: 2,
  completed: 3,
  expired: 4,
  abandoned: 5,
};

function serializeSession(session: any) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data: session, error: fetchError } = await supabase
      .from('booking_wizard_sessions')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Failed to fetch wizard session',
        { component: 'admin-bookings-wizard', action: 'fetch_session_failed', metadata: { sessionId: params.id } },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load booking wizard session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json({ error: 'Wizard session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: serializeSession(session) });
  } catch (err) {
    logger.error(
      'Unexpected error fetching booking wizard session',
      { component: 'admin-bookings-wizard', action: 'fetch_session_unexpected', metadata: { sessionId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error, role } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const data = bookingWizardUpdateSchema.parse(body);

    const { data: session, error: fetchError } = await supabase
      .from('booking_wizard_sessions')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Failed to fetch wizard session for update',
        { component: 'admin-bookings-wizard', action: 'fetch_session_failed', metadata: { sessionId: params.id } },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to update booking wizard session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json({ error: 'Wizard session not found' }, { status: 404 });
    }

    if (session.admin_id !== user.id && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      return NextResponse.json(
        { error: `Cannot modify a ${session.status} wizard session` },
        { status: 409 }
      );
    }

    const patch: Record<string, unknown> = {};

    if (data.payload) {
      patch.payload = {
        ...(session.payload ?? {}),
        ...data.payload,
      };
    }

    if (data.status) {
      const currentOrder = STATUS_ORDER[session.status as keyof typeof STATUS_ORDER] ?? 0;
      const nextOrder = STATUS_ORDER[data.status];

      if (nextOrder < currentOrder) {
        return NextResponse.json(
          { error: 'Cannot regress wizard status' },
          { status: 400 }
        );
      }

      patch.status = data.status;
    }

    if (data.expiresAt) {
      patch.expires_at = data.expiresAt;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ session: serializeSession(session) });
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('booking_wizard_sessions')
      .update(patch)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update wizard session',
        { component: 'admin-bookings-wizard', action: 'update_session_failed', metadata: { sessionId: params.id } },
        updateError
      );
      return NextResponse.json(
        { error: 'Unable to update booking wizard session' },
        { status: 500 }
      );
    }

    logger.info('Booking wizard session updated', {
      component: 'admin-bookings-wizard',
      action: 'session_updated',
      metadata: { sessionId: params.id, adminId: user.id, updates: Object.keys(patch) },
    });

    return NextResponse.json({ session: serializeSession(updatedSession) });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating booking wizard session',
      { component: 'admin-bookings-wizard', action: 'update_session_unexpected', metadata: { sessionId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


