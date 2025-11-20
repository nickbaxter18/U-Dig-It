import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { supportMessageCreateSchema } from '@/lib/validators/admin/support';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await requireAdmin(request);
    if ('error' in result && result.error) return result.error;
    const supabase = result.supabase ?? createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // Get user for logging
    const {
      data: { user: _user },
    } = await supabase.auth.getUser();
    const { data, error: fetchError } = await supabase
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
      `
      )
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true });

    if (fetchError) {
      logger.error(
        'Failed to fetch support messages',
        {
          component: 'admin-support-messages',
          action: 'fetch_failed',
          metadata: { ticketId: params.id },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to load support messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching support messages',
      {
        component: 'admin-support-messages',
        action: 'fetch_unexpected',
        metadata: { ticketId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await requireAdmin(request);
    if ('error' in result && result.error) return result.error;
    const supabase = result.supabase ?? createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // Get user for logging
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = supportMessageCreateSchema.parse(await request.json());

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, status')
      .eq('id', params.id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    const { data: message, error: insertError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: params.id,
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
          metadata: { ticketId: params.id },
        },
        insertError ?? new Error('Missing message data')
      );
      return NextResponse.json({ error: 'Unable to send support message' }, { status: 500 });
    }

    await supabase
      .from('support_tickets')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', params.id);

    logger.info('Support message posted', {
      component: 'admin-support-messages',
      action: 'message_created',
      metadata: { ticketId: params.id, messageId: message.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ message });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating support message',
      {
        component: 'admin-support-messages',
        action: 'create_unexpected',
        metadata: { ticketId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
