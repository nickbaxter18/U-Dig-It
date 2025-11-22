import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { supportTicketUpdateSchema } from '@/lib/validators/admin/support';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Step 1: Rate limiting is handled by withRateLimit wrapper

      // Step 2: Authenticate - verify admin access
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Step 3: Fetch ticket
      const { data: ticket, error: fetchError } = await supabase
        .from('support_tickets')
        .select(
          'id, ticket_number, customer_id, booking_id, equipment_id, subject, description, priority, status, category, assigned_to, created_at, resolved_at, first_response_at, internal_notes, resolution_notes, satisfaction_score'
        )
        .eq('id', params.id)
        .maybeSingle();

      if (fetchError) {
        logger.error(
          'Failed to fetch ticket',
          {
            component: 'admin-support-ticket-get',
            action: 'fetch_failed',
            metadata: { ticketId: params.id },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
      }

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Step 4: Return JSON response
      return NextResponse.json({ ticket });
    } catch (err) {
      logger.error(
        'Unexpected error fetching support ticket',
        {
          component: 'admin-support-ticket-get',
          action: 'fetch_unexpected',
          metadata: { ticketId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Step 1: Rate limiting is handled by withRateLimit wrapper

      // Step 2: Authenticate - verify admin access
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // Step 3: Parse and validate request body
      let payload;
      try {
        const rawBody = await request.json();
        payload = supportTicketUpdateSchema.parse(rawBody);
      } catch (err) {
        if (err instanceof ZodError) {
          return NextResponse.json(
            { error: 'Invalid request body', details: err.issues },
            { status: 400 }
          );
        }
        throw err;
      }

      // Step 4: Verify ticket exists
      const { data: existingTicket, error: fetchError } = await supabase
        .from('support_tickets')
        .select('id, status, priority, category')
        .eq('id', params.id)
        .maybeSingle();

      if (fetchError) {
        logger.error(
          'Failed to fetch ticket for update',
          {
            component: 'admin-support-ticket-update',
            action: 'fetch_failed',
            metadata: { ticketId: params.id },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
      }

      if (!existingTicket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Step 5: Build update object (only include provided fields)
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (payload.priority !== undefined) {
        updateData.priority = payload.priority;
      }
      if (payload.category !== undefined) {
        updateData.category = payload.category;
      }
      if (payload.status !== undefined) {
        updateData.status = payload.status;
      }
      if (payload.resolution_notes !== undefined) {
        updateData.resolution_notes = payload.resolution_notes;
      }
      if (payload.internal_notes !== undefined) {
        updateData.internal_notes = payload.internal_notes;
      }
      if (payload.satisfaction_score !== undefined) {
        updateData.satisfaction_score = payload.satisfaction_score;
      }

      // Step 6: Update ticket
      const { data: updatedTicket, error: updateError } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (updateError || !updatedTicket) {
        logger.error(
          'Failed to update support ticket',
          {
            component: 'admin-support-ticket-update',
            action: 'update_failed',
            metadata: { ticketId: params.id, updates: Object.keys(updateData) },
          },
          updateError ?? new Error('Missing ticket data')
        );
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
      }

      // Step 7: Log success
      logger.info('Support ticket updated', {
        component: 'admin-support-ticket-update',
        action: 'ticket_updated',
        metadata: {
          ticketId: params.id,
          updates: Object.keys(updateData),
          adminId: user?.id || 'unknown',
        },
      });

      // Step 8: Return JSON response
      return NextResponse.json({ ticket: updatedTicket });
    } catch (err) {
      logger.error(
        'Unexpected error updating support ticket',
        {
          component: 'admin-support-ticket-update',
          action: 'update_unexpected',
          metadata: { ticketId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
