import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerNoteCreateSchema } from '@/lib/validators/admin/customers';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get pagination parameters
      const { searchParams } = new URL(request.url);
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const pageSize = Math.min(
        Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
        200
      );
      const rangeStart = (page - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
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
        `,
          { count: 'exact' }
        )
        .eq('customer_id', params.id)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);

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
        return NextResponse.json({ error: 'Unable to load customer notes' }, { status: 500 });
      }

      return NextResponse.json({
        notes: data ?? [],
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
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
);

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const payload = customerNoteCreateSchema.parse(await request.json());

      const { data: note, error: insertError } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: params.id,
          admin_id: user?.id || 'unknown',
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
            metadata: { customerId: params.id, adminId: user?.id || 'unknown' },
          },
          insertError ?? new Error('Missing note data')
        );
        return NextResponse.json({ error: 'Unable to create customer note' }, { status: 500 });
      }

      await supabase.from('customer_timeline_events').insert({
        customer_id: params.id,
        event_type: 'note',
        reference_table: 'customer_notes',
        reference_id: note.id,
        occurred_at: new Date().toISOString(),
        metadata: {
          type: note.type,
          createdBy: user?.id || 'unknown',
        },
      });

      logger.info('Customer note created', {
        component: 'admin-customer-notes',
        action: 'note_created',
        metadata: { customerId: params.id, noteId: note.id, adminId: user?.id || 'unknown' },
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
);
