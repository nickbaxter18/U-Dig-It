import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { supportReminderSchema } from '@/lib/validators/admin/support';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = supportReminderSchema.parse(await request.json());

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, assigned_to_id')
      .eq('id', params.id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    await supabase.from('support_messages').insert({
      ticket_id: params.id,
      sender_type: 'system',
      message_text: `SLA reminder triggered (${payload.type ?? 'response'})`,
      internal: true,
    });

    logger.info('Support reminder triggered', {
      component: 'admin-support-remind',
      action: 'sla_reminder_triggered',
      metadata: { ticketId: params.id, adminId: user.id, type: payload.type ?? 'response' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error triggering support reminder',
      { component: 'admin-support-remind', action: 'reminder_unexpected', metadata: { ticketId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


