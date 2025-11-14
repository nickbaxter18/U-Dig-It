import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { id } = params;

    // ✅ Fetch template from Supabase
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      throw new Error(`Database error: ${templateError.message}`);
    }

    logger.info('Template fetched successfully', {
      component: 'communications-api',
      action: 'fetch_template',
      metadata: { templateId: id }
    });

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        subject: template.subject,
        templateType: template.template_type,
        htmlContent: template.html_content,
        textContent: template.text_content,
        variables: template.variables,
        isActive: template.is_active,
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }
    });
  } catch (error: any) {
    logger.error('Failed to fetch template', {
      component: 'communications-api',
      action: 'fetch_template_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const { id } = params;
    const body = await request.json();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.templateType !== undefined) updateData.template_type = body.templateType;
    if (body.htmlContent !== undefined) updateData.html_content = body.htmlContent;
    if (body.textContent !== undefined) updateData.text_content = body.textContent;
    if (body.variables !== undefined) updateData.variables = body.variables;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    // Update template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (templateError) {
      if (templateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      throw new Error(`Database error: ${templateError.message}`);
    }

    logger.info('Template updated successfully', {
      component: 'communications-api',
      action: 'update_template',
      metadata: {
        templateId: id,
        updatedBy: user?.id,
      },
    });

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        subject: template.subject,
        templateType: template.template_type,
        htmlContent: template.html_content,
        textContent: template.text_content,
        variables: template.variables,
        isActive: template.is_active,
        updatedAt: template.updated_at
      }
    });
  } catch (error: any) {
    logger.error('Failed to update template', {
      component: 'communications-api',
      action: 'update_template_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}


