import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { supportAssignmentSchema } from '@/lib/validators/admin/support';

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      // Use service client to bypass RLS for admin operations
      const supabase = await createServiceClient();

      if (!supabase) {
        logger.error('Service client not available', {
          component: 'admin-support-assign',
          action: 'service_client_failed',
        });
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id: ticketId } = resolvedParams;

      // Validate ticketId
      if (!ticketId || ticketId === 'undefined' || ticketId.trim() === '') {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
      }

      // Get user for logging
      const { user } = adminResult;

      const payload = supportAssignmentSchema.parse(await request.json());

      // Fetch current ticket to check status and assigned_at
      const { data: existingTicket, error: fetchError } = await supabase
        .from('support_tickets')
        .select('status, assigned_at')
        .eq('id', ticketId)
        .maybeSingle();

      if (fetchError || !existingTicket) {
        logger.error(
          'Failed to fetch ticket for assignment',
          {
            component: 'admin-support-assign',
            action: 'fetch_failed',
            metadata: { ticketId, error: fetchError?.message },
          },
          fetchError ?? new Error('Ticket not found')
        );
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        assigned_to: payload.assigneeId,
        updated_at: new Date().toISOString(),
      };

      // Set assigned_at if not already set (first assignment)
      if (!existingTicket.assigned_at) {
        updateData.assigned_at = new Date().toISOString();
      }

      // If assigning to current user and status is 'open', also update status to 'in_progress'
      if (payload.assigneeId === user?.id && existingTicket.status === 'open') {
        updateData.status = 'in_progress';
      }

      // Update ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select('id, ticket_number, customer_id, booking_id, equipment_id, subject, description, priority, status, category, assigned_to, assigned_at, created_at, resolved_at, first_response_at, internal_notes, resolution_notes, satisfaction_score')
        .single();

      if (ticketError || !ticket) {
        logger.error(
          'Failed to assign support ticket',
          {
            component: 'admin-support-assign',
            action: 'assign_failed',
            metadata: {
              ticketId,
              assigneeId: payload.assigneeId,
              updateData,
              error: ticketError?.message,
              errorCode: ticketError?.code,
              errorDetails: ticketError?.details,
              errorHint: ticketError?.hint,
            },
          },
          ticketError ?? new Error('Missing ticket data')
        );
        const errorMessage = ticketError?.message || 'Unable to assign ticket';
        return NextResponse.json(
          { error: errorMessage, details: ticketError?.details },
          { status: 500 }
        );
      }

      if (payload.note) {
        await supabase.from('support_messages').insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: user?.id || 'unknown',
          message_text: payload.note,
          internal: true,
        });
      }

      logger.info('Support ticket assigned', {
        component: 'admin-support-assign',
        action: 'ticket_assigned',
        metadata: {
          ticketId,
          assigneeId: payload.assigneeId,
          adminId: user?.id || 'unknown',
        },
      });

      return NextResponse.json({ ticket });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      // Handle params for error logging
      let ticketId = 'unknown';
      try {
        const resolvedParams = params instanceof Promise ? await params : params;
        ticketId = resolvedParams?.id || 'unknown';
      } catch {
        // Ignore errors in error handler
      }

      logger.error(
        'Unexpected error assigning support ticket',
        {
          component: 'admin-support-assign',
          action: 'assign_unexpected',
          metadata: { ticketId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
