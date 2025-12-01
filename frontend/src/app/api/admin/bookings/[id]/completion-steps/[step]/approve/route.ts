import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireAdmin } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const approveSchema = z.object({
  notes: z.string().optional(),
});

export const POST = withRateLimit(
  async (request: NextRequest, { params }: { params: { id: string; step: string } }) => {
    try {
      const adminUser = await requireAdmin(request);
      if (!adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { id: bookingId, step } = params;
      const body = await request.json();
      const validated = approveSchema.parse(body);

      const supabaseAdmin = createServiceClient();

      // Verify booking exists
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      let result;

      switch (step) {
        case 'insurance_uploaded': {
          // Find insurance document
          const { data: insuranceDoc, error: insuranceError } = await supabaseAdmin
            .from('insurance_documents')
            .select('id, status')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (insuranceError || !insuranceDoc) {
            return NextResponse.json({ error: 'Insurance document not found' }, { status: 404 });
          }

          const { data: updatedDoc, error: updateError } = await supabaseAdmin
            .from('insurance_documents')
            .update({
              status: 'approved',
              reviewedAt: new Date().toISOString(),
              reviewedBy: adminUser.id,
              reviewNotes: validated.notes || null,
            })
            .eq('id', insuranceDoc.id)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to approve insurance document',
              {
                component: 'admin-step-approve-api',
                action: 'insurance_approve_error',
                metadata: { documentId: insuranceDoc.id },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to approve insurance document' }, { status: 500 });
          }

          result = updatedDoc;
          break;
        }

        case 'license_uploaded': {
          // Find ID verification request
          const { data: verification, error: verificationError } = await supabaseAdmin
            .from('id_verification_requests')
            .select('id, status')
            .eq('bookingId', bookingId)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (verificationError || !verification) {
            return NextResponse.json({ error: 'ID verification request not found' }, { status: 404 });
          }

          const { data: updatedVerification, error: updateError } = await supabaseAdmin
            .from('id_verification_requests')
            .update({
              status: 'approved',
              notes: validated.notes || null,
            })
            .eq('id', verification.id)
            .select()
            .single();

          if (updateError) {
            logger.error(
              'Failed to approve ID verification',
              {
                component: 'admin-step-approve-api',
                action: 'verification_approve_error',
                metadata: { requestId: verification.id },
              },
              updateError
            );
            return NextResponse.json({ error: 'Failed to approve ID verification' }, { status: 500 });
          }

          result = updatedVerification;
          break;
        }

        default:
          return NextResponse.json({ error: 'Invalid step type for approval' }, { status: 400 });
      }

      logger.info('Step approved successfully', {
        component: 'admin-step-approve-api',
        action: 'step_approved',
        metadata: { bookingId, step, adminId: adminUser.id },
      });

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
      }

      logger.error(
        'Unexpected error approving step',
        {
          component: 'admin-step-approve-api',
          action: 'unexpected_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);


