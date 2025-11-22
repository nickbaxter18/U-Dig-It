import { z } from 'zod';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const driverCreateSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(20),
  licenseNumber: z.string().max(50).optional(),
  licenseExpiry: z.string().datetime().optional().nullable(),
  vehicleType: z.string().max(50).optional(),
  vehicleRegistration: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  isAvailable: z.boolean().default(true),
});

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
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
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // ✅ Fetch drivers from Supabase with pagination
    const {
      data: drivers,
      error: driversError,
      count,
    } = await supabase
      .from('drivers')
      .select(
        'id, user_id, name, phone, license_number, license_expiry, is_available, current_location, active_deliveries, total_deliveries_completed, vehicle_type, vehicle_registration, notes, created_at, updated_at',
        { count: 'exact' }
      )
      .order('name', { ascending: true })
      .range(rangeStart, rangeEnd);

    if (driversError) {
      throw new Error(`Database error: ${driversError.message}`);
    }

    logger.info('Drivers fetched successfully', {
      component: 'drivers-api',
      action: 'fetch_drivers',
      metadata: { count: drivers?.length || 0, total: count || 0, page, pageSize },
    });

    return NextResponse.json({
      drivers: drivers || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: unknown) {
    logger.error(
      'Failed to fetch drivers',
      {
        component: 'drivers-api',
        action: 'fetch_drivers_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
});

export const POST = withRateLimit(RateLimitPresets.STRICT, async (request: NextRequest) => {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = driverCreateSchema.parse(body);
    const {
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehicleRegistration,
      notes,
      isAvailable = true,
    } = validated;

    // Create driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        name,
        phone,
        license_number: licenseNumber || null,
        license_expiry: licenseExpiry || null,
        vehicle_type: vehicleType || null,
        vehicle_registration: vehicleRegistration || null,
        notes: notes || null,
        is_available: isAvailable,
        active_deliveries: 0,
        total_deliveries_completed: 0,
      })
      .select()
      .single();

    if (driverError) {
      throw new Error(`Database error: ${driverError.message}`);
    }

    logger.info('Driver created successfully', {
      component: 'drivers-api',
      action: 'create_driver',
      metadata: { driverId: driver.id, name },
    });

    return NextResponse.json(
      {
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          licenseNumber: driver.license_number,
          licenseExpiry: driver.license_expiry,
          vehicleType: driver.vehicle_type,
          vehicleRegistration: driver.vehicle_registration,
          notes: driver.notes,
          isAvailable: driver.is_available,
          activeDeliveries: driver.active_deliveries,
          totalDeliveriesCompleted: driver.total_deliveries_completed,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Failed to create driver',
      {
        component: 'drivers-api',
        action: 'create_driver_error',
        metadata: { error: err instanceof Error ? err.message : String(err) },
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
});
