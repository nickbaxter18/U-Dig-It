import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes for download links

function parseStorageUrl(storageUrl: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(storageUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    const objectIndex = segments.findIndex((segment) => segment === 'object');

    if (objectIndex === -1 || segments.length <= objectIndex + 2) {
      return null;
    }

    const bucket = segments[objectIndex + 2];
    const pathSegments = segments.slice(objectIndex + 3);

    if (!bucket || pathSegments.length === 0) {
      return null;
    }

    return {
      bucket,
      path: decodeURIComponent(pathSegments.join('/')),
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/contracts/[id]/download
 * Download contract PDF
 *
 * Admin-only endpoint
 */
export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (request: NextRequest, context: { params?: { id?: string } }) => {
    try {
      const params = context.params ?? {};
      let contractId = params.id;

      if (!contractId) {
        const url = new URL(request.url);
        const segments = url.pathname.split('/').filter(Boolean);
        const contractsIdx = segments.findIndex((segment) => segment === 'contracts');
        if (contractsIdx >= 0 && segments.length > contractsIdx + 1) {
          contractId = segments[contractsIdx + 1];
        }
      }

      if (!contractId) {
        return NextResponse.json({ error: 'Contract id is required' }, { status: 400 });
      }

      if (!/^[0-9a-fA-F-]{36}$/.test(contractId)) {
        return NextResponse.json({ error: 'Invalid contract id' }, { status: 400 });
      }

      // 1. Verify authentication
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // 3. Fetch contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id, "contractNumber", "documentUrl", "signedDocumentUrl", "signedDocumentPath"')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      if (!contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }

      const serviceClient = await createServiceClient();

      let downloadUrl: string | null = null;
      let storagePath: string | null = null;

      // Determine the storage path to use
      if (contract.signedDocumentPath) {
        storagePath = contract.signedDocumentPath;
      }

      if (!storagePath && contract.signedDocumentUrl) {
        const parsed = parseStorageUrl(contract.signedDocumentUrl);
        if (parsed) {
          storagePath = parsed.path;
        }
      }

      if (!storagePath && contract.documentUrl) {
        const parsed = parseStorageUrl(contract.documentUrl);
        if (parsed) {
          storagePath = parsed.path;
        } else if (contract.documentUrl.startsWith('http')) {
          // It's an external URL, use directly
          downloadUrl = contract.documentUrl;
        }
      }

      // Try to generate signed URL from storage
      if (!downloadUrl && storagePath) {
        // Try multiple bucket names (codebase uses both 'signed-contracts' and 'contracts')
        const bucketsToTry = ['signed-contracts', 'contracts'];

        for (const bucketName of bucketsToTry) {
          if (downloadUrl) break;

          // Try with service client first (bypasses RLS)
          if (serviceClient) {
            const { data: serviceSignedData, error: serviceSignedError } = await serviceClient.storage
              .from(bucketName)
              .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

            if (!serviceSignedError && serviceSignedData?.signedUrl) {
              downloadUrl = serviceSignedData.signedUrl;
              logger.info('Service client created signed URL', {
                component: 'contracts-download-api',
                action: 'signed_url_success',
                metadata: { bucket: bucketName, path: storagePath },
              });
              break;
            }

            logger.warn('Service client failed for bucket', {
              component: 'contracts-download-api',
              action: 'signed_url_attempt',
              metadata: {
                bucket: bucketName,
                path: storagePath,
                error: serviceSignedError?.message,
              },
            });
          }

          // Fallback to regular client
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

          if (!signedError && signedData?.signedUrl) {
            downloadUrl = signedData.signedUrl;
            logger.info('Regular client created signed URL', {
              component: 'contracts-download-api',
              action: 'signed_url_success',
              metadata: { bucket: bucketName, path: storagePath },
            });
            break;
          }
        }
      }

      // Final fallback to stored URLs
      if (!downloadUrl) {
        if (!contract.signedDocumentUrl && !contract.documentUrl && !storagePath) {
          return NextResponse.json({ error: 'Contract PDF not yet generated' }, { status: 404 });
        }

        // If we have a storage path but couldn't generate URL, return more specific error
        if (storagePath) {
          logger.error('Failed to generate signed URL for contract from any bucket', {
            component: 'contracts-download-api',
            action: 'signed_url_failed',
            metadata: { storagePath, contractId },
          });
          return NextResponse.json({
            error: 'Failed to generate signed URL',
            details: 'Contract file may not exist in storage'
          }, { status: 500 });
        }

        downloadUrl = contract.signedDocumentUrl ?? contract.documentUrl ?? null;
      }

      logger.info('Contract download URL generated', {
        component: 'contracts-download-api',
        action: 'download_url_ready',
        metadata: {
          contractId,
          contractNumber: contract.contractNumber,
          adminId: user?.id || 'unknown',
          downloadUrl,
        },
      });

      return NextResponse.json({
        downloadUrl,
        contractId,
        contractNumber: contract.contractNumber,
      });
    } catch (error: unknown) {
      logger.error(
        'Contract download error',
        {
          component: 'contracts-download-api',
          action: 'error',
        },
        error
      );

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
