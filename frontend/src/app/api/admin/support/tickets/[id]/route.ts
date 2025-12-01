import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { supportTicketUpdateSchema } from '@/lib/validators/admin/support';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      // Step 1: Rate limiting is handled by withRateLimit wrapper

      // Step 2: Authenticate - verify admin access
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id: ticketId } = resolvedParams;

      // Validate ticketId
      if (!ticketId || ticketId === 'undefined' || ticketId.trim() === '') {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
      }

      // Step 3: Fetch ticket
      const { data: ticket, error: fetchError } = await supabase
        .from('support_tickets')
        .select(
          'id, ticket_number, customer_id, booking_id, equipment_id, subject, description, priority, status, category, assigned_to, created_at, resolved_at, first_response_at, internal_notes, resolution_notes, satisfaction_score'
        )
        .eq('id', ticketId)
        .maybeSingle();

      if (fetchError) {
        logger.error(
          'Failed to fetch ticket',
          {
            component: 'admin-support-ticket-get',
            action: 'fetch_failed',
            metadata: { ticketId },
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
      // Handle params for error logging
      let ticketId = 'unknown';
      try {
        const resolvedParams = params instanceof Promise ? await params : params;
        ticketId = resolvedParams?.id || 'unknown';
      } catch {
        // Ignore errors in error handler
      }

      logger.error(
        'Unexpected error fetching support ticket',
        {
          component: 'admin-support-ticket-get',
          action: 'fetch_unexpected',
          metadata: { ticketId },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      // Step 1: Rate limiting is handled by withRateLimit wrapper

      // Step 2: Authenticate - verify admin access
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id: ticketId } = resolvedParams;

      // Validate ticketId
      if (!ticketId || ticketId === 'undefined' || ticketId.trim() === '') {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
      }

      // Use service client to bypass RLS for admin operations
      const supabase = await createServiceClient();

      if (!supabase) {
        logger.error('Service client not available', {
          component: 'admin-support-ticket-update',
          action: 'service_client_failed',
          metadata: { ticketId },
        });
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
        .eq('id', ticketId)
        .maybeSingle();

      if (fetchError) {
        logger.error(
          'Failed to fetch ticket for update',
          {
            component: 'admin-support-ticket-update',
            action: 'fetch_failed',
            metadata: { ticketId },
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
        .eq('id', ticketId)
        .select('id, ticket_number, customer_id, booking_id, equipment_id, subject, description, priority, status, category, assigned_to, assigned_at, created_at, resolved_at, first_response_at, internal_notes, resolution_notes, satisfaction_score')
        .single();

      if (updateError || !updatedTicket) {
        logger.error(
          'Failed to update support ticket',
          {
            component: 'admin-support-ticket-update',
            action: 'update_failed',
            metadata: {
              ticketId,
              updates: Object.keys(updateData),
              updateData,
              error: updateError?.message,
              errorCode: updateError?.code,
              errorDetails: updateError?.details,
              errorHint: updateError?.hint,
            },
          },
          updateError ?? new Error('Missing ticket data')
        );
        const errorMessage = updateError?.message || 'Failed to update ticket';
        return NextResponse.json(
          { error: errorMessage, details: updateError?.details },
          { status: 500 }
        );
      }

      // Step 7: Log success
      logger.info('Support ticket updated', {
        component: 'admin-support-ticket-update',
        action: 'ticket_updated',
        metadata: {
          ticketId,
          updates: Object.keys(updateData),
          adminId: user?.id || 'unknown',
        },
      });

      // Step 8: Return JSON response
      return NextResponse.json({ ticket: updatedTicket });
    } catch (err) {
      // Handle params for error logging
      let ticketId = 'unknown';
      try {
        const resolvedParams = params instanceof Promise ? await params : params;
        ticketId = resolvedParams?.id || 'unknown';
      } catch {
        // Ignore errors in error handler
      }

      logger.error(
        'Unexpected error updating support ticket',
        {
          component: 'admin-support-ticket-update',
          action: 'update_unexpected',
          metadata: { ticketId },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
