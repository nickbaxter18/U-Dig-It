import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';

/**
 * DELETE /api/admin/insurance/[id]/delete
 * Delete an insurance document and its file from storage
 */
export const DELETE = rateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const documentId = resolvedParams.id;

      const adminResult = await requireAdmin(request);
      if (adminResult.error) return adminResult.error;

      const supabase = createServiceClient();

      // Fetch document to get file path
      const { data: document, error: fetchError } = await supabase
        .from('insurance_documents')
        .select('id, fileUrl, fileName')
        .eq('id', documentId)
        .maybeSingle();

      if (fetchError) {
        logger.error('Failed to fetch insurance document', {
          component: 'admin-insurance-delete',
          action: 'fetch_error',
          metadata: { documentId },
        }, fetchError);
        return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
      }

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Delete file from storage if fileUrl exists
      if (document.fileUrl && document.fileUrl.trim() !== '') {
        try {
          // Extract path from fileUrl
          const url = new URL(document.fileUrl);
          const pathSegments = url.pathname.split('/').filter(Boolean);
          const objectIndex = pathSegments.findIndex((segment) => segment === 'object');

          if (objectIndex !== -1 && pathSegments.length > objectIndex + 2) {
            const bucket = pathSegments[objectIndex + 2];
            const filePath = decodeURIComponent(pathSegments.slice(objectIndex + 3).join('/'));

            const { error: storageError } = await supabase.storage
              .from(bucket)
              .remove([filePath]);

            if (storageError) {
              logger.warn('Failed to delete file from storage', {
                component: 'admin-insurance-delete',
                action: 'storage_delete_warning',
                metadata: { documentId, bucket, filePath, error: storageError.message },
              });
              // Continue with database deletion even if storage deletion fails
            }
          }
        } catch (urlError) {
          logger.warn('Failed to parse file URL', {
            component: 'admin-insurance-delete',
            action: 'url_parse_warning',
            metadata: { documentId, fileUrl: document.fileUrl },
          });
          // Continue with database deletion
        }
      }

      // Delete document from database
      const { error: deleteError } = await supabase
        .from('insurance_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        logger.error('Failed to delete insurance document', {
          component: 'admin-insurance-delete',
          action: 'delete_error',
          metadata: { documentId },
        }, deleteError);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
      }

      logger.info('Insurance document deleted', {
        component: 'admin-insurance-delete',
        action: 'delete_success',
        metadata: { documentId },
      });

      return NextResponse.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      logger.error(
        'Unexpected error deleting insurance document',
        {
          component: 'admin-insurance-delete',
          action: 'unexpected_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

