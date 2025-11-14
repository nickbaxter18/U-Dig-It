import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { supportAssignmentSchema } from '@/lib/validators/admin/support';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = supportAssignmentSchema.parse(await request.json());

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .update({ assigned_to_id: payload.assigneeId, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (ticketError || !ticket) {
      logger.error(
        'Failed to assign support ticket',
        { component: 'admin-support-assign', action: 'assign_failed', metadata: { ticketId: params.id, assigneeId: payload.assigneeId } },
        ticketError ?? new Error('Missing ticket data')
      );
      return NextResponse.json(
        { error: 'Unable to assign ticket' },
        { status: 500 }
      );
    }

    if (payload.note) {
      await supabase.from('support_messages').insert({
        ticket_id: params.id,
        sender_type: 'admin',
        sender_id: user.id,
        message_text: payload.note,
        internal: true,
      });
    }

    logger.info('Support ticket reassigned', {
      component: 'admin-support-assign',
      action: 'ticket_assigned',
      metadata: { ticketId: params.id, assigneeId: payload.assigneeId, adminId: user.id },
    });

    return NextResponse.json({ ticket });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error assigning support ticket',
      { component: 'admin-support-assign', action: 'assign_unexpected', metadata: { ticketId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


