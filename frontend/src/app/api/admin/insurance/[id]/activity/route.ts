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

      // Get pagination parameters
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
        .from('insurance_activity')
        .select('id, insurance_document_id, action, actor_id, details, created_at', {
          count: 'exact',
        })
        .eq('insurance_document_id', params.id)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);

      if (fetchError) {
        logger.error(
          'Failed to fetch insurance activity',
          {
            component: 'admin-insurance-activity',
            action: 'fetch_failed',
            metadata: { insuranceId: params.id },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load insurance activity' }, { status: 500 });
      }

      return NextResponse.json({
        activity: data ?? [],
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
    } catch (err) {
      logger.error(
        'Unexpected error fetching insurance activity',
        {
          component: 'admin-insurance-activity',
          action: 'fetch_unexpected',
          metadata: { insuranceId: params.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
