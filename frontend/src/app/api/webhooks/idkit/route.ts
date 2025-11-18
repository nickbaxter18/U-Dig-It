import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

const payloadSchema = z.object({
  request_id: z.string().uuid(),
  session_id: z.string().optional(),
  status: z.enum(['approved', 'manual_review', 'rejected', 'failed', 'processing']),
  document_status: z.enum(['passed', 'failed', 'suspected', 'not_applicable']).nullable().optional(),
  document_liveness_score: z.number().nullable().optional(),
  face_liveness_score: z.number().nullable().optional(),
  face_match_score: z.number().nullable().optional(),
  failure_reasons: z.array(z.string()).optional(),
  extracted_fields: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function verifySignature(secret: string, rawBody: string, receivedSignature: string): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-idkit-signature');

  const secret = process.env.IDKIT_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('IDKit webhook secret not configured', {
      component: 'id-verification',
      action: 'webhook_missing_secret',
    });
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  if (!signature || !verifySignature(secret, rawBody, signature)) {
    logger.warn('Invalid IDKit webhook signature', {
      component: 'id-verification',
      action: 'webhook_invalid_signature',
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let parsedPayload: z.infer<typeof payloadSchema>;
  try {
    const json = JSON.parse(rawBody);
    const result = payloadSchema.safeParse(json);

    if (!result.success) {
      logger.warn('Invalid IDKit webhook payload', {
        component: 'id-verification',
        action: 'webhook_invalid_payload',
        metadata: { issues: result.error.flatten() },
      });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    parsedPayload = result.data;
  } catch (error) {
    logger.warn('Failed to parse IDKit webhook payload', {
      component: 'id-verification',
      action: 'webhook_parse_error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    logger.error('Supabase service client unavailable for IDKit webhook', {
      component: 'id-verification',
      action: 'webhook_service_client_missing',
    });
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
  }

  const { request_id: requestId } = parsedPayload;

  const { data: requestRecord, error: requestError } = await supabase
    .from('id_verification_requests')
    .select('id, user_id, metadata')
    .eq('id', requestId)
    .single();

  if (requestError || !requestRecord) {
    logger.error('IDKit webhook request not found', {
      component: 'id-verification',
      action: 'webhook_request_missing',
      requestId,
    }, requestError ?? undefined);
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const mergedMetadata = {
    ...(requestRecord.metadata ?? {}),
    idkitWebhook: parsedPayload,
  };

  const failureReasons = parsedPayload.failure_reasons ?? [];

  const { error: resultError } = await supabase
    .from('id_verification_results')
    .upsert({
      request_id: requestId,
      document_status: parsedPayload.document_status ?? null,
      document_liveness_score: parsedPayload.document_liveness_score ?? null,
      face_liveness_score: parsedPayload.face_liveness_score ?? null,
      face_match_score: parsedPayload.face_match_score ?? null,
      failure_reasons: failureReasons.length ? failureReasons : null,
      raw_payload: parsedPayload,
      processed_at: new Date().toISOString(),
      extracted_fields: parsedPayload.extracted_fields ?? {},
    });

  if (resultError) {
    logger.error(
      'Failed to upsert id_verification_results from webhook',
      {
        component: 'id-verification',
        action: 'webhook_upsert_results_error',
        requestId,
      },
      resultError
    );
    return NextResponse.json({ error: 'Failed to persist results' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('id_verification_requests')
    .update({
      status: parsedPayload.status,
      idkit_session_id: parsedPayload.session_id ?? null,
      metadata: mergedMetadata,
    })
    .eq('id', requestId);

  if (updateError) {
    logger.error(
      'Failed to update id_verification_requests status from webhook',
      {
        component: 'id-verification',
        action: 'webhook_update_request_error',
        requestId,
      },
      updateError
    );
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }

  const auditAction =
    parsedPayload.status === 'manual_review'
      ? 'manual_review_opened'
      : parsedPayload.status === 'approved'
        ? 'auto_decision'
        : parsedPayload.status === 'rejected' || parsedPayload.status === 'failed'
          ? 'auto_decision'
          : 'auto_decision';

  await supabase.from('id_verification_audits').insert({
    request_id: requestId,
    action: auditAction,
    performed_by: null,
    notes: failureReasons.length ? failureReasons.join('; ') : null,
    metadata: {
      status: parsedPayload.status,
      document_status: parsedPayload.document_status ?? null,
      document_liveness_score: parsedPayload.document_liveness_score ?? null,
      face_liveness_score: parsedPayload.face_liveness_score ?? null,
      face_match_score: parsedPayload.face_match_score ?? null,
    },
  });

  if (parsedPayload.status === 'approved') {
    const extracted = parsedPayload.extracted_fields ?? {};
    const updateFields: Record<string, string | null> = {};

    if (typeof extracted.license_number === 'string') {
      updateFields.drivers_license_number = extracted.license_number;
    } else if (typeof extracted.number === 'string') {
      updateFields.drivers_license_number = extracted.number;
    }

    const expiry =
      typeof extracted.expiry_date === 'string'
        ? extracted.expiry_date
        : typeof extracted.expiry === 'string'
          ? extracted.expiry
          : null;
    if (expiry) {
      updateFields.drivers_license_expiry = new Date(expiry).toISOString().split('T')[0];
    }

    if (typeof extracted.province === 'string') {
      updateFields.drivers_license_province = extracted.province;
    } else if (typeof extracted.state === 'string') {
      updateFields.drivers_license_province = extracted.state;
    }

    updateFields.drivers_license_verified_at = new Date().toISOString();

    await supabase
      .from('users')
      .update(updateFields)
      .eq('id', requestRecord.user_id);
  }

  logger.info('Processed IDKit webhook', {
    component: 'id-verification',
    action: 'webhook_processed',
    metadata: { requestId, status: parsedPayload.status },
  });

  return NextResponse.json({ success: true });
}

