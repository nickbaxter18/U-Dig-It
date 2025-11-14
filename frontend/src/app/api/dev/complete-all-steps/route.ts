/**
 * Development Helper: Complete All Booking Steps
 * FOR TESTING ONLY - Completes contract, insurance, and license
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { contractNumberFromBooking } from '@/lib/utils';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

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

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    }

    logger.info('Completing all booking steps for testing', {
      component: 'dev-complete-all-steps',
      action: 'start',
      metadata: { bookingId, userId: user.id },
    });

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customerId, bookingNumber')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership (or admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';

    if (booking.customerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const results = {
      contract: { success: false, message: '' },
      insurance: { success: false, message: '' },
      license: { success: false, message: '' },
    };

    // 1. Create/sign contract
    try {
      // Check if contract exists
      const { data: existingContract } = await supabase
        .from('contracts')
        .select('id, status')
        .eq('bookingId', bookingId)
        .single();

      if (!existingContract) {
        // Create contract
        const contractNumber = contractNumberFromBooking(booking.bookingNumber);

        const { error: contractError } = await supabase.from('contracts').insert({
          bookingId,
          contractNumber,
          status: 'signed',
          templateVersion: '1.0',
          termsVersion: '1.0',
          riderVersion: '1.0',
          generatedAt: new Date().toISOString(),
          signedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          signatures: {
            customer: {
              name: 'Test Signature',
              date: new Date().toISOString(),
              ip: 'localhost',
              timestamp: new Date().toISOString(),
              method: 'manual_dev_test',
            },
          },
        });

        if (contractError) throw contractError;
        results.contract = { success: true, message: 'Contract created and signed' };
      } else if (existingContract.status !== 'signed') {
        // Update existing contract
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            status: 'signed',
            signedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          })
          .eq('id', existingContract.id);

        if (updateError) throw updateError;
        results.contract = { success: true, message: 'Contract signed' };
      } else {
        results.contract = { success: true, message: 'Contract already signed' };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.contract = { success: false, message };
      logger.error(
        'Failed to complete contract',
        undefined,
        error instanceof Error ? error : new Error(message)
      );
    }

    // 2. Upload insurance (mock document)
    try {
      // Check if insurance already uploaded
      const { data: existingDocs } = await supabase
        .from('insurance_documents')
        .select('id')
        .eq('bookingId', bookingId);

      if (!existingDocs || existingDocs.length === 0) {
        const { error: insuranceError } = await supabase.from('insurance_documents').insert({
          bookingId,
          documentType: 'certificate_of_insurance',
          fileName: 'test-insurance.pdf',
          fileUrl: '/uploads/test-insurance.pdf',
          fileSize: 100000,
          mimeType: 'application/pdf',
          status: 'verified',
          uploadedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        });

        if (insuranceError) throw insuranceError;
        results.insurance = { success: true, message: 'Insurance document uploaded' };
      } else {
        results.insurance = { success: true, message: 'Insurance already uploaded' };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.insurance = { success: false, message };
      logger.error(
        'Failed to upload insurance',
        undefined,
        error instanceof Error ? error : new Error(message)
      );
    }

    // 3. Add driver's license to user profile
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('driversLicense, drivers_license_verified_at')
        .eq('id', booking.customerId)
        .single();

      if (!userProfile?.drivers_license_verified_at) {
        const nowIso = new Date().toISOString();
        const { error: licenseError } = await supabase
          .from('users')
          .update({
            driversLicense: 'TEST-DL-123456',
            drivers_license_number: 'TEST-DL-123456',
            drivers_license_verified_at: nowIso,
            updatedAt: nowIso,
          })
          .eq('id', booking.customerId);

        if (licenseError) throw licenseError;
        results.license = { success: true, message: 'ID verification approved' };
      } else {
        results.license = { success: true, message: 'ID verification already approved' };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.license = { success: false, message };
      logger.error(
        'Failed to add license',
        undefined,
        error instanceof Error ? error : new Error(message)
      );
    }

    logger.info('All steps completed for testing', {
      component: 'dev-complete-all-steps',
      action: 'success',
      metadata: { bookingId, results },
    });

    return NextResponse.json({
      success: true,
      message: 'All steps completed successfully',
      bookingId,
      bookingNumber: booking.bookingNumber,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      'Error completing all steps',
      {
        component: 'dev-complete-all-steps',
        action: 'error',
        metadata: { error: message },
      },
      error instanceof Error ? error : new Error(message)
    );

    return NextResponse.json({ error: message || 'Failed to complete steps' }, { status: 500 });
  }
}
