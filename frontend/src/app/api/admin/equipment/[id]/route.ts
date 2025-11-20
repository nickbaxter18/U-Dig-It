// Removed unused import: createServerClient
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

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
  updatedAt: z.string().optional(),
});

/**
 * PATCH /api/admin/equipment/[id]
 * Update equipment details (admin only)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id || 'unknown')
      .single();

    if (userError || !userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      logger.warn('Non-admin attempted to update equipment', {
        component: 'admin-equipment-api',
        action: 'unauthorized_access',
        metadata: { userId: user?.id || 'unknown', attemptedAction: 'update_equipment' },
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = equipmentUpdateSchema.parse(body);

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error in admin equipment API',
      {
        component: 'admin-equipment-api',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
