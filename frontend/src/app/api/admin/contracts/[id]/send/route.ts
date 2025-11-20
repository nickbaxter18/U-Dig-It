import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createInAppNotification } from '@/lib/notification-service';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

/**
 * POST /api/admin/contracts/[id]/send
 * Send contract to customer for signature
 *
 * Admin-only endpoint
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // 1. Verify authentication
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

    // 2. Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id || 'unknown')
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // 3. Fetch contract and associated booking
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        id,
        "contractNumber",
        "bookingId",
        type,
        status,
        "documentUrl",
        booking:bookingId (
          id,
          bookingNumber,
          customer:customerId (
            email,
            firstName,
            lastName
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (contractError) throw contractError;

    if (!contractData) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract: any = contractData;

    if (contract.status !== 'draft') {
      return NextResponse.json(
        { error: 'Contract must be in draft status to send' },
        { status: 400 }
      );
    }

    // 4. Update contract status to sent_for_signature
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 5. Contract ready for customer signing via EnhancedContractSigner
    // For now, we'll create a notification for the customer
    const customerEmail = contract.booking?.customer?.email;
    const customerName =
      `${contract.booking?.customer?.firstName || ''} ${contract.booking?.customer?.lastName || ''}`.trim();

    if (customerEmail) {
      let notificationError: Error | null = null;

      try {
        await createInAppNotification({
          supabase,
          userId: contract.booking?.customer?.id || null,
          category: 'booking',
          priority: 'high',
          title: 'Contract Ready for Signature',
          message: `Your rental contract ${contract.contractNumber} is ready for signature. Please review and sign the document.`,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
          ctaLabel: 'Review contract',
          templateId: 'contract_signature_request',
          templateData: {
            contractNumber: contract.contractNumber,
            bookingNumber: contract.booking?.bookingNumber,
            customerName,
            pdfUrl: contract.documentUrl,
          },
          metadata: {
            contractId: id,
            bookingId: contract.booking?.id,
          },
          status: 'pending',
        });
      } catch (error: unknown) {
        notificationError = error instanceof Error ? error : new Error(String(error));
      }

      if (notificationError) {
        logger.warn('Failed to create notification', {
          component: 'contracts-send-api',
          action: 'notification_error',
          metadata: { contractId: id, error: notificationError.message },
        });
      }
    }

    logger.info('Contract sent for signature', {
      component: 'contracts-send-api',
      action: 'send_success',
      metadata: {
        contractId: id,
        contractNumber: contract.contractNumber,
        adminId: user?.id || 'unknown',
        customerEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Contract ${contract.contractNumber} sent to ${customerName} at ${customerEmail}`,
    });
  } catch (error: unknown) {
    logger.error(
      'Contract send error',
      {
        component: 'contracts-send-api',
        action: 'error',
      },
      error
    );

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
