import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateSchema = z.object({
  // Contract fields
  status: z.string().optional(),
  signingDate: z.string().optional(),
  notes: z.string().optional(),

  // Insurance fields
  policyNumber: z.string().optional(),
  expirationDate: z.string().optional(),
  policyLimits: z.object({
    generalLiability: z.number().optional(),
    equipment: z.number().optional(),
  }).optional(),
  reviewNotes: z.string().optional(),

  // License fields
  verificationStatus: z.string().optional(),
  verificationNotes: z.string().optional(),

  // Payment fields
  amount: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentDate: z.string().optional(),
  paymentNotes: z.string().optional(),

  // Deposit fields
  depositAmount: z.number().optional(),
  depositMethod: z.string().optional(),
  depositDate: z.string().optional(),
  depositNotes: z.string().optional(),
});

export const PUT = withRateLimit(
  async (request: NextRequest, { params }: { params: { id: string; step: string } }) => {
    try {
      const adminUser = await requireAdmin(request);
      if (!adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id: bookingId, step } = params;
      const body = await request.json();

      // Validate request body
      const validated = updateSchema.parse(body);

      const supabaseAdmin = createServiceClient();

      // Verify booking exists
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        logger.error(
          'Booking not found for step update',
          {
            component: 'admin-step-update-api',
            action: 'booking_not_found',
            metadata: { bookingId, step },
          },
          bookingError
        );
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      let result;

      switch (step) {
        case 'contract_signed': {
          // Find contract for this booking
          const { data: contract, error: contractError } = await supabaseAdmin
            .from('contracts')
            .select('id')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (contractError) {
            logger.error(
              'Failed to find contract',
              {
                component: 'admin-step-update-api',
                action: 'contract_fetch_error',
                metadata: { bookingId },
              },
              contractError
            );
            return NextResponse.json({ error: 'Failed to find contract' }, { status: 500 });
          }

          if (!contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
          }

          const updateData: Record<string, unknown> = {};
          if (validated.status) updateData.status = validated.status;
          if (validated.signingDate) updateData.signedAt = validated.signingDate;
          if (validated.notes !== undefined) updateData.notes = validated.notes;

          const { data: updatedContract, error: updateError } = await supabaseAdmin
            .from('contracts')
            .update(updateData)
            .eq('id', contract.id)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to update contract',
              {
                component: 'admin-step-update-api',
                action: 'contract_update_error',
                metadata: { contractId: contract.id },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
          }

          result = updatedContract;
          break;
        }

        case 'insurance_uploaded': {
          // Find insurance document for this booking
          const { data: insuranceDoc, error: insuranceError } = await supabaseAdmin
            .from('insurance_documents')
            .select('id')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (insuranceError) {
            logger.error(
              'Failed to find insurance document',
              {
                component: 'admin-step-update-api',
                action: 'insurance_fetch_error',
                metadata: { bookingId },
              },
              insuranceError
            );
            return NextResponse.json({ error: 'Failed to find insurance document' }, { status: 500 });
          }

          if (!insuranceDoc) {
            return NextResponse.json({ error: 'Insurance document not found' }, { status: 404 });
          }

          const updateData: Record<string, unknown> = {};
          if (validated.policyNumber) updateData.policyNumber = validated.policyNumber;
          if (validated.expirationDate) updateData.expiresAt = validated.expirationDate;
          if (validated.policyLimits?.generalLiability) updateData.generalLiabilityLimit = validated.policyLimits.generalLiability;
          if (validated.policyLimits?.equipment) updateData.equipmentLimit = validated.policyLimits.equipment;
          if (validated.reviewNotes !== undefined) updateData.reviewNotes = validated.reviewNotes;

          const { data: updatedDoc, error: updateError } = await supabaseAdmin
            .from('insurance_documents')
            .update(updateData)
            .eq('id', insuranceDoc.id)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to update insurance document',
              {
                component: 'admin-step-update-api',
                action: 'insurance_update_error',
                metadata: { documentId: insuranceDoc.id },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to update insurance document' }, { status: 500 });
          }

          result = updatedDoc;
          break;
        }

        case 'license_uploaded': {
          // Find ID verification request for this booking
          const { data: verification, error: verificationError } = await supabaseAdmin
            .from('id_verification_requests')
            .select('id')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (verificationError) {
            logger.error(
              'Failed to find ID verification request',
              {
                component: 'admin-step-update-api',
                action: 'verification_fetch_error',
                metadata: { bookingId },
              },
              verificationError
            );
            return NextResponse.json({ error: 'Failed to find ID verification request' }, { status: 500 });
          }

          if (!verification) {
            return NextResponse.json({ error: 'ID verification request not found' }, { status: 404 });
          }

          const updateData: Record<string, unknown> = {};
          if (validated.verificationStatus) updateData.status = validated.verificationStatus;
          if (validated.verificationNotes !== undefined) updateData.notes = validated.verificationNotes;

          const { data: updatedVerification, error: updateError } = await supabaseAdmin
            .from('id_verification_requests')
            .update(updateData)
            .eq('id', verification.id)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to update ID verification request',
              {
                component: 'admin-step-update-api',
                action: 'verification_update_error',
                metadata: { requestId: verification.id },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to update ID verification request' }, { status: 500 });
          }

          result = updatedVerification;
          break;
        }

        case 'payment_completed': {
          // Find payment for this booking
          const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('bookingId', bookingId)
            .eq('type', 'payment')
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (paymentError) {
            logger.error(
              'Failed to find payment',
              {
                component: 'admin-step-update-api',
                action: 'payment_fetch_error',
                metadata: { bookingId },
              },
              paymentError
            );
            return NextResponse.json({ error: 'Failed to find payment' }, { status: 500 });
          }

          if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
          }

          const updateData: Record<string, unknown> = {};
          if (validated.amount) updateData.amount = validated.amount;
          if (validated.paymentMethod) updateData.method = validated.paymentMethod;
          if (validated.paymentDate) updateData.processedAt = validated.paymentDate;
          if (validated.paymentNotes !== undefined) updateData.notes = validated.paymentNotes;

          const { data: updatedPayment, error: updateError } = await supabaseAdmin
            .from('payments')
            .update(updateData)
            .eq('id', payment.id)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to update payment',
              {
                component: 'admin-step-update-api',
                action: 'payment_update_error',
                metadata: { paymentId: payment.id },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
          }

          result = updatedPayment;
          break;
        }

        case 'deposit_paid': {
          const updateData: Record<string, unknown> = {};
          if (validated.depositAmount) updateData.depositAmount = validated.depositAmount;
          if (validated.depositDate) updateData.depositPaidAt = validated.depositDate;
          if (validated.depositNotes !== undefined) updateData.depositNotes = validated.depositNotes;

          const { data: updatedBooking, error: updateError } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to update deposit',
              {
                component: 'admin-step-update-api',
                action: 'deposit_update_error',
                metadata: { bookingId },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to update deposit' }, { status: 500 });
          }

          result = updatedBooking;
          break;
        }

        default:
          return NextResponse.json({ error: 'Invalid step type' }, { status: 400 });
      }

      logger.info('Step updated successfully', {
        component: 'admin-step-update-api',
        action: 'step_updated',
        metadata: { bookingId, step, adminId: adminUser.id },
      });

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Validation error in step update',
          {
            component: 'admin-step-update-api',
            action: 'validation_error',
            metadata: { errors: error.errors },
          },
          error
        );
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
      }

      logger.error(
        'Unexpected error updating step',
        {
          component: 'admin-step-update-api',
          action: 'unexpected_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);


