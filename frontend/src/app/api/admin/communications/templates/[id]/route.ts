import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      const { id } = params;

      // ✅ Fetch template from Supabase
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select(
          'id, name, description, subject, template_type, html_content, text_content, variables, is_active, created_at, updated_at'
        )
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
        metadata: { templateId: id },
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
          updatedAt: template.updated_at,
        },
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to fetch template',
        {
          component: 'communications-api',
          action: 'fetch_template_error',
          metadata: { error: error.message },
        },
        error
      );

      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;
      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const { id } = params;
      const body = await request.json();

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
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
          updatedAt: template.updated_at,
        },
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to update template',
        {
          component: 'communications-api',
          action: 'update_template_error',
          metadata: { error: error.message },
        },
        error
      );

      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
  }
);
