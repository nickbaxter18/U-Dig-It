import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // ✅ Fetch drivers from Supabase
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true });

    if (driversError) {
      throw new Error(`Database error: ${driversError.message}`);
    }

    logger.info('Drivers fetched successfully', {
      component: 'drivers-api',
      action: 'fetch_drivers',
      metadata: { count: drivers?.length || 0 },
    });

    return NextResponse.json({
      drivers: drivers || [],
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
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehicleRegistration,
      notes,
      isAvailable = true,
    } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

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
  } catch (error: unknown) {
    logger.error(
      'Failed to create driver',
      {
        component: 'drivers-api',
        action: 'create_driver_error',
        metadata: { error: error.message },
      },
      error
    );

    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}
