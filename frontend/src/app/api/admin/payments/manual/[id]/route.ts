import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { recalculateBookingBalance } from '@/lib/booking/balance';
import { updateBillingStatus } from '@/lib/booking/billing-status';
import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { manualPaymentUpdateSchema } from '@/lib/validators/admin/payments';

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    // Declare manualPaymentId outside try block for error handler access
    let manualPaymentId: string | undefined;
    try {
      // Handle params as either Promise or direct object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      manualPaymentId = resolvedParams?.id;

      if (
        !manualPaymentId ||
        manualPaymentId === 'undefined' ||
        manualPaymentId === 'null' ||
        typeof manualPaymentId !== 'string'
      ) {
        return NextResponse.json(
          { error: 'Manual payment ID is required and must be a valid UUID' },
          { status: 400 }
        );
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(manualPaymentId)) {
        return NextResponse.json({ error: 'Invalid manual payment ID format' }, { status: 400 });
      }

      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      const payload = manualPaymentUpdateSchema.parse(await request.json());

      if (Object.keys(payload).length === 0) {
        return NextResponse.json({ success: true });
      }

      const updateBody: Record<string, unknown> = {};
      if (payload.amount !== undefined) updateBody.amount = payload.amount;
      if (payload.status) updateBody.status = payload.status;
      if (payload.notes !== undefined) updateBody.notes = payload.notes ?? null;
      if (payload.attachments !== undefined) updateBody.attachments = payload.attachments;
      updateBody.updated_at = new Date().toISOString();

      // Fetch current manual payment to check status change
      const { data: currentPayment, error: fetchCurrentError } = await supabase
        .from('manual_payments')
        .select('id, booking_id, amount, status')
        .eq('id', manualPaymentId)
        .is('deleted_at', null)
        .single();

      if (fetchCurrentError || !currentPayment) {
        logger.error(
          'Failed to fetch current manual payment',
          {
            component: 'admin-manual-payments',
            action: 'fetch_current_failed',
            metadata: { manualPaymentId, error: fetchCurrentError?.message },
          },
          fetchCurrentError ?? new Error('Manual payment not found')
        );
        return NextResponse.json({ error: 'Manual payment not found' }, { status: 404 });
      }

      const { data, error: updateError } = await supabase
        .from('manual_payments')
        .update(updateBody)
        .eq('id', manualPaymentId)
        .is('deleted_at', null)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update manual payment',
          {
            component: 'admin-manual-payments',
            action: 'update_failed',
            metadata: {
              manualPaymentId,
              adminId: user?.id || 'unknown',
              errorCode: (updateError as any)?.code,
              errorMessage: updateError.message,
              errorDetails: (updateError as any)?.details,
              errorHint: (updateError as any)?.hint,
              updateBody,
            },
          },
          updateError
        );
        return NextResponse.json(
          {
            error: 'Unable to update manual payment',
            details:
              process.env.NODE_ENV === 'development'
                ? updateError.message || 'Database update failed'
                : undefined,
          },
          { status: 500 }
        );
      }

      // Recalculate balance if status changed or amount changed
      const statusChangedToCompleted =
        payload.status === 'completed' && currentPayment.status !== 'completed';
      const statusChangedFromCompleted =
        currentPayment.status === 'completed' && payload.status && payload.status !== 'completed';
      const amountChanged =
        payload.amount !== undefined && Number(payload.amount) !== Number(currentPayment.amount);

      // Recalculate balance if:
      // 1. Status changed to/from 'completed' (affects balance)
      // 2. Amount changed and payment was/is 'completed' (affects balance)
      const shouldRecalculate =
        statusChangedToCompleted ||
        statusChangedFromCompleted ||
        (amountChanged &&
          (currentPayment.status === 'completed' || payload.status === 'completed'));

      if (shouldRecalculate) {
        const newBalance = await recalculateBookingBalance(currentPayment.booking_id);
        if (newBalance === null) {
          logger.warn('Balance recalculation failed after manual payment update', {
            component: 'admin-manual-payments',
            action: 'balance_recalculation_failed',
            metadata: {
              bookingId: currentPayment.booking_id,
              manualPaymentId,
              statusChanged: statusChangedToCompleted || statusChangedFromCompleted,
              amountChanged,
            },
          });
          // Don't fail the request, but log the warning
        } else {
          // Update billing status after balance recalculation
          const newBillingStatus = await updateBillingStatus(currentPayment.booking_id);
          if (newBillingStatus === null) {
            logger.warn('Billing status update failed after manual payment update', {
              component: 'admin-manual-payments',
              action: 'billing_status_update_failed',
              metadata: {
                bookingId: currentPayment.booking_id,
                manualPaymentId,
              },
            });
          }

          // Update booking status based on balance
          const serviceClient = createServiceClient();
          if (serviceClient) {
            // Fetch current booking status to check if we need to update
            const { data: currentBooking } = await serviceClient
              .from('bookings')
              .select('status')
              .eq('id', currentPayment.booking_id)
              .single();

            if (newBalance === 0 && currentBooking?.status !== 'paid') {
              // Balance reached 0, update to paid
              const { error: statusUpdateError } = await serviceClient
                .from('bookings')
                .update({ status: 'paid' })
                .eq('id', currentPayment.booking_id);

              if (statusUpdateError) {
                logger.warn(
                  'Failed to update booking status to paid',
                  {
                    component: 'admin-manual-payments',
                    action: 'booking_status_update_failed',
                    metadata: {
                      bookingId: currentPayment.booking_id,
                      manualPaymentId,
                      error: statusUpdateError.message,
                    },
                  },
                  statusUpdateError
                );
              } else {
                logger.info('Booking status updated to paid after manual payment update', {
                  component: 'admin-manual-payments',
                  action: 'booking_status_updated',
                  metadata: {
                    bookingId: currentPayment.booking_id,
                    manualPaymentId,
                    newBalance,
                  },
                });
              }
            } else if (newBalance > 0 && currentBooking?.status === 'paid') {
              // Balance increased above 0, revert from paid if needed
              // Note: We might want to keep status as 'paid' if it was already paid via other means
              // This is a conservative approach - only revert if we're sure
              logger.debug('Balance increased above 0, but keeping booking status as paid', {
                component: 'admin-manual-payments',
                action: 'balance_increased_but_status_unchanged',
                metadata: {
                  bookingId: currentPayment.booking_id,
                  manualPaymentId,
                  newBalance,
                  currentStatus: currentBooking?.status,
                },
              });
            }
          }
        }
      }

      logger.info('Manual payment updated', {
        component: 'admin-manual-payments',
        action: 'manual_payment_updated',
        metadata: { manualPaymentId, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({ manualPayment: data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error updating manual payment',
        {
          component: 'admin-manual-payments',
          action: 'update_unexpected',
          metadata: {
            manualPaymentId: manualPaymentId || 'unknown',
            errorName: err instanceof Error ? err.name : typeof err,
            errorMessage: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
          },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json(
        {
          error: 'Internal server error',
          details:
            process.env.NODE_ENV === 'development' && err instanceof Error
              ? err.message
              : undefined,
        },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRateLimit(
  RateLimitPresets.VERY_STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    // Declare manualPaymentId outside try block for error handler access
    let manualPaymentId: string | undefined;
    let bookingId: string | undefined;
    let paymentStatus: string | undefined;
    try {
      // Handle params as either Promise or direct object (Next.js 16 compatibility)
      const resolvedParams = params instanceof Promise ? await params : params;
      manualPaymentId = resolvedParams?.id;

      if (
        !manualPaymentId ||
        manualPaymentId === 'undefined' ||
        manualPaymentId === 'null' ||
        typeof manualPaymentId !== 'string'
      ) {
        return NextResponse.json(
          { error: 'Manual payment ID is required and must be a valid UUID' },
          { status: 400 }
        );
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(manualPaymentId)) {
        return NextResponse.json({ error: 'Invalid manual payment ID format' }, { status: 400 });
      }

      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // Fetch payment before deleting to check if it was completed
      const { data: paymentToDelete, error: fetchError } = await supabase
        .from('manual_payments')
        .select('id, booking_id, status')
        .eq('id', manualPaymentId)
        .is('deleted_at', null)
        .single();

      if (fetchError || !paymentToDelete) {
        logger.error(
          'Failed to fetch manual payment before deletion',
          {
            component: 'admin-manual-payments',
            action: 'fetch_before_delete_failed',
            metadata: { manualPaymentId, error: fetchError?.message },
          },
          fetchError ?? new Error('Manual payment not found')
        );
        return NextResponse.json({ error: 'Manual payment not found' }, { status: 404 });
      }

      bookingId = paymentToDelete.booking_id;
      paymentStatus = paymentToDelete.status;

      const { error: deleteError } = await supabase
        .from('manual_payments')
        .update({ deleted_at: new Date().toISOString(), status: 'voided' })
        .eq('id', manualPaymentId);

      if (deleteError) {
        logger.error(
          'Failed to delete manual payment',
          {
            component: 'admin-manual-payments',
            action: 'delete_failed',
            metadata: {
              manualPaymentId,
              adminId: user?.id || 'unknown',
              errorCode: (deleteError as any)?.code,
              errorMessage: deleteError.message,
              errorDetails: (deleteError as any)?.details,
            },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to delete manual payment' }, { status: 500 });
      }

      logger.info('Manual payment soft deleted', {
        component: 'admin-manual-payments',
        action: 'manual_payment_deleted',
        metadata: { manualPaymentId, adminId: user?.id || 'unknown' },
      });

      // Recalculate balance if the deleted payment was 'completed'
      if (paymentStatus === 'completed' && bookingId) {
        const newBalance = await recalculateBookingBalance(bookingId);
        if (newBalance === null) {
          logger.warn('Balance recalculation failed after manual payment deletion', {
            component: 'admin-manual-payments',
            action: 'balance_recalculation_failed_after_delete',
            metadata: {
              bookingId,
              manualPaymentId,
              paymentStatus,
            },
          });
          // Don't fail the request, but log the warning
        } else {
          // Update billing status after balance recalculation
          const newBillingStatus = await updateBillingStatus(bookingId);
          if (newBillingStatus === null) {
            logger.warn('Billing status update failed after manual payment deletion', {
              component: 'admin-manual-payments',
              action: 'billing_status_update_failed_after_delete',
              metadata: {
                bookingId,
                manualPaymentId,
              },
            });
          }

          // If balance increased above 0, revert booking status from 'paid' if needed
          const serviceClient = createServiceClient();
          if (serviceClient && newBalance > 0) {
            const { data: currentBooking } = await serviceClient
              .from('bookings')
              .select('status')
              .eq('id', bookingId)
              .single();

            // Only revert if status was 'paid' and we're sure it should change
            // This is conservative - we don't want to revert if payment was already paid via other means
            if (currentBooking?.status === 'paid') {
              logger.debug(
                'Balance increased above 0 after payment deletion, but keeping status as paid',
                {
                  component: 'admin-manual-payments',
                  action: 'balance_increased_but_status_unchanged',
                  metadata: {
                    bookingId,
                    manualPaymentId,
                    newBalance,
                  },
                }
              );
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error(
        'Unexpected error deleting manual payment',
        {
          component: 'admin-manual-payments',
          action: 'delete_unexpected',
          metadata: {
            manualPaymentId: manualPaymentId || 'unknown',
            errorName: err instanceof Error ? err.name : typeof err,
            errorMessage: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
          },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json(
        {
          error: 'Internal server error',
          details:
            process.env.NODE_ENV === 'development' && err instanceof Error
              ? err.message
              : undefined,
        },
        { status: 500 }
      );
    }
  }
);
