import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { telematicsSnapshotCreateSchema } from '@/lib/validators/admin/equipment';

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

    const payload = telematicsSnapshotCreateSchema.parse(await request.json());

    const { data, error: insertError } = await supabase
      .from('telematics_snapshots')
      .insert({
        equipment_id: payload.equipmentId,
        captured_at: payload.capturedAt,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        engine_hours: payload.engineHours ?? null,
        battery_level: payload.batteryLevel ?? null,
        source: payload.source ?? null,
        raw_payload: payload.rawPayload ?? {},
      })
      .select()
      .single();

    if (insertError || !data) {
      logger.error(
        'Failed to ingest telematics snapshot',
        {
          component: 'admin-telematics-snapshots',
          action: 'ingest_failed',
          metadata: { equipmentId: payload.equipmentId, adminId: user?.id || 'unknown' },
        },
        insertError ?? new Error('Missing telematics snapshot data')
      );
      return NextResponse.json({ error: 'Unable to ingest telematics snapshot' }, { status: 500 });
    }

    logger.info('Telematics snapshot ingested', {
      component: 'admin-telematics-snapshots',
      action: 'snapshot_ingested',
      metadata: {
        snapshotId: data.id,
        equipmentId: payload.equipmentId,
        adminId: user?.id || 'unknown',
      },
    });

    return NextResponse.json({ snapshot: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error ingesting telematics snapshot',
      {
        component: 'admin-telematics-snapshots',
        action: 'ingest_unexpected',
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Internal server error while ingesting telematics snapshot' },
      { status: 500 }
    );
  }
});
