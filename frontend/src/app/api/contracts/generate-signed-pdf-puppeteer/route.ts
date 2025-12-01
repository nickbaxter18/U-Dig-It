/**
 * Generate Signed Contract PDF using Puppeteer
 * Creates professional PDF with embedded signature image
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';

import { NextRequest, NextResponse } from 'next/server';

import { generateSignedContractHTML } from '@/lib/contract-pdf-template-comprehensive';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  let browser;

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

    logger.debug('📄 Generating PDF for contract', {
      component: 'api-generate-signed-pdf-puppeteer',
      action: 'debug',
      metadata: { contractId },
    });

    // Get contract with comprehensive booking and customer details
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
          component: 'api-generate-signed-pdf-puppeteer',
          action: 'error',
          metadata: { error: contractError?.message },
        },
        contractError || undefined
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
    const signature = contract.signatures.customer;

    // Calculate rental days
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get insurance documents if available
    const { data: insuranceDocs } = await supabase
      .from('insurance_documents')
      .select(
        'id, bookingId, insuranceCompany, policyNumber, effectiveDate, expiresAt, generalLiabilityLimit, equipmentLimit, status, metadata'
      )
      .eq('bookingId', booking.id)
      .eq('status', 'approved')
      .limit(1)
      .single();

    // Prepare contract data with signature data as fallback for missing user profile info
    const contractData = {
      contractNumber: contract.contractNumber,
      bookingNumber: booking.bookingNumber,
      createdAt: contract.createdAt,
      signedAt: contract.signedAt,

      // Customer info - use signature data as fallback if user profile incomplete
      customerName:
        customer.firstName && customer.lastName
          ? `${customer.firstName} ${customer.lastName}`
          : signature.name || 'Customer',
      customerEmail: customer.email,
      customerPhone: customer.phone || signature.phone || 'Not provided',
      customerCompany: customer.companyName || booking.companyName || undefined,

      // Equipment details - enhanced with specifications
      equipmentModel: `${equipment.make} ${equipment.model}`,
      equipmentSerial: equipment.unitId || equipment.serialNumber || 'SVL75-001',
      equipmentHours: equipment.totalEngineHours || 0,
      attachments: equipment.attachments
        ? Array.isArray(equipment.attachments)
          ? equipment.attachments
          : [equipment.attachments]
        : ['Standard bucket'],
      equipmentWeight: equipment.specifications?.operatingWeight || '17,990 lbs',
      equipmentCapacity: equipment.specifications?.bucketCapacity || '0.46 yd³',

      // Rental period - enhanced with delivery time and special instructions
      startDate: startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      endDate: endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      rentalDays,
      deliveryAddress: booking.deliveryAddress || 'Pickup at yard',
      deliveryTime: booking.deliveryTime || booking.preferredDeliveryTime || undefined,
      specialInstructions: booking.specialInstructions || undefined,

      // Financial details
      dailyRate: booking.dailyRate || equipment.dailyRate || 450,
      totalAmount: booking.totalAmount,
      securityDeposit: booking.securityDeposit || 500,
      deliveryFee: booking.deliveryFee || 150,

      // Insurance information (if uploaded)
      insuranceCompany: insuranceDocs?.insuranceCompany || undefined,
      insurancePolicyNumber: insuranceDocs?.policyNumber || undefined,
      insuranceCoverage: insuranceDocs?.coverageAmount
        ? `$${parseFloat(insuranceDocs.coverageAmount).toLocaleString()} CAD`
        : undefined,

      // Timeline
      bookingCreatedAt: new Date(booking.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      bookingConfirmedAt: booking.confirmedAt
        ? new Date(booking.confirmedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,

      // Signature information
      signatureImage: signature.signature,
      signerTypedName: signature.name || `${customer.firstName} ${customer.lastName}`,
      signerInitials:
        signature.initials || customer.firstName.charAt(0) + customer.lastName.charAt(0),
      signedDate: new Date(contract.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      signedTime: new Date(contract.signedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Generate HTML
    let html = generateSignedContractHTML(contractData);

    // Embed logo as watermark (base64)
    try {
      const logoPath = join(process.cwd(), 'b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG');
      const logoBuffer = readFileSync(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

      // Replace the placeholder URL with base64
      html = html.replace("url('/images/udigit-logo.png')", `url('${logoBase64}')`);

      logger.debug('✅ Logo watermark embedded', {
        component: 'api-generate-signed-pdf-puppeteer',
        action: 'debug',
        metadata: { logoSize: logoBuffer.length },
      });
    } catch {
      logger.warn('⚠️ Could not embed logo watermark, using text watermark', {
        component: 'api-generate-signed-pdf-puppeteer',
        action: 'warn',
      });
    }

    logger.debug('🚀 Launching Puppeteer...', {
      component: 'api-generate-signed-pdf-puppeteer',
      action: 'debug',
    });

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set page content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    logger.debug('📄 Generating PDF...', {
      component: 'api-generate-signed-pdf-puppeteer',
      action: 'debug',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    logger.debug('📤 Uploading PDF to Storage...', {
      component: 'api-generate-signed-pdf-puppeteer',
      action: 'debug',
    });

    // Upload to Supabase Storage
    const fileName = `${user.id}/${contractId}-signed-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-contracts')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      logger.error(
        '❌ Upload error',
        {
          component: 'api-generate-signed-pdf-puppeteer',
          action: 'error',
          metadata: { error: uploadError?.message },
        },
        uploadError || undefined
      );
      return NextResponse.json(
        {
          error: 'Failed to upload signed contract',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    logger.debug('✅ Upload successful', {
      component: 'api-generate-signed-pdf-puppeteer',
      action: 'debug',
      metadata: { path: uploadData?.path },
    });

    // Generate a signed URL for the private bucket
    const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours
    let signedUrl: string | null = null;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('signed-contracts')
      .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      logger.warn('Unable to create signed URL using session client', {
        component: 'api-generate-signed-pdf-puppeteer',
        action: 'signed_url_warning',
        metadata: { error: signedError.message },
      });
    } else {
      signedUrl = signedData?.signedUrl ?? null;
    }

    if (!signedUrl) {
      const serviceClient = await createServiceClient();
      if (serviceClient) {
        const { data: serviceSignedData, error: serviceSignedError } = await serviceClient.storage
          .from('signed-contracts')
          .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

        if (serviceSignedError) {
          logger.error(
            'Service client failed to create signed URL',
            {
              component: 'api-generate-signed-pdf-puppeteer',
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
          component: 'api-generate-signed-pdf-puppeteer',
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
          component: 'api-generate-signed-pdf-puppeteer',
          action: 'error',
          metadata: { error: updateError?.message },
        },
        updateError || undefined
      );
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
    }

    logger.debug('✅ PDF generation complete!', {
      component: 'api-generate-signed-pdf-puppeteer',
      action: 'debug',
    });

    return NextResponse.json({
      success: true,
      contractUrl: signedUrl,
      fileName,
    });
  } catch (error: unknown) {
    logger.error(
      'Error generating signed PDF',
      {
        component: 'api-generate-signed-pdf-puppeteer',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );

    // Cleanup browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        logger.error(
          'Error closing browser',
          {
            component: 'api-generate-signed-pdf-puppeteer',
            action: 'error',
            metadata: { error: e instanceof Error ? e.message : String(e) },
          },
          e instanceof Error ? e : undefined
        );
      }
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate signed contract',
      },
      { status: 500 }
    );
  }
}
