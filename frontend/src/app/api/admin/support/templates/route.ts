import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { supportTemplateCreateSchema } from '@/lib/validators/admin/support';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    const { data, error: fetchError } = await supabase
      .from('support_templates')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      logger.error(
        'Failed to fetch support templates',
        { component: 'admin-support-templates', action: 'fetch_failed' });
      return NextResponse.json({ error: 'Unable to load support templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching support templates',
      { component: 'admin-support-templates', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    const payload = supportTemplateCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('support_templates')
      .insert({
        name: payload.name,
        channel: payload.channel,
        subject: payload.subject ?? null,
        body: payload.body,
        created_by: user?.id || 'unknown',
      })
      .select()
      .single();

    if (insertError || !data) {
      logger.error(
        'Failed to create support template',
        {
          component: 'admin-support-templates',
          action: 'create_failed',
          metadata: { name: payload.name },
        },
        insertError ?? new Error('Missing template data')
      );
      return NextResponse.json({ error: 'Unable to create support template' }, { status: 500 });
    }

    logger.info('Support template created', {
      component: 'admin-support-templates',
      action: 'template_created',
      metadata: { templateId: data.id, adminId: user?.id || 'unknown' },
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
      'Unexpected error creating support template',
      { component: 'admin-support-templates', action: 'create_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
