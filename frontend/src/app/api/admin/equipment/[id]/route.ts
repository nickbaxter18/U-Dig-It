import { z, ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { generateEquipmentEmbedding } from '@/lib/embeddings/generate-equipment-embedding';
import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for equipment update
// Note: location column is JSON type in database, so we accept string and convert it
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
  location: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  lastMaintenanceDate: z.string().nullable().optional(),
  nextMaintenanceDue: z.string().nullable().optional(),
  totalEngineHours: z.number().optional(),
  updatedAt: z.string().optional(),
  // Missing fields from EquipmentModal
  type: z.string().optional(),
  description: z.string().optional(),
  replacementValue: z.number().optional(),
  overageHourlyRate: z.number().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
});

/**
 * PATCH /api/admin/equipment/[id]
 * Update equipment details (admin only)
 */
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      // Await params in Next.js 16 (params is a Promise)
      const { id } = await params;

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

      // Transform location field: database expects JSON, frontend sends string
      // Convert string location to JSON object { name: "location" }
      const updatePayload: Record<string, unknown> = { ...validatedData };
      if (typeof validatedData.location === 'string') {
        updatePayload.location = { name: validatedData.location };
      }

      // Remove updatedAt from payload if present (database handles this via trigger)
      delete updatePayload.updatedAt;

      // Create service role client for privileged operations
      const supabaseAdmin = await createServiceClient();

      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      // Update equipment with service role
      const { data, error: equipmentUpdateError } = await supabaseAdmin
        .from('equipment')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (equipmentUpdateError) {
        logger.error(
          'Failed to update equipment',
          {
            component: 'admin-equipment-api',
            action: 'update_error',
            metadata: { equipmentId: id, adminId: user?.id || 'unknown' },
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
          equipmentId: id,
          adminId: user?.id || 'unknown',
          updates: Object.keys(validatedData),
        },
      });

      // Automatically regenerate embedding if description or other search-relevant fields changed
      const embeddingFields = ['description', 'make', 'model', 'type', 'notes', 'specifications'];
      const shouldRegenerateEmbedding = Object.keys(validatedData).some((key) =>
        embeddingFields.includes(key)
      );

      if (shouldRegenerateEmbedding) {
        // Generate embedding asynchronously (don't block the response)
        generateEquipmentEmbedding(id).catch((error) => {
          logger.warn('Failed to regenerate embedding after equipment update', {
            component: 'admin-equipment-api',
            action: 'embedding_regeneration_failed',
            metadata: {
              equipmentId: id,
              error: error instanceof Error ? error.message : String(error),
            },
          });
        });
      }

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
