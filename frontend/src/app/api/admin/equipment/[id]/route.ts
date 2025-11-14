import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      logger.warn('Non-admin attempted to update equipment', {
        component: 'admin-equipment-api',
        action: 'unauthorized_access',
        metadata: { userId: user.id, attemptedAction: 'update_equipment' },
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = equipmentUpdateSchema.parse(body);

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);

    // Update equipment with service role
    const { data, error } = await supabaseAdmin
      .from('equipment')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update equipment', {
        component: 'admin-equipment-api',
        action: 'update_error',
        metadata: { equipmentId: params.id, adminId: user.id },
      }, error);
      return NextResponse.json(
        { error: 'Failed to update equipment', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Equipment updated by admin', {
      component: 'admin-equipment-api',
      action: 'equipment_updated',
      metadata: {
        equipmentId: params.id,
        adminId: user.id,
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

    logger.error('Unexpected error in admin equipment API', {
      component: 'admin-equipment-api',
      action: 'unexpected_error',
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

