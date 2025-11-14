import { z } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { runLocalIdVerification } from '@/lib/id-verification/local-processor';
import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const DOCUMENT_ASPECT_RANGE = { min: 1.2, max: 2.0 };
const SELFIE_ASPECT_RANGE = { min: 0.6, max: 1.4 };
const DOCUMENT_SHARPNESS_THRESHOLD = 1.2;
const SELFIE_SHARPNESS_THRESHOLD = 1.0;
const BRIGHTNESS_RANGE = { min: 0.15, max: 0.9 };
const MAX_HASH_MATCH = 0.92;

const captureAnalysisSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  aspectRatio: z.number().positive(),
  brightness: z.number().min(0).max(1),
  sharpness: z.number().min(0),
  hash: z.string().min(10),
});

const submissionSchema = z.object({
  bookingId: z.string().uuid(),
  documentPath: z.string().min(1, 'Document path required'),
  selfiePath: z.string().min(1, 'Selfie path required'),
  consentMethod: z.string().min(1, 'Consent method required'),
  consentRecordedAt: z.string().datetime(),
  analysis: z.object({
    documentFront: captureAnalysisSchema.nullable(),
    selfie: captureAnalysisSchema.nullable(),
  }),
});

export async function POST(request: NextRequest) {
  const limiter = await rateLimit(request, RateLimitPresets.STRICT);
  if (!limiter.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: limiter.headers }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let parsedBody: z.infer<typeof submissionSchema>;
  try {
    const body = await request.json();
    const result = submissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: result.error.flatten() },
        { status: 400 }
      );
    }
    parsedBody = result.data;
  } catch (error) {
    logger.warn('Invalid JSON payload for ID verification submit', {
      component: 'id-verification',
      action: 'submit_invalid_json',
      metadata: {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { bookingId, documentPath, selfiePath, consentMethod, consentRecordedAt, analysis } =
    parsedBody;

  const expectedStoragePrefix = `${user.id}/${bookingId}/`;
  const invalidPaths = [documentPath, selfiePath].filter(
    (path) => !path.startsWith(expectedStoragePrefix)
  );

  if (invalidPaths.length > 0) {
    return NextResponse.json(
      {
        error: 'Captured files must be uploaded via the in-app capture flow.',
        details: invalidPaths,
      },
      { status: 400 }
    );
  }

  if (!analysis || !analysis.documentFront || !analysis.selfie) {
    return NextResponse.json(
      {
        error: 'Full capture analysis metadata is required for verification.',
      },
      { status: 422 }
    );
  }

  const analysisErrors: string[] = [];
  if (analysis) {
    const ensure = (condition: boolean, message: string) => {
      if (!condition) {
        analysisErrors.push(message);
      }
    };

    const { documentFront, selfie } = analysis;

    ensure(
      documentFront.aspectRatio >= DOCUMENT_ASPECT_RANGE.min &&
        documentFront.aspectRatio <= DOCUMENT_ASPECT_RANGE.max,
      'Licence orientation invalid.'
    );
    ensure(
      selfie.aspectRatio >= SELFIE_ASPECT_RANGE.min &&
        selfie.aspectRatio <= SELFIE_ASPECT_RANGE.max,
      'Selfie orientation invalid.'
    );

    ensure(documentFront.sharpness >= DOCUMENT_SHARPNESS_THRESHOLD, 'Licence image too blurry.');
    ensure(selfie.sharpness >= SELFIE_SHARPNESS_THRESHOLD, 'Selfie too blurry.');

    const withinBrightness = (capture: typeof documentFront) =>
      capture.brightness >= BRIGHTNESS_RANGE.min && capture.brightness <= BRIGHTNESS_RANGE.max;

    if (!withinBrightness(documentFront)) {
      analysisErrors.push('Licence lighting out of range.');
    }
    if (!withinBrightness(selfie)) {
      analysisErrors.push('Selfie lighting out of range.');
    }

    const hashSimilarity = (a: string, b: string) => {
      const length = Math.min(a.length, b.length);
      if (!length) return 0;
      let matches = 0;
      for (let i = 0; i < length; i++) {
        if (a[i] === b[i]) {
          matches += 1;
        }
      }
      return matches / length;
    };

    if (hashSimilarity(documentFront.hash, selfie.hash) >= MAX_HASH_MATCH) {
      analysisErrors.push('Licence image appears identical to selfie.');
    }
  }

  if (analysisErrors.length > 0) {
    return NextResponse.json(
      { error: 'Capture validation failed', details: analysisErrors },
      { status: 422 }
    );
  }

  // Ensure booking belongs to user
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, customerId, status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    logger.warn('Booking not found for ID verification submit', {
      component: 'id-verification',
      action: 'booking_not_found',
      metadata: { userId: user.id, bookingId },
    });
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.customerId !== user.id) {
    logger.warn('User attempted ID verification for another booking', {
      component: 'id-verification',
      action: 'booking_access_denied',
      metadata: { userId: user.id, bookingCustomer: booking.customerId, bookingId },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: lastAttempt } = await supabase
    .from('id_verification_requests')
    .select('attempt_number')
    .eq('booking_id', bookingId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptNumber = (lastAttempt?.attempt_number ?? 0) + 1;

  const baseMetadata = {
    documentPath,
    selfiePath,
    analysis,
  };

  const { data: requestRecord, error: insertError } = await supabase
    .from('id_verification_requests')
    .insert({
      booking_id: bookingId,
      user_id: user.id,
      attempt_number: attemptNumber,
      status: 'submitted',
      consent_method: consentMethod,
      consent_recorded_at: consentRecordedAt,
      metadata: baseMetadata,
    })
    .select('id, metadata')
    .single();

  if (insertError || !requestRecord) {
    logger.error(
      'Failed to create ID verification request',
      {
        component: 'id-verification',
        action: 'insert_request_error',
        metadata: { userId: user.id, bookingId, attemptNumber },
      },
      insertError
    );
    return NextResponse.json({ error: 'Failed to start verification' }, { status: 500 });
  }

  const { data: edgeResult, error: edgeError } = await supabase.functions
    .invoke('idkit-submit', {
    body: {
      requestId: requestRecord.id,
      bookingId,
      userId: user.id,
      attemptNumber,
      documentPath,
      selfiePath,
      consentMethod,
      consentRecordedAt,
    },
    })
    .catch((invokeError: unknown) => {
      logger.error(
        'Failed to invoke idkit-submit edge function',
        {
          component: 'id-verification',
          action: 'edge_invoke_failed',
          metadata: {
            bookingId,
            requestId: requestRecord.id,
          },
        },
        invokeError instanceof Error ? invokeError : new Error(String(invokeError))
      );
      return { data: null, error: invokeError };
    });

  if (edgeError) {
    logger.error(
      'idkit-submit edge function responded with error',
      {
        component: 'id-verification',
        action: 'edge_error',
        metadata: {
          bookingId,
          requestId: requestRecord.id,
          error:
            edgeError instanceof Error
              ? edgeError.message
              : typeof edgeError === 'object' && edgeError !== null
                ? JSON.stringify(edgeError)
                : String(edgeError),
        },
      },
      edgeError instanceof Error ? edgeError : undefined
    );
  }

  const shouldRunLocalAutomation = !edgeResult || edgeResult.mode !== 'idkit';
  let automation: Awaited<ReturnType<typeof runLocalIdVerification>> | null = null;
  let finalStatus: 'processing' | 'approved' | 'manual_review' | 'rejected' = 'processing';

  if (shouldRunLocalAutomation) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const failureMetadata = {
        documentPath,
        selfiePath,
        analysis,
        consentMethod,
        consentRecordedAt,
        attemptNumber,
        fallback: {
          reason: 'service_role_unavailable',
          occurredAt: new Date().toISOString(),
        },
      };

      await supabase
        .from('id_verification_requests')
        .update({
          status: 'failed',
          metadata: failureMetadata,
        })
        .eq('id', requestRecord.id);

      logger.error('Unable to run local ID verification without service role key', {
        component: 'id-verification',
        action: 'local_verification_unavailable',
        metadata: { requestId: requestRecord.id },
      });

      return NextResponse.json(
        { error: 'Identity verification is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    automation = await runLocalIdVerification({
      requestId: requestRecord.id,
      bookingId,
      userId: user.id,
      documentPath,
      selfiePath,
    });
    finalStatus = automation.status;

    try {
      const { data: existingRequest } = await supabase
        .from('id_verification_requests')
        .select('metadata')
        .eq('id', requestRecord.id)
        .single();

      const mergedMetadata = {
        ...(existingRequest?.metadata ?? baseMetadata),
        localAutomation: {
          status: automation.status,
          failureReasons: automation.failureReasons,
          scores: automation.scores,
          processedAt: new Date().toISOString(),
        },
      };

      const { error: updateError } = await supabase
        .from('id_verification_requests')
        .update({
          status: finalStatus,
          metadata: mergedMetadata,
        })
        .eq('id', requestRecord.id);

      if (updateError) {
        logger.error(
          'Failed to persist local automation metadata via user client',
          {
            component: 'id-verification',
            action: 'local_automation_metadata_update_failed',
            metadata: {
              requestId: requestRecord.id,
              bookingId,
              status: finalStatus,
            },
          },
          updateError
        );
      }
    } catch (metadataError) {
      logger.error(
        'Unexpected error updating request metadata after local automation',
        {
          component: 'id-verification',
          action: 'local_automation_metadata_exception',
          metadata: {
            requestId: requestRecord.id,
            bookingId,
            status: finalStatus,
          },
        },
        metadataError instanceof Error ? metadataError : new Error(String(metadataError))
      );
    }
  } else if (edgeResult?.mode === 'idkit') {
    finalStatus = 'processing';
  } else if (edgeResult?.mode === 'manual_review') {
    finalStatus = 'manual_review';
  }

  logger.info('ID verification request submitted', {
    component: 'id-verification',
    action: 'submit_success',
    metadata: {
      userId: user.id,
      bookingId,
      requestId: requestRecord.id,
      attemptNumber,
      localAutomation: automation ? automation.status : null,
      edge: edgeResult ?? null,
    },
  });

  return NextResponse.json(
    {
      success: true,
      requestId: requestRecord.id,
      status: finalStatus,
      edge: edgeResult ?? null,
      automation,
    },
    { status: 200, headers: limiter.headers }
  );
}
