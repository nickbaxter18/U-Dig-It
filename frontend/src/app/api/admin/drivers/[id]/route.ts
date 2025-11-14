import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // ✅ Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // ✅ Fetch driver from Supabase
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single();

    if (driverError) {
      if (driverError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }
      throw new Error(`Database error: ${driverError.message}`);
    }

    return NextResponse.json({
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
        currentLocation: driver.current_location,
        activeDeliveries: driver.active_deliveries,
        totalDeliveriesCompleted: driver.total_deliveries_completed
      }
    });
  } catch (error: any) {
    logger.error('Failed to fetch driver', {
      component: 'drivers-api',
      action: 'fetch_driver_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to fetch driver' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const { id } = params;
    const body = await request.json();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.licenseNumber !== undefined) updateData.license_number = body.licenseNumber;
    if (body.licenseExpiry !== undefined) updateData.license_expiry = body.licenseExpiry;
    if (body.vehicleType !== undefined) updateData.vehicle_type = body.vehicleType;
    if (body.vehicleRegistration !== undefined) updateData.vehicle_registration = body.vehicleRegistration;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isAvailable !== undefined) updateData.is_available = body.isAvailable;
    if (body.currentLocation !== undefined) updateData.current_location = body.currentLocation;
    if (body.activeDeliveries !== undefined) updateData.active_deliveries = body.activeDeliveries;
    if (body.totalDeliveriesCompleted !== undefined) updateData.total_deliveries_completed = body.totalDeliveriesCompleted;

    // Update driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (driverError) {
      if (driverError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }
      throw new Error(`Database error: ${driverError.message}`);
    }

    logger.info('Driver updated successfully', {
      component: 'drivers-api',
      action: 'update_driver',
      metadata: { driverId: id }
    });

    return NextResponse.json({
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
        currentLocation: driver.current_location,
        activeDeliveries: driver.active_deliveries,
        totalDeliveriesCompleted: driver.total_deliveries_completed
      }
    });
  } catch (error: any) {
    logger.error('Failed to update driver', {
      component: 'drivers-api',
      action: 'update_driver_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to update driver' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const { id } = params;

    // Check if driver has active deliveries
    const { data: activeDeliveries } = await supabase
      .from('delivery_assignments')
      .select('id')
      .eq('driver_id', id)
      .in('status', ['assigned', 'in_transit'])
      .limit(1);

    if (activeDeliveries && activeDeliveries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete driver with active deliveries' },
        { status: 400 }
      );
    }

    // Delete driver
    const { error: deleteError } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Database error: ${deleteError.message}`);
    }

    logger.info('Driver deleted successfully', {
      component: 'drivers-api',
      action: 'delete_driver',
      metadata: { driverId: id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to delete driver', {
      component: 'drivers-api',
      action: 'delete_driver_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to delete driver' },
      { status: 500 }
    );
  }
}
