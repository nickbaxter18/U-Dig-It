/**
 * Generate Signed Contract PDF API Route
 * Creates a PDF with the customer's signature and uploads to Supabase Storage
 */
import { renderToBuffer } from '@react-pdf/renderer';

import React from 'react';

import { NextRequest, NextResponse } from 'next/server';

import SVL75EquipmentRiderDocument from '@/components/contracts/SVL75EquipmentRider';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = await req.json();

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID required' }, { status: 400 });
    }

    // Get contract with booking and customer details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        booking:bookingId (
          *,
          equipment:equipmentId (*),
          customer:customerId (*)
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      logger.error(
        'Contract fetch error',
        {
          component: 'api-generate-signed-pdf',
          action: 'contract_fetch_error',
          metadata: { contractError },
        },
        contractError instanceof Error ? contractError : undefined
      );
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify ownership
    const isAdmin =
      user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin';
    if (contract.booking.customerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized access to contract' }, { status: 403 });
    }

    // Check if contract is signed
    if (contract.status !== 'signed' || !contract.signatures?.customer) {
      return NextResponse.json({ error: 'Contract must be signed first' }, { status: 400 });
    }

    // Extract nested data
    const booking = contract.booking;
    const equipment = booking.equipment;
    const customer = booking.customer;

    // Prepare data for the rider PDF
    const riderData = {
      serialNumber: equipment.unitId || equipment.serialNumber || 'SVL75-001',
      hoursAtRelease: equipment.totalEngineHours || 0,
      attachments: equipment.attachments
        ? Array.isArray(equipment.attachments)
          ? equipment.attachments
          : [equipment.attachments]
        : ['Standard bucket'],
      rentalStart: new Date(booking.startDate).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      rentalEnd: new Date(booking.endDate).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      hourAllowanceDaily: 8,
      hourAllowanceWeekly: 40,
      overageRate: 65,
      deliveryPickupByOwner: !!booking.deliveryAddress,
      customerTowHaul: !booking.deliveryAddress,
      floatDeliveryFee: 150,
      deliveryFee: 150,
      renterName: `${customer.firstName} ${customer.lastName}`,
      renterPhone: customer.phone || 'N/A',
      renterCompany: customer.companyName || 'Individual',
      conditionNotes: booking.preRentalNotes || 'Equipment in good condition. Photos on file.',
      signedDate: new Date(contract.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      signedTime: new Date(contract.signedAt).toLocaleTimeString('en-US'),
      signatureImage: contract.signatures.customer.signature,
      ownerSignedDate: new Date(contract.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalAmount: booking.totalAmount,
      securityDeposit: booking.securityDeposit || 500,
      dailyRate: booking.dailyRate || 450,
      rentalDays: Math.ceil(
        (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    };

    // Generate PDF using the SVL75 Equipment Rider component
    const doc = React.createElement(SVL75EquipmentRiderDocument, { data: riderData }) as any;
    const pdfBuffer = await renderToBuffer(doc);

    // Upload PDF to Supabase Storage
    const fileName = `${user.id}/${contractId}-signed-${Date.now()}.pdf`;

    logger.debug('Uploading PDF to Storage', {
      component: 'api-generate-signed-pdf',
      action: 'upload_start',
      metadata: { fileName, bufferSize: pdfBuffer.byteLength },
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-contracts')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Upload error details', {
        component: 'api-generate-signed-pdf',
        action: 'upload_error',
        metadata: { error: JSON.stringify(uploadError, null, 2) },
      });
      return NextResponse.json(
        {
          error: 'Failed to upload signed contract',
          details: uploadError.message || uploadError,
        },
        { status: 500 }
      );
    }

    logger.debug('Upload successful', {
      component: 'api-generate-signed-pdf',
      action: 'upload_success',
      metadata: { uploadData },
    });

    // Generate a signed URL for private bucket access
    const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours
    let signedUrl: string | null = null;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('signed-contracts')
      .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      logger.warn('Unable to create signed URL with session client', {
        component: 'api-generate-signed-pdf',
        action: 'signed_url_warning',
        metadata: { error: signedError.message },
      });
    } else {
      signedUrl = signedData?.signedUrl ?? null;
    }

    if (!signedUrl) {
      const serviceClient = createServiceClient();
      if (serviceClient) {
        const { data: serviceSignedData, error: serviceSignedError } = await serviceClient.storage
          .from('signed-contracts')
          .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

        if (serviceSignedError) {
          logger.error(
            'Service client failed to create signed URL',
            {
              component: 'api-generate-signed-pdf',
              action: 'signed_url_error',
              metadata: { error: serviceSignedError.message },
            },
            serviceSignedError
          );
        } else {
          signedUrl = serviceSignedData?.signedUrl ?? null;
        }
      } else {
        logger.warn('Service role client unavailable for signed URL creation', {
          component: 'api-generate-signed-pdf',
          action: 'service_client_missing',
        });
      }
    }

    // Update contract with signed document URL
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        signedDocumentUrl: signedUrl,
        signedDocumentPath: fileName,
      })
      .eq('id', contractId);

    if (updateError) {
      logger.error(
        'Contract update error',
        {
          component: 'api-generate-signed-pdf',
          action: 'contract_update_error',
          metadata: { updateError },
        },
        updateError instanceof Error ? updateError : undefined
      );
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contractUrl: signedUrl,
      fileName,
    });
  } catch (error: unknown) {
    logger.error(
      'Error generating signed PDF',
      {
        component: 'api-generate-signed-pdf',
        action: 'pdf_generation_error',
        metadata: { error: error.message || 'Unknown error' },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate signed contract',
      },
      { status: 500 }
    );
  }
}
