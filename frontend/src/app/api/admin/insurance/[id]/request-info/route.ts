import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { insuranceRequestInfoSchema } from '@/lib/validators/admin/support';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = insuranceRequestInfoSchema.parse(await request.json());

    const now = new Date().toISOString();

    const { data: document, error: updateError } = await supabase
      .from('insurance_documents')
      .update({
        requested_info: {
          message: payload.message,
          fields: payload.requestedFields ?? [],
          requestedAt: now,
        },
        reviewNotes: payload.message,
        status: 'under_review',
        updatedAt: now,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError || !document) {
      logger.error(
        'Failed to request insurance information',
        { component: 'admin-insurance-info', action: 'request_info_failed', metadata: { insuranceId: params.id } },
        updateError ?? new Error('Missing insurance document')
      );
      return NextResponse.json(
        { error: 'Unable to request additional information' },
        { status: 500 }
      );
    }

    await supabase.from('insurance_activity').insert({
      insurance_document_id: params.id,
      action: 'info_requested',
      actor_id: user.id,
      details: {
        message: payload.message,
        fields: payload.requestedFields ?? [],
      },
    });

    logger.info('Insurance info requested', {
      component: 'admin-insurance-info',
      action: 'info_requested',
      metadata: { insuranceId: params.id, adminId: user.id },
    });

    return NextResponse.json({ insuranceDocument: document });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error requesting insurance info',
      { component: 'admin-insurance-info', action: 'request_info_unexpected', metadata: { insuranceId: params.id } },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


