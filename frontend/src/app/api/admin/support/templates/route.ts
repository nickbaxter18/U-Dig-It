import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { supportTemplateCreateSchema } from '@/lib/validators/admin/support';

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    const {
      data,
      error: fetchError,
      count,
    } = await supabase
      .from('support_templates')
      .select('id, name, channel, subject, body, created_by, created_at, updated_at', {
        count: 'exact',
      })
      .order('name', { ascending: true })
      .range(rangeStart, rangeEnd);

    if (fetchError) {
      logger.error('Failed to fetch support templates', {
        component: 'admin-support-templates',
        action: 'fetch_failed',
      });
      return NextResponse.json({ error: 'Unable to load support templates' }, { status: 500 });
    }

    return NextResponse.json({
      templates: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    logger.error(
      'Unexpected error fetching support templates',
      { component: 'admin-support-templates', action: 'fetch_unexpected' },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging
    const { user } = adminResult;

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
});
