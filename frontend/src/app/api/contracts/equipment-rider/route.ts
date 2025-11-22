/**
 * Equipment Rider API
 * Generates equipment-specific rider PDFs for rentals
 */
import { renderToBuffer } from '@react-pdf/renderer';

import React from 'react';

import { NextRequest, NextResponse } from 'next/server';

import SVL75EquipmentRiderDocument from '@/components/contracts/SVL75EquipmentRider';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

interface RiderData {
  serialNumber?: string;
  hoursAtRelease?: number;
  attachments?: string[];
  rentalStart?: string;
  rentalEnd?: string;
  hourAllowanceDaily?: number;
  hourAllowanceWeekly?: number;
  overageRate?: number;
  deliveryIncluded?: boolean;
  pickupIncluded?: boolean;
  deliveryFee?: number;
  renterName?: string;
  renterPhone?: string;
  renterLicense?: string;
  renterCompany?: string;
  conditionNotes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, format = 'pdf' } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details with equipment information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        equipment:equipmentId (
          id,
          unitId,
          serialNumber,
          model,
          type,
          make,
          replacementValue,
          totalEngineHours,
          attachments,
          riderRequired:rider_required,
          riderTemplateId:rider_template_id,
          riderVersion:rider_version
        )
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error(
        'Booking fetch error',
        {
          component: 'api-equipment-rider',
          action: 'error',
          metadata: { error: bookingError?.message },
        },
        bookingError || undefined
      );
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user owns this booking or is admin
    const isAdmin =
      user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin';
    if (booking.customerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Check if equipment requires a rider
    const equipment = booking.equipment as any;
    if (!equipment?.riderRequired) {
      return NextResponse.json(
        {
          error: 'Equipment does not require a specific rider document',
          equipmentModel: equipment?.model,
        },
        { status: 400 }
      );
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, firstName, lastName, phone, companyName')
      .eq('id', booking.customerId)
      .single();

    if (customerError) {
      logger.error(
        'Customer fetch error',
        {
          component: 'api-equipment-rider',
          action: 'error',
          metadata: { error: customerError?.message },
        },
        customerError || undefined
      );
    }

    // Prepare rider data from booking
    const riderData: RiderData = {
      serialNumber: equipment.unitId || equipment.serialNumber,
      hoursAtRelease: equipment.totalEngineHours || 0,
      attachments: equipment.attachments
        ? Array.isArray(equipment.attachments)
          ? equipment.attachments
          : []
        : [],
      rentalStart: new Date(booking.startDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      rentalEnd: new Date(booking.endDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      hourAllowanceDaily: booking.hourAllowanceDaily || 8,
      hourAllowanceWeekly: booking.hourAllowanceWeekly || 40,
      overageRate: booking.overageHourlyRate || 65,
      deliveryIncluded: booking.deliveryIncluded || false,
      pickupIncluded: booking.pickupIncluded || false,
      deliveryFee: booking.deliveryFee || 150,
      renterName: customer ? `${customer.firstName} ${customer.lastName}` : '',
      renterPhone: customer?.phone || '',
      renterCompany: customer?.companyName || '',
      conditionNotes: booking.preRentalNotes || '',
    };

    // Generate PDF based on equipment type
    let pdfBuffer: Buffer;

    if (
      equipment.model.toLowerCase().includes('svl') &&
      (equipment.model.toLowerCase().includes('75') ||
        equipment.model.toLowerCase().includes('svl75'))
    ) {
      // Generate SVL75-3 rider
      const doc = React.createElement(SVL75EquipmentRiderDocument, { data: riderData }) as any;
      pdfBuffer = await renderToBuffer(doc);
    } else {
      return NextResponse.json(
        {
          error: 'No rider template available for this equipment model',
          equipmentModel: equipment.model,
        },
        { status: 400 }
      );
    }

    // Return PDF
    if (format === 'json') {
      // Return base64 encoded PDF for embedding
      return NextResponse.json({
        success: true,
        pdf: pdfBuffer.toString('base64'),
        filename: `SVL75-3-Equipment-Rider-${bookingId}.pdf`,
        contentType: 'application/pdf',
      });
    } else {
      // Return PDF file directly
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="SVL75-3-Equipment-Rider-${bookingId}.pdf"`,
        },
      });
    }
  } catch (error: unknown) {
    logger.error(
      'Equipment rider generation error',
      {
        component: 'api-equipment-rider',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate equipment rider',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if equipment requires a rider
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const equipmentId = searchParams.get('equipmentId');

    if (!bookingId && !equipmentId) {
      return NextResponse.json(
        {
          error: 'Either bookingId or equipmentId required',
        },
        { status: 400 }
      );
    }

    let equipment: unknown;

    if (bookingId) {
      // Get equipment from booking
      const { data: booking } = await supabase
        .from('bookings')
        .select(
          `
          equipment:equipmentId (
            model,
            type,
            riderRequired:rider_required,
            riderTemplateId:rider_template_id,
            riderVersion:rider_version
          )
        `
        )
        .eq('id', bookingId)
        .single();

      equipment = booking?.equipment;
    } else if (equipmentId) {
      // Get equipment directly
      const { data } = await supabase
        .from('equipment')
        .select(
          'model, type, riderRequired:rider_required, riderTemplateId:rider_template_id, riderVersion:rider_version'
        )
        .eq('id', equipmentId)
        .single();

      equipment = data;
    }

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({
      requiresRider: equipment.riderRequired || false,
      riderTemplate: equipment.riderTemplateId || null,
      riderVersion: equipment.riderVersion || null,
      equipmentModel: equipment.model,
      equipmentType: equipment.type,
    });
  } catch (error: unknown) {
    logger.error(
      'Equipment rider check error',
      {
        component: 'api-equipment-rider',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: error.message || 'Failed to check equipment rider requirement',
      },
      { status: 500 }
    );
  }
}
