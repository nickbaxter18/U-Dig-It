import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { supportMessageCreateSchema } from '@/lib/validators/admin/support';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const result = await requireAdmin(request);
      if ('error' in result && result.error) return result.error;
      const supabase = result.supabase ?? (await createServiceClient());
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id: ticketId } = resolvedParams;

      // Validate ticketId
      if (!ticketId || ticketId === 'undefined' || ticketId.trim() === '') {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
      }

      // Get user for logging - not needed for GET, but available if needed
      const { user: _user } = result;

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
        .from('support_messages')
        .select(
          `
          id,
          ticket_id,
          sender_type,
          sender_id,
          message_text,
          attachments,
          created_at,
          internal
        `,
          { count: 'exact' }
        )
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
        .range(rangeStart, rangeEnd);

      if (fetchError) {
        logger.error(
          'Failed to fetch support messages',
          {
            component: 'admin-support-messages',
            action: 'fetch_failed',
            metadata: { ticketId },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load support messages' }, { status: 500 });
      }

      return NextResponse.json({
        messages: data ?? [],
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
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
        'Unexpected error fetching support messages',
        {
          component: 'admin-support-messages',
          action: 'fetch_unexpected',
          metadata: { ticketId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const result = await requireAdmin(request);
      if ('error' in result && result.error) return result.error;
      const supabase = result.supabase ?? (await createServiceClient());
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id: ticketId } = resolvedParams;

      // Validate ticketId
      if (!ticketId || ticketId === 'undefined' || ticketId.trim() === '') {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
      }

      // Get user for logging
      const { user } = result;

      const payload = supportMessageCreateSchema.parse(await request.json());

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('id, status')
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketError || !ticket) {
        return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
      }

      const { data: message, error: insertError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_id: user?.id || 'unknown',
          message_text: payload.message,
          attachments: payload.attachments ?? [],
          internal: payload.internal ?? false,
        })
        .select()
        .single();

      if (insertError || !message) {
        logger.error(
          'Failed to create support message',
          {
            component: 'admin-support-messages',
            action: 'create_failed',
            metadata: { ticketId },
          },
          insertError ?? new Error('Missing message data')
        );
        return NextResponse.json({ error: 'Unable to send support message' }, { status: 500 });
      }

      await supabase
        .from('support_tickets')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', ticketId);

      logger.info('Support message posted', {
        component: 'admin-support-messages',
        action: 'message_created',
        metadata: { ticketId, messageId: message.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ message });
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
        'Unexpected error creating support message',
        {
          component: 'admin-support-messages',
          action: 'create_unexpected',
          metadata: { ticketId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
