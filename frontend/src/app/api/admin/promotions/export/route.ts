import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

function formatCsvValue(value: unknown) {
  const asString = value === null || value === undefined ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const { data, error: queryError } = await supabase
      .from('discount_codes')
      .select(
        'code, name, type, value, max_uses, used_count, max_uses_per_user, min_booking_amount, valid_from, valid_until, is_active, created_at'
      )
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;

    const header = [
      'Code',
      'Name',
      'Type',
      'Value',
      'Max Uses',
      'Used Count',
      'Max Uses Per User',
      'Min Booking Amount',
      'Valid From',
      'Valid Until',
      'Active',
      'Created At',
    ];

    const rows = (data ?? []).map((discount) => [
      discount.code ?? 'N/A',
      discount.name ?? '',
      discount.type ?? '',
      Number(discount.value ?? 0).toFixed(2),
      discount.max_uses ?? '',
      discount.used_count ?? 0,
      discount.max_uses_per_user ?? 1,
      discount.min_booking_amount !== null && discount.min_booking_amount !== undefined
        ? Number(discount.min_booking_amount).toFixed(2)
        : '',
      discount.valid_from ? new Date(discount.valid_from).toLocaleDateString() : '',
      discount.valid_until ? new Date(discount.valid_until).toLocaleDateString() : '',
      discount.is_active ? 'Yes' : 'No',
      discount.created_at ? new Date(discount.created_at).toLocaleDateString() : '',
    ]);

    const csvContent = [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `promotions-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(
      'Promotions export failed',
      {
        component: 'admin-promotions-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export promotions' }, { status: 500 });
  }
});
