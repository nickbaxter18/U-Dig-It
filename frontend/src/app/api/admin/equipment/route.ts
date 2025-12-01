import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for equipment creation
// Note: location column is JSON type in database, so we accept string and convert it
const equipmentCreateSchema = z.object({
  unitId: z.string().min(1, 'Unit ID is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  dailyRate: z.number().min(0, 'Daily rate must be non-negative'),
  weeklyRate: z.number().min(0, 'Weekly rate must be non-negative'),
  monthlyRate: z.number().min(0, 'Monthly rate must be non-negative'),
  status: z.string().default('available'),
  location: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  lastMaintenanceDate: z.string().nullable().optional(),
  nextMaintenanceDue: z.string().nullable().optional(),
  totalEngineHours: z.number().min(0).default(0),
  type: z.string().default('svl75'),
  description: z.string().optional(),
  replacementValue: z.number().min(0, 'Replacement value must be non-negative'),
  overageHourlyRate: z.number().min(0, 'Overage hourly rate must be non-negative'),
  specifications: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/admin/equipment
 * Create new equipment (admin only)
 */
export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest) => {
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
      const validatedData = equipmentCreateSchema.parse(body);

      // Transform location field: database expects JSON, frontend sends string
      // Convert string location to JSON object { name: "location" }
      const insertPayload: Record<string, unknown> = { ...validatedData };
      if (typeof validatedData.location === 'string') {
        insertPayload.location = { name: validatedData.location };
      } else if (!validatedData.location) {
        insertPayload.location = { name: 'Main Yard' };
      }

      // Set default values for optional fields
      if (!insertPayload.specifications) {
        insertPayload.specifications = {};
      }

      // Create service role client for privileged operations
      const supabaseAdmin = await createServiceClient();

      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      // Insert equipment with service role
      const { data, error: equipmentInsertError } = await supabaseAdmin
        .from('equipment')
        .insert(insertPayload)
        .select()
        .single();

      if (equipmentInsertError) {
        logger.error(
          'Failed to create equipment',
          {
            component: 'admin-equipment-api',
            action: 'create_error',
            metadata: {
              unitId: validatedData.unitId,
              adminId: user?.id || 'unknown',
              error: equipmentInsertError.message,
            },
          },
          equipmentInsertError
        );
        return NextResponse.json(
          { error: 'Failed to create equipment', details: equipmentInsertError.message },
          { status: 500 }
        );
      }

      logger.info('Equipment created by admin', {
        component: 'admin-equipment-api',
        action: 'equipment_created',
        metadata: {
          equipmentId: data.id,
          unitId: validatedData.unitId,
          adminId: user?.id || 'unknown',
        },
      });

      return NextResponse.json({ data }, { status: 201 });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error in admin equipment creation API',
        {
          component: 'admin-equipment-api',
          action: 'create_unexpected_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

