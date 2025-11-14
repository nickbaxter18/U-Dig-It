/**
 * IDKit Verification Submit Edge Function
 * ---------------------------------------
 * Attempts to forward artefacts to IDKit if credentials are configured.
 * When credentials are missing, we simply tag the request for local/manual automation.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface SubmitPayload {
  requestId: string;
  bookingId: string;
  userId: string;
  attemptNumber: number;
  documentPath: string;
  selfiePath: string;
  consentRecordedAt?: string;
  consentMethod?: string;
}

interface IdKitResponse {
  session_id?: string;
  request_id?: string;
  status?: string;
  [key: string]: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as SubmitPayload;
    const validationError = validatePayload(payload);

    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingRequest, error: fetchError } = await supabaseClient
      .from('id_verification_requests')
      .select('metadata')
      .eq('id', payload.requestId)
      .single();

    if (fetchError || !existingRequest) {
      console.error('IDKit submit: request not found', { fetchError, requestId: payload.requestId });
      return new Response(
        JSON.stringify({ error: 'Verification request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: documentSigned, error: documentError } = await supabaseClient.storage
      .from('idkit-intake')
      .createSignedUrl(payload.documentPath, 60 * 5);

    if (documentError || !documentSigned) {
      throw new Error(`Failed to create signed URL for document: ${documentError?.message ?? 'unknown error'}`);
    }

    const { data: selfieSigned, error: selfieError } = await supabaseClient.storage
      .from('idkit-intake')
      .createSignedUrl(payload.selfiePath, 60 * 5);

    if (selfieError || !selfieSigned) {
      throw new Error(`Failed to create signed URL for selfie: ${selfieError?.message ?? 'unknown error'}`);
    }

    const mergedMetadata = {
      ...(existingRequest.metadata ?? {}),
      documentPath: payload.documentPath,
      selfiePath: payload.selfiePath,
      consentRecordedAt: payload.consentRecordedAt ?? null,
      consentMethod: payload.consentMethod ?? null,
      attemptNumber: payload.attemptNumber,
      signedUrls: {
        documents: [{ path: payload.documentPath, url: documentSigned.signedUrl }],
        selfie: { path: payload.selfiePath, url: selfieSigned.signedUrl },
      },
    };

    await supabaseClient
      .from('id_verification_requests')
      .update({
        status: 'processing',
        metadata: mergedMetadata,
      })
      .eq('id', payload.requestId);

    const IDKIT_API_URL = Deno.env.get('IDKIT_API_URL');
    const IDKIT_API_KEY = Deno.env.get('IDKIT_API_KEY');

    if (!IDKIT_API_URL || !IDKIT_API_KEY) {
      await supabaseClient
        .from('id_verification_requests')
        .update({
          status: 'manual_review',
          metadata: {
            ...mergedMetadata,
            fallback: {
              reason: 'idkit_configuration_missing',
              timestamp: new Date().toISOString(),
            },
          },
        })
        .eq('id', payload.requestId);

      return new Response(
        JSON.stringify({
          success: true,
          requestId: payload.requestId,
          sessionId: null,
          mode: 'manual_review',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idkitPayload = {
      request_id: payload.requestId,
      booking_id: payload.bookingId,
      user_id: payload.userId,
      attempt_number: payload.attemptNumber,
      consent_recorded_at: payload.consentRecordedAt ?? null,
      documents: [
        {
          type: 'drivers_license',
          source: 'supabase',
          url: documentSigned.signedUrl,
        },
      ],
      selfie: {
        source: 'supabase',
        url: selfieSigned.signedUrl,
      },
      metadata: {
        consent_method: payload.consentMethod ?? null,
      },
    };

    const idkitResponse = await fetch(`${IDKIT_API_URL.replace(/\/$/, '')}/v1/verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${IDKIT_API_KEY}`,
      },
      body: JSON.stringify(idkitPayload),
    });

    if (!idkitResponse.ok) {
      const errorBody = await idkitResponse.text();
      console.error('IDKit submit failed', {
        status: idkitResponse.status,
        body: errorBody,
        requestId: payload.requestId,
      });

      await supabaseClient
        .from('id_verification_requests')
        .update({
          status: 'manual_review',
          metadata: {
            ...mergedMetadata,
            error: {
              status: idkitResponse.status,
              body: errorBody,
            },
          },
        })
        .eq('id', payload.requestId);

      return new Response(
        JSON.stringify({ error: 'IDKit verification request failed', details: errorBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idkitData = (await idkitResponse.json()) as IdKitResponse;

    await supabaseClient
      .from('id_verification_requests')
      .update({
        idkit_session_id: idkitData.session_id ?? null,
        metadata: {
          ...mergedMetadata,
          idkitRequest: idkitPayload,
          idkitResponse: idkitData,
        },
      })
      .eq('id', payload.requestId);

    return new Response(
      JSON.stringify({
        success: true,
        requestId: payload.requestId,
        sessionId: idkitData.session_id ?? null,
        mode: 'idkit',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('IDKit submit unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error during IDKit submission' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function validatePayload(payload: SubmitPayload): string | null {
  if (!payload || typeof payload !== 'object') {
    return 'Invalid payload';
  }

  if (!payload.requestId) return 'requestId is required';
  if (!payload.bookingId) return 'bookingId is required';
  if (!payload.userId) return 'userId is required';

  if (!payload.documentPath || typeof payload.documentPath !== 'string') {
    return 'Document path is required';
  }

  if (!payload.selfiePath) {
    return 'selfiePath is required';
  }

  if (typeof payload.attemptNumber !== 'number' || Number.isNaN(payload.attemptNumber)) {
    return 'attemptNumber must be a number';
  }

  return null;
}

