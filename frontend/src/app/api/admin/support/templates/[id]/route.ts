import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { supportTemplateUpdateSchema } from '@/lib/validators/admin/support';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const payload = supportTemplateUpdateSchema.parse(await request.json());

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ success: true });
    }

    const updateBody: Record<string, unknown> = {};
    if (payload.name !== undefined) updateBody.name = payload.name;
    if (payload.channel !== undefined) updateBody.channel = payload.channel;
    if (payload.subject !== undefined) updateBody.subject = payload.subject ?? null;
    if (payload.body !== undefined) updateBody.body = payload.body;
    updateBody.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('support_templates')
      .update(updateBody)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      logger.error(
        'Failed to update support template',
        {
          component: 'admin-support-templates',
          action: 'update_failed',
          metadata: { templateId: params.id, adminId: user?.id || 'unknown' },
        },
        updateError
      );
      return NextResponse.json({ error: 'Unable to update support template' }, { status: 500 });
    }

    logger.info('Support template updated', {
      component: 'admin-support-templates',
      action: 'template_updated',
      metadata: { templateId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ template: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating support template',
      {
        component: 'admin-support-templates',
        action: 'update_unexpected',
        metadata: { templateId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const { error: deleteError } = await supabase
      .from('support_templates')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      logger.error(
        'Failed to delete support template',
        {
          component: 'admin-support-templates',
          action: 'delete_failed',
          metadata: { templateId: params.id, adminId: user?.id || 'unknown' },
        },
        deleteError
      );
      return NextResponse.json({ error: 'Unable to delete support template' }, { status: 500 });
    }

    logger.info('Support template deleted', {
      component: 'admin-support-templates',
      action: 'template_deleted',
      metadata: { templateId: params.id, adminId: user?.id || 'unknown' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(
      'Unexpected error deleting support template',
      {
        component: 'admin-support-templates',
        action: 'delete_unexpected',
        metadata: { templateId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
