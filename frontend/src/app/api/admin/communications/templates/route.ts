import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // ✅ Fetch templates from Supabase
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('id, name, description, template_type, is_active')
      .order('name', { ascending: true });

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
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to fetch templates',
      {
        component: 'communications-api',
        action: 'fetch_templates_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      name,
      description,
      subject,
      templateType,
      htmlContent,
      textContent,
      variables,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !subject || !templateType || !htmlContent) {
      return NextResponse.json(
        { error: 'Name, subject, template type, and HTML content are required' },
        { status: 400 }
      );
    }

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
  } catch (error: unknown) {
    logger.error(
      'Failed to create template',
      {
        component: 'communications-api',
        action: 'create_template_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
