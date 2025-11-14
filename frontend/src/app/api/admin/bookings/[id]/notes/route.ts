import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { bookingNoteCreateSchema } from '@/lib/validators/admin/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
      .from('booking_notes')
      .select(
        `
        id,
        booking_id,
        admin_id,
        visibility,
        note,
        created_at
      `
      )
      .eq('booking_id', params.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error(
        'Failed to fetch booking notes',
        { component: 'admin-bookings-notes', action: 'fetch_failed', metadata: { bookingId: params.id } },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to load booking notes' }, { status: 500 });
    }

    return NextResponse.json({ notes: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching booking notes',
      { component: 'admin-bookings-notes', action: 'fetch_unexpected', metadata: { bookingId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    const data = bookingNoteCreateSchema.parse(body);

    const { data: note, error: insertError } = await supabase
      .from('booking_notes')
      .insert({
        booking_id: params.id,
        admin_id: user.id,
        note: data.note,
        visibility: data.visibility,
      })
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to create booking note',
        { component: 'admin-bookings-notes', action: 'insert_failed', metadata: { bookingId: params.id } },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create booking note' }, { status: 500 });
    }

    logger.info('Booking note created', {
      component: 'admin-bookings-notes',
      action: 'note_created',
      metadata: { bookingId: params.id, noteId: note.id, adminId: user.id },
    });

    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating booking note',
      { component: 'admin-bookings-notes', action: 'insert_unexpected', metadata: { bookingId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


