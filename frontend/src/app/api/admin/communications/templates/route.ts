import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const templateCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  subject: z.string().min(1).max(200),
  templateType: z.enum([
    'booking_confirmation',
    'booking_reminder',
    'payment_receipt',
    'delivery_notification',
    'custom',
  ]),
  htmlContent: z.string().min(1).max(50000),
  textContent: z.string().max(50000).optional().nullable(),
  variables: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // ✅ Fetch templates from Supabase
    const {
      data: templates,
      error: templatesError,
      count,
    } = await supabase
      .from('email_templates')
      .select('id, name, description, template_type, is_active', { count: 'exact' })
      .order('name', { ascending: true })
      .range(rangeStart, rangeEnd);

    if (templatesError) {
      throw new Error(`Database error: ${templatesError.message}`);
    }

    // ✅ Transform data to match frontend interface
    const transformedTemplates = (templates || []).map((template: unknown) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      templateType: template.template_type,
      isActive: template.is_active,
    }));

    logger.info('Templates fetched successfully', {
      component: 'communications-api',
      action: 'fetch_templates',
      metadata: { count: transformedTemplates.length },
    });

    return NextResponse.json({
      templates: transformedTemplates,
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to fetch templates',
      {
        component: 'communications-api',
        action: 'fetch_templates_error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
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

    // Parse and validate request body
    const body = await request.json();
    const validated = templateCreateSchema.parse(body);
    const {
      name,
      description,
      subject,
      templateType,
      htmlContent,
      textContent,
      variables,
      isActive = true,
    } = validated;

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .insert({
        name,
        description: description || null,
        subject,
        template_type: templateType,
        html_content: htmlContent,
        text_content: textContent || null,
        variables: variables || null,
        is_active: isActive,
        created_by: user?.id || 'unknown',
      })
      .select()
      .single();

    if (templateError) {
      throw new Error(`Database error: ${templateError.message}`);
    }

    logger.info('Template created successfully', {
      component: 'communications-api',
      action: 'create_template',
      metadata: { templateId: template.id, name },
    });

    return NextResponse.json(
      {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          templateType: template.template_type,
          isActive: template.is_active,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Failed to create template',
      {
        component: 'communications-api',
        action: 'create_template_error',
        metadata: { error: err instanceof Error ? err.message : String(err) },
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
});
