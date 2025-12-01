import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';

/**
 * GET /api/admin/insurance/[id]/diagnostics
 * Diagnostic endpoint to check insurance document status and storage access
 */
export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      // Extract document ID from params
      const { id } = params;

      if (!id || id === 'undefined' || id.trim() === '') {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      // Authenticate admin
      const adminResult = await requireAdmin(request);
      if (adminResult.error) {
        return adminResult.error;
      }

      // Use service client for storage operations
      const supabase = createServiceClient();
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase service client not configured' }, { status: 500 });
      }

      const diagnostics: Record<string, unknown> = {
        documentId: id,
        timestamp: new Date().toISOString(),
      };

      // 1. Check if document exists in database
      const { data: document, error: docError } = await supabase
        .from('insurance_documents')
        .select('id, fileUrl, fileName, bookingId, createdAt, updatedAt')
        .eq('id', id)
        .single();

      if (docError || !document) {
        diagnostics.database = {
          exists: false,
          error: docError?.message || 'Document not found',
          errorCode: docError?.code,
        };
        return NextResponse.json(diagnostics);
      }

      diagnostics.database = {
        exists: true,
        documentId: document.id,
        bookingId: document.bookingId,
        fileName: document.fileName,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      };

      // 2. Check fileUrl format
      if (!document.fileUrl || document.fileUrl.trim() === '') {
        diagnostics.fileUrl = {
          exists: false,
          format: 'empty',
          message: 'No fileUrl in database record',
        };
        return NextResponse.json(diagnostics);
      }

      const fileUrl = document.fileUrl;
      const isUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
      const isSupabaseUrl = fileUrl.includes('/storage/v1/object/') || fileUrl.includes('supabase.co');

      diagnostics.fileUrl = {
        exists: true,
        format: isUrl ? (isSupabaseUrl ? 'supabase_storage_url' : 'external_url') : 'storage_path',
        length: fileUrl.length,
        preview: fileUrl.substring(0, 100),
        isUrl,
        isSupabaseUrl,
      };

      // 3. Extract and normalize path
      let storagePath: string | null = null;
      if (isUrl && isSupabaseUrl) {
        try {
          const url = new URL(fileUrl);
          const pathSegments = url.pathname.split('/').filter(Boolean);
          const objectIndex = pathSegments.findIndex((segment) => segment === 'object');
          if (objectIndex !== -1 && pathSegments.length > objectIndex + 2) {
            storagePath = decodeURIComponent(pathSegments.slice(objectIndex + 3).join('/'));
          }
        } catch (urlError) {
          diagnostics.pathExtraction = {
            success: false,
            error: urlError instanceof Error ? urlError.message : String(urlError),
          };
        }
      } else if (!isUrl) {
        storagePath = fileUrl.trim();
        if (storagePath.startsWith('/')) {
          storagePath = storagePath.substring(1);
        }
      }

      diagnostics.pathExtraction = {
        success: storagePath !== null,
        storagePath: storagePath?.substring(0, 100),
        normalized: storagePath,
      };

      // 4. Test storage bucket access
      if (storagePath) {
        const BUCKET_NAME = 'insurance-documents';
        const { data: signedData, error: signedError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(storagePath, 60); // 1 minute for diagnostics

        diagnostics.storage = {
          bucket: BUCKET_NAME,
          path: storagePath,
          signedUrlGenerated: !signedError && !!signedData?.signedUrl,
          error: signedError?.message,
          errorCode: signedError?.statusCode,
          errorName: signedError?.name,
          signedUrlLength: signedData?.signedUrl?.length || 0,
        };

        // Try alternative bucket if primary fails
        if (signedError) {
          const { data: altData, error: altError } = await supabase.storage
            .from('insurance')
            .createSignedUrl(storagePath, 60);

          diagnostics.storage.alternativeBucket = {
            bucket: 'insurance',
            signedUrlGenerated: !altError && !!altData?.signedUrl,
            error: altError?.message,
            errorCode: altError?.statusCode,
          };
        }
      } else {
        diagnostics.storage = {
          message: 'Cannot test storage - no valid storage path extracted',
        };
      }

      return NextResponse.json(diagnostics);
    } catch (error) {
      logger.error(
        'Unexpected error in insurance diagnostics API',
        {
          component: 'admin-insurance-diagnostics-api',
          action: 'unexpected_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

