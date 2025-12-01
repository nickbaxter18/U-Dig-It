import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';

// Allowed storage buckets for security
const ALLOWED_BUCKETS = [
  'insurance-documents',
  'insurance',
  'contracts',
  'signed-contracts',
  'licenses',
  'driver-licenses',
  'documents',
  'uploads',
  'id-verification',
  'idkit-intake',
  'equipment-media',
  'user-uploads',
  'manual-payment-attachments',
];

/**
 * Normalize storage path by removing leading/trailing slashes
 */
function normalizeStoragePath(path: string): string {
  let normalized = path.trim();
  if (normalized.startsWith('/')) {
    normalized = normalized.substring(1);
  }
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * GET /api/admin/storage/signed-url
 * Generate a signed URL for viewing files in Supabase storage
 *
 * Query params:
 * - bucket: The storage bucket name
 * - path: The file path within the bucket
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
        },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Step 2: Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters: bucket and path' },
        { status: 400 }
      );
    }

    // Step 3: Validate bucket name for security
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      logger.warn('Attempted access to unauthorized bucket', {
        component: 'admin-storage-signed-url',
        action: 'unauthorized_bucket',
        metadata: { bucket },
      });
      return NextResponse.json(
        { error: 'Invalid bucket name' },
        { status: 400 }
      );
    }

    // Step 4: Authenticate admin
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return adminResult.error;
    }

    // Step 5: Use service client for storage operations (bypasses RLS)
    const supabase = await createServiceClient();
    if (!supabase) {
      logger.error('Service client not available', {
        component: 'admin-storage-signed-url',
        action: 'service_client_missing',
        metadata: { bucket, path: path.substring(0, 100) },
      });
      return NextResponse.json(
        {
          error: 'Service client not configured',
          details: 'SUPABASE_SERVICE_ROLE_KEY is required for admin operations',
        },
        { status: 500 }
      );
    }

    // Step 6: Normalize the storage path
    const normalizedPath = normalizeStoragePath(path);

    logger.info('Generating signed URL', {
      component: 'admin-storage-signed-url',
      action: 'generate_url',
      metadata: {
        bucket,
        path: normalizedPath,
        originalPath: path.substring(0, 100),
      },
    });

    // Step 7: Generate signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, 60 * 60); // 1 hour

    if (signedError || !signedData?.signedUrl) {
      logger.error(
        'Failed to generate signed URL',
        {
          component: 'admin-storage-signed-url',
          action: 'signed_url_failed',
          metadata: {
            bucket,
            path: normalizedPath,
            error: signedError?.message,
            errorCode: signedError?.statusCode,
          },
        },
        signedError || new Error('No signed URL returned')
      );

      return NextResponse.json(
        {
          error: 'Failed to generate signed URL',
          details: signedError?.message || 'File not found in storage',
        },
        { status: 404, headers: rateLimitResult.headers }
      );
    }

    logger.info('Successfully generated signed URL', {
      component: 'admin-storage-signed-url',
      action: 'signed_url_success',
      metadata: { bucket, path: normalizedPath },
    });

    return NextResponse.json(
      { url: signedData.signedUrl },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      'Unexpected error in storage signed URL API',
      {
        component: 'admin-storage-signed-url',
        action: 'unexpected_error',
        metadata: { errorMessage },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

