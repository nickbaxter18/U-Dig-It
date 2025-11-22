import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for equipment update
const equipmentUpdateSchema = z.object({
  unitId: z.string().optional(),
  serialNumber: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  dailyRate: z.number().optional(),
  weeklyRate: z.number().optional(),
  monthlyRate: z.number().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  lastMaintenanceDate: z.string().nullable().optional(),
  nextMaintenanceDue: z.string().nullable().optional(),
  totalEngineHours: z.number().optional(),
  updatedAt: z.string().optional(),
});

/**
 * PATCH /api/admin/equipment/[id]
 * Update equipment details (admin only)
 */
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

      // Parse and validate request body
      const body = await request.json();
      const validatedData = equipmentUpdateSchema.parse(body);

      // Create service role client for privileged operations
      const supabaseAdmin = createServiceClient();

      // Update equipment with service role
      const { data, error: equipmentUpdateError } = await supabaseAdmin
        .from('equipment')
        .update(validatedData)
        .eq('id', params.id)
        .select()
        .single();

      if (equipmentUpdateError) {
        logger.error(
          'Failed to update equipment',
          {
            component: 'admin-equipment-api',
            action: 'update_error',
            metadata: { equipmentId: params.id, adminId: user?.id || 'unknown' },
          },
          equipmentUpdateError
        );
        return NextResponse.json(
          { error: 'Failed to update equipment', details: equipmentUpdateError.message },
          { status: 500 }
        );
      }

      logger.info('Equipment updated by admin', {
        component: 'admin-equipment-api',
        action: 'equipment_updated',
        metadata: {
          equipmentId: params.id,
          adminId: user?.id || 'unknown',
          updates: Object.keys(validatedData),
        },
      });

      return NextResponse.json({ data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error in admin equipment API',
        {
          component: 'admin-equipment-api',
          action: 'unexpected_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
