import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const bulkExportSchema = z.object({
  equipmentIds: z.array(z.string().uuid()).min(1),
  format: z.enum(['csv', 'pdf']).default('csv'),
});

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

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const payload = bulkExportSchema.parse(await request.json());
    const { equipmentIds, format } = payload;

    // Fetch equipment with stats
    const { data: equipment, error: fetchError } = await supabase
      .from('equipment')
      .select(
        `
        id,
        unitId,
        make,
        model,
        serialNumber,
        status,
        location,
        dailyRate,
        weeklyRate,
        monthlyRate,
        year,
        createdAt,
        nextMaintenanceDue
      `
      )
      .in('id', equipmentIds);

    if (fetchError) {
      throw fetchError;
    }

    if (!equipment || equipment.length === 0) {
      return NextResponse.json({ error: 'No equipment found' }, { status: 404 });
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Unit ID',
        'Make',
        'Model',
        'Serial Number',
        'Status',
        'Location',
        'Daily Rate',
        'Weekly Rate',
        'Monthly Rate',
        'Year',
        'Next Maintenance Due',
        'Created At',
      ];

      const rows = equipment.map((eq: unknown) => [
        eq.unitId || '',
        eq.make || '',
        eq.model || '',
        eq.serialNumber || '',
        eq.status || '',
        eq.location || '',
        eq.dailyRate ? `$${parseFloat(eq.dailyRate).toFixed(2)}` : '$0.00',
        eq.weeklyRate ? `$${parseFloat(eq.weeklyRate).toFixed(2)}` : '$0.00',
        eq.monthlyRate ? `$${parseFloat(eq.monthlyRate).toFixed(2)}` : '$0.00',
        eq.year || '',
        eq.nextMaintenanceDue ? new Date(eq.nextMaintenanceDue).toLocaleDateString() : '',
        eq.createdAt ? new Date(eq.createdAt).toLocaleString() : '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      logger.info('Bulk equipment export completed', {
        component: 'admin-equipment-bulk-export',
        action: 'export_csv',
        metadata: { adminId: user?.id || 'unknown', equipmentCount: equipment.length },
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="equipment-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'PDF export not yet implemented. Please use CSV format.' },
        { status: 501 }
      );
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Failed to perform equipment bulk export',
      { component: 'admin-equipment-bulk-export', action: 'error' },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to perform bulk export' }, { status: 500 });
  }
}
