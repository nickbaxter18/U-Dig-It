import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { bookingNoteCreateSchema } from '@/lib/validators/admin/bookings';

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
        .from('booking_notes')
        .select(
          `
          id,
          booking_id,
          admin_id,
          visibility,
          note,
          created_at
        `,
          { count: 'exact' }
        )
        .eq('booking_id', params.id)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);

      if (fetchError) {
        logger.error(
          'Failed to fetch booking notes',
          {
            component: 'admin-bookings-notes',
            action: 'fetch_failed',
            metadata: { bookingId: params.id },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load booking notes' }, { status: 500 });
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
        'Unexpected error fetching booking notes',
        {
          component: 'admin-bookings-notes',
          action: 'fetch_unexpected',
          metadata: { bookingId: params.id },
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

      const body = await request.json();
      const data = bookingNoteCreateSchema.parse(body);

      const { data: note, error: insertError } = await supabase
        .from('booking_notes')
        .insert({
          booking_id: params.id,
          admin_id: user?.id || 'unknown',
          note: data.note,
          visibility: data.visibility,
        })
        .select()
        .single();

      if (insertError) {
        logger.error(
          'Failed to create booking note',
          {
            component: 'admin-bookings-notes',
            action: 'insert_failed',
            metadata: { bookingId: params.id },
          },
          insertError
        );
        return NextResponse.json({ error: 'Unable to create booking note' }, { status: 500 });
      }

      logger.info('Booking note created', {
        component: 'admin-bookings-notes',
        action: 'note_created',
        metadata: { bookingId: params.id, noteId: note.id, adminId: user?.id || 'unknown' },
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
        {
          component: 'admin-bookings-notes',
          action: 'insert_unexpected',
          metadata: { bookingId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
