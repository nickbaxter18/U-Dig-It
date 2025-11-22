import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerConsentPatchSchema } from '@/lib/validators/admin/customers';

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

      // Get pagination parameters (consent records are typically small, but add pagination for consistency)
      const { searchParams } = new URL(request.url);
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const pageSize = Math.min(
        Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
        100
      );
      const rangeStart = (page - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
        .from('customer_consent')
        .select('customer_id, channel, enabled, granted_at, revoked_at, source, updated_at', {
          count: 'exact',
        })
        .eq('customer_id', params.id)
        .range(rangeStart, rangeEnd);

      if (fetchError) {
        logger.error(
          'Failed to fetch customer consent records',
          {
            component: 'admin-customer-consent',
            action: 'fetch_failed',
            metadata: { customerId: params.id },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load customer consent' }, { status: 500 });
      }

      return NextResponse.json({
        consent: data ?? [],
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
    } catch (err) {
      logger.error(
        'Unexpected error fetching customer consent',
        {
          component: 'admin-customer-consent',
          action: 'fetch_unexpected',
          metadata: { customerId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

      const payload = customerConsentPatchSchema.parse(await request.json());

      const now = new Date().toISOString();
      const { data, error: upsertError } = await supabase
        .from('customer_consent')
        .upsert({
          customer_id: params.id,
          channel: payload.channel,
          enabled: payload.enabled,
          granted_at: payload.enabled ? now : null,
          revoked_at: payload.enabled ? null : now,
          source: payload.source ?? 'admin_update',
          updated_at: now,
        })
        .select()
        .single();

      if (upsertError) {
        logger.error(
          'Failed to update customer consent',
          {
            component: 'admin-customer-consent',
            action: 'update_failed',
            metadata: {
              customerId: params.id,
              channel: payload.channel,
              adminId: user?.id || 'unknown',
            },
          },
          upsertError
        );
        return NextResponse.json({ error: 'Unable to update consent preference' }, { status: 500 });
      }

      logger.info('Customer consent updated', {
        component: 'admin-customer-consent',
        action: 'consent_updated',
        metadata: {
          customerId: params.id,
          channel: payload.channel,
          adminId: user?.id || 'unknown',
        },
      });

      return NextResponse.json({ consent: data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating customer consent',
        {
          component: 'admin-customer-consent',
          action: 'update_unexpected',
          metadata: { customerId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
