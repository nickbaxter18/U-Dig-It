import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerNoteCreateSchema } from '@/lib/validators/admin/customers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
      .from('customer_notes')
      .select(
        `
        id,
        customer_id,
        admin_id,
        note,
        type,
        visibility,
        created_at,
        admin:admin_id (id, firstName, lastName, email)
      `
      )
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error(
        'Failed to fetch customer notes',
        {
          component: 'admin-customer-notes',
          action: 'fetch_failed',
          metadata: { customerId: params.id },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load customer notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer notes',
      {
        component: 'admin-customer-notes',
        action: 'fetch_unexpected',
        metadata: { customerId: params.id },
      },
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

    const payload = customerNoteCreateSchema.parse(await request.json());

    const { data: note, error: insertError } = await supabase
      .from('customer_notes')
      .insert({
        customer_id: params.id,
        admin_id: user.id,
        note: payload.note,
        type: payload.type ?? 'info',
        visibility: payload.visibility ?? 'internal',
      })
      .select()
      .single();

    if (insertError || !note) {
      logger.error(
        'Failed to create customer note',
        {
          component: 'admin-customer-notes',
          action: 'create_failed',
          metadata: { customerId: params.id, adminId: user.id },
        },
        insertError ?? new Error('Missing note data')
      );
      return NextResponse.json(
        { error: 'Unable to create customer note' },
        { status: 500 }
      );
    }

    await supabase.from('customer_timeline_events').insert({
      customer_id: params.id,
      event_type: 'note',
      reference_table: 'customer_notes',
      reference_id: note.id,
      occurred_at: new Date().toISOString(),
      metadata: {
        type: note.type,
        createdBy: user.id,
      },
    });

    logger.info('Customer note created', {
      component: 'admin-customer-notes',
      action: 'note_created',
      metadata: { customerId: params.id, noteId: note.id, adminId: user.id },
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
      'Unexpected error creating customer note',
      {
        component: 'admin-customer-notes',
        action: 'create_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


