import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';

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
 * Extract storage path from a full Supabase storage URL
 */
function extractStoragePath(fileUrl: string): string {
  // If it's a full Supabase storage URL, extract path
  if (fileUrl.includes('/storage/v1/object/')) {
    try {
      const url = new URL(fileUrl);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const objectIndex = pathSegments.findIndex((segment) => segment === 'object');
      if (objectIndex !== -1 && pathSegments.length > objectIndex + 2) {
        return decodeURIComponent(pathSegments.slice(objectIndex + 3).join('/'));
      }
    } catch (urlError) {
      logger.warn('Failed to parse URL', {
        component: 'admin-insurance-view-api',
        action: 'url_parse_warning',
        metadata: { fileUrl: fileUrl.substring(0, 100), error: urlError instanceof Error ? urlError.message : String(urlError) },
      });
    }
  }
  // Otherwise, assume it's already a storage path
  return normalizeStoragePath(fileUrl);
}

/**
 * GET /api/admin/insurance/[id]/view
 * Generate a signed URL for viewing an insurance document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Step 2: Handle params as Promise or object (Next.js 16 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    if (!id || id === 'undefined' || id.trim() === '') {
      logger.error('Missing or invalid document ID', {
        component: 'admin-insurance-view-api',
        action: 'invalid_id',
        metadata: { id, paramsType: typeof params },
      });
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Step 3: Authenticate admin
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return adminResult.error;
    }

    // Step 4: Use service client for storage operations (bypasses RLS)
    const supabase = await createServiceClient();
    if (!supabase) {
      logger.error('Service client not available', {
        component: 'admin-insurance-view-api',
        action: 'service_client_missing',
        metadata: {
          documentId: id,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
      });
      return NextResponse.json(
        {
          error: 'Service client not configured',
          details: 'SUPABASE_SERVICE_ROLE_KEY is required for admin operations',
        },
        { status: 500 }
      );
    }

    // Step 5: Fetch the insurance document
    logger.info('Fetching insurance document', {
      component: 'admin-insurance-view-api',
      action: 'fetch_document',
      metadata: { documentId: id },
    });

    const { data: document, error: docError } = await supabase
      .from('insurance_documents')
      .select('id, fileUrl, fileName, bookingId')
      .eq('id', id)
      .single();

    if (docError) {
      logger.error(
        'Database error fetching insurance document',
        {
          component: 'admin-insurance-view-api',
          action: 'fetch_error',
          metadata: {
            documentId: id,
            error: docError.message,
            errorCode: docError.code,
          },
        },
        docError
      );

      if (docError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }

    if (!document) {
      logger.error('Document not found (null response)', {
        component: 'admin-insurance-view-api',
        action: 'document_not_found',
        metadata: { documentId: id },
      });
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.fileUrl || document.fileUrl.trim() === '') {
      logger.warn('Document has no fileUrl', {
        component: 'admin-insurance-view-api',
        action: 'empty_fileurl',
        metadata: { documentId: id, bookingId: document.bookingId },
      });
      return NextResponse.json({ error: 'No file available for this document' }, { status: 404 });
    }

    logger.info('Processing document view request', {
      component: 'admin-insurance-view-api',
      action: 'processing',
      metadata: {
        documentId: id,
        fileUrl: document.fileUrl,
        fileUrlLength: document.fileUrl.length,
        fileUrlStartsWith: document.fileUrl.substring(0, 20),
      },
    });

    // Step 6: If it's already a full external URL (not Supabase storage), return it directly
    if (document.fileUrl.startsWith('http://') || document.fileUrl.startsWith('https://')) {
      if (!document.fileUrl.includes('/storage/v1/object/')) {
        logger.info('Returning external URL directly', {
          component: 'admin-insurance-view-api',
          action: 'external_url',
          metadata: { documentId: id },
        });
        return NextResponse.json({ url: document.fileUrl }, { headers: rateLimitResult.headers });
      }
    }

    // Step 7: Extract and normalize storage path
    const pathToUse = extractStoragePath(document.fileUrl);

    logger.info('Extracted storage path', {
      component: 'admin-insurance-view-api',
      action: 'path_extracted',
      metadata: {
        documentId: id,
        originalFileUrl: document.fileUrl,
        extractedPath: pathToUse,
        pathLength: pathToUse.length,
      },
    });

    // Step 8: Generate signed URL from storage path
    // Try insurance-documents bucket first (standard)
    const BUCKET_NAME = 'insurance-documents';
    logger.info('Attempting to create signed URL', {
      component: 'admin-insurance-view-api',
      action: 'create_signed_url',
      metadata: {
        documentId: id,
        bucket: BUCKET_NAME,
        path: pathToUse,
      },
    });

    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(pathToUse, 60 * 60); // 1 hour

    if (!signedError && signedData?.signedUrl) {
      logger.info('Successfully created signed URL from primary bucket', {
        component: 'admin-insurance-view-api',
        action: 'signed_url_success',
        metadata: { documentId: id, bucket: BUCKET_NAME },
      });
      return NextResponse.json({ url: signedData.signedUrl }, { headers: rateLimitResult.headers });
    }

    // Step 9: Fallback to insurance bucket for legacy data
    logger.warn('Primary bucket failed, trying legacy bucket', {
      component: 'admin-insurance-view-api',
      action: 'try_legacy_bucket',
      metadata: {
        documentId: id,
        path: pathToUse,
        primaryError: signedError?.message,
        primaryErrorCode: signedError?.statusCode,
      },
    });

    const { data: altData, error: altError } = await supabase.storage
      .from('insurance')
      .createSignedUrl(pathToUse, 60 * 60);

    if (!altError && altData?.signedUrl) {
      logger.info('Successfully created signed URL from legacy bucket', {
        component: 'admin-insurance-view-api',
        action: 'legacy_bucket_success',
        metadata: { documentId: id, bucket: 'insurance' },
      });
      return NextResponse.json({ url: altData.signedUrl }, { headers: rateLimitResult.headers });
    }

    // Step 10: Both buckets failed
    logger.error(
      'Failed to generate signed URL from both buckets',
      {
        component: 'admin-insurance-view-api',
        action: 'signed_url_failed',
        metadata: {
          documentId: id,
          path: pathToUse,
          originalFileUrl: document.fileUrl,
          primaryError: signedError?.message,
          primaryErrorCode: signedError?.statusCode,
          legacyError: altError?.message,
          legacyErrorCode: altError?.statusCode,
        },
      },
      altError || signedError || new Error('Both buckets failed')
    );

    return NextResponse.json(
      {
        error: 'Failed to generate signed URL',
        details: `File not found in storage. Path: ${pathToUse}`,
      },
      { status: 404, headers: rateLimitResult.headers }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      'Unexpected error in insurance view API',
      {
        component: 'admin-insurance-view-api',
        action: 'unexpected_error',
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage,
          errorStack: errorStack?.substring(0, 500), // First 500 chars of stack
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    // Return detailed error in development, generic in production
    const details = process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : errorMessage;

    return NextResponse.json(
      {
        error: 'Internal server error',
        details,
        ...(process.env.NODE_ENV !== 'production' && { stack: errorStack?.substring(0, 1000) }),
      },
      { status: 500 }
    );
  }
}
