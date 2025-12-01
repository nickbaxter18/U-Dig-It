import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

const driverUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(10).max(20).optional(),
  licenseNumber: z.string().max(50).nullable().optional(),
  licenseExpiry: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'License expiry must be in YYYY-MM-DD format'), z.null()])
    .optional()
    .nullable(),
  vehicleType: z.string().max(50).nullable().optional(),
  vehicleRegistration: z.string().max(50).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isAvailable: z.boolean().optional(),
  currentLocation: z.string().max(200).nullable().optional(),
  activeDeliveries: z.number().int().min(0).optional(),
  totalDeliveriesCompleted: z.number().int().min(0).optional(),
});

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id } = resolvedParams;

      // Validate id is present and is a valid UUID format
      if (!id || id === 'undefined' || id.trim() === '') {
        return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
      }

      // ✅ Fetch driver from Supabase
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select(
          'id, user_id, name, phone, license_number, license_expiry, is_available, current_location, active_deliveries, total_deliveries_completed, vehicle_type, vehicle_registration, notes, created_at, updated_at'
        )
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
          totalDeliveriesCompleted: driver.total_deliveries_completed,
        },
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to fetch driver',
        {
          component: 'drivers-api',
          action: 'fetch_driver_error',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 });
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id } = resolvedParams;

      // Validate id is present and is a valid UUID format
      if (!id || id === 'undefined' || id.trim() === '') {
        return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
      }

      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: `Invalid driver ID format: ${id}` },
          { status: 400 }
        );
      }
      const body = await request.json();

      // Preprocess: Convert empty strings to null for optional fields
      const preprocessedBody: Record<string, unknown> = { ...body };
      const optionalStringFields = [
        'licenseNumber',
        'licenseExpiry',
        'vehicleType',
        'vehicleRegistration',
        'notes',
        'currentLocation',
      ];

      for (const field of optionalStringFields) {
        if (field in preprocessedBody) {
          const value = preprocessedBody[field];
          if (value === null || value === undefined) {
            preprocessedBody[field] = null;
          } else if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') {
              preprocessedBody[field] = null;
            } else {
              preprocessedBody[field] = trimmed;
            }
          }
        }
      }

      // Validate request body
      let validated;
      try {
        validated = driverUpdateSchema.parse(preprocessedBody);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          logger.error(
            'Driver update validation failed',
            {
              component: 'drivers-api',
              action: 'validation_error',
              metadata: {
                driverId: id,
                errors: validationError.issues,
                receivedBody: preprocessedBody,
              },
            },
            validationError
          );
          return NextResponse.json(
            { error: 'Invalid request data', details: validationError.issues },
            { status: 400 }
          );
        }
        throw validationError;
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.phone !== undefined) updateData.phone = validated.phone;
      if (validated.licenseNumber !== undefined)
        updateData.license_number = validated.licenseNumber || null;
      if (validated.licenseExpiry !== undefined)
        updateData.license_expiry = validated.licenseExpiry && validated.licenseExpiry.trim() ? validated.licenseExpiry.trim() : null;
      if (validated.vehicleType !== undefined) updateData.vehicle_type = validated.vehicleType || null;
      if (validated.vehicleRegistration !== undefined)
        updateData.vehicle_registration = validated.vehicleRegistration || null;
      if (validated.notes !== undefined) updateData.notes = validated.notes || null;
      if (validated.isAvailable !== undefined) updateData.is_available = validated.isAvailable;
      if (validated.currentLocation !== undefined)
        updateData.current_location = validated.currentLocation || null;
      if (validated.activeDeliveries !== undefined)
        updateData.active_deliveries = validated.activeDeliveries;
      if (validated.totalDeliveriesCompleted !== undefined)
        updateData.total_deliveries_completed = validated.totalDeliveriesCompleted;

      // Update driver
      logger.debug('Updating driver', {
        component: 'drivers-api',
        action: 'update_driver',
        metadata: {
          driverId: id,
          updateData: Object.keys(updateData),
        },
      });

      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (driverError) {
        logger.error(
          'Database error updating driver',
          {
            component: 'drivers-api',
            action: 'database_error',
            metadata: {
              driverId: id,
              errorCode: driverError.code,
              errorMessage: driverError.message,
              errorDetails: driverError.details,
              updateData: Object.keys(updateData),
            },
          },
          driverError as Error
        );

        if (driverError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }
        return NextResponse.json(
          {
            error: 'Failed to update driver',
            details: driverError.message,
            code: driverError.code,
          },
          { status: 500 }
        );
      }

      logger.info('Driver updated successfully', {
        component: 'drivers-api',
        action: 'update_driver',
        metadata: { driverId: id },
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
          totalDeliveriesCompleted: driver.total_deliveries_completed,
        },
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Failed to update driver',
        {
          component: 'drivers-api',
          action: 'update_driver_error',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
    }
  }
);

export const DELETE = withRateLimit(
  RateLimitPresets.VERY_STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Handle params as Promise or object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      const { id } = resolvedParams;

      // Validate id is present and is a valid UUID format
      if (!id || id === 'undefined' || id.trim() === '') {
        return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
      }

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
      const { error: deleteError } = await supabase.from('drivers').delete().eq('id', id);

      if (deleteError) {
        throw new Error(`Database error: ${deleteError.message}`);
      }

      logger.info('Driver deleted successfully', {
        component: 'drivers-api',
        action: 'delete_driver',
        metadata: { driverId: id },
      });

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      logger.error(
        'Failed to delete driver',
        {
          component: 'drivers-api',
          action: 'delete_driver_error',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
    }
  }
);
