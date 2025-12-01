/**
 * Signed Contract Display Component
 * Shows the signed contract with download link in Manage Booking
 */

'use client';

import { CheckCircle, Download, ExternalLink } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes

function extractPathFromStorageUrl(storageUrl: string | null | undefined): string | null {
  if (!storageUrl) return null;

  try {
    const url = new URL(storageUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    const objectIndex = segments.findIndex((segment) => segment === 'object');
    if (objectIndex === -1 || segments.length <= objectIndex + 2) {
      return null;
    }

    const bucket = segments[objectIndex + 2];
    if (bucket !== 'signed-contracts') {
      return null;
    }

    const pathSegments = segments.slice(objectIndex + 3);
    if (!pathSegments.length) {
      return null;
    }

    return decodeURIComponent(pathSegments.join('/'));
  } catch {
    return null;
  }
}

interface SignedContractDisplayProps {
  contractId: string;
  bookingNumber: string;
}

export default function SignedContractDisplay({
  contractId,
  bookingNumber,
}: SignedContractDisplayProps) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatingUrl, setGeneratingUrl] = useState(false);

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('id, bookingId, type, status, signedAt, signedDocumentUrl, signedDocumentPath, completedAt, createdAt, updatedAt, contractNumber, documentUrl, signatures')
        .eq('id', contractId)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      logger.error(
        'Error fetching contract:',
        {
          component: 'SignedContractDisplay',
          action: 'error',
          metadata: { contractId },
        },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  useEffect(() => {
    let isActive = true;

    const generateSignedUrl = async () => {
      if (!contract) {
        setDownloadUrl(null);
        return;
      }

      const storagePath =
        contract.signedDocumentPath || extractPathFromStorageUrl(contract.signedDocumentUrl);

      if (!storagePath) {
        setDownloadUrl(contract.signedDocumentUrl ?? null);
        return;
      }

      setGeneratingUrl(true);
      try {
        // Try multiple bucket names (codebase uses both 'signed-contracts' and 'contracts')
        const bucketsToTry = ['signed-contracts', 'contracts'];
        let signedUrl: string | null = null;

        for (const bucketName of bucketsToTry) {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

          if (!error && data?.signedUrl) {
            signedUrl = data.signedUrl;
            logger.info('Created signed URL for contract', {
              component: 'SignedContractDisplay',
              action: 'signed_url_success',
              metadata: { contractId, bucket: bucketName, path: storagePath },
            });
            break;
          }
        }

        if (!signedUrl) {
          logger.warn('Failed to create signed URL for contract from any bucket', {
            component: 'SignedContractDisplay',
            action: 'signed_url_warning',
            metadata: {
              contractId,
              path: storagePath,
              bucketsAttempted: bucketsToTry,
            },
          });
          if (isActive) {
            setDownloadUrl(contract.signedDocumentUrl ?? null);
          }
          return;
        }

        if (isActive) {
          setDownloadUrl(signedUrl);
        }
      } catch (err) {
        logger.error(
          'Unexpected error generating signed URL',
          {
            component: 'SignedContractDisplay',
            action: 'signed_url_error',
            metadata: {
              contractId,
              path: storagePath,
            },
          },
          err instanceof Error ? err : new Error(String(err))
        );
        if (isActive) {
          setDownloadUrl(contract.signedDocumentUrl ?? null);
        }
      } finally {
        if (isActive) {
          setGeneratingUrl(false);
        }
      }
    };

    generateSignedUrl();

    return () => {
      isActive = false;
    };
  }, [contract, contractId]);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="h-8 w-3/4 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="text-center text-gray-500">
          <p>Contract not found.</p>
        </div>
      </div>
    );
  }

  // Accept both 'signed' and 'completed' status
  if (contract.status !== 'signed' && contract.status !== 'completed') {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="text-center text-gray-500">
          <p>Contract is not signed yet. Status: {contract.status}</p>
        </div>
      </div>
    );
  }

  const signedDate = contract.signedAt
    ? new Date(contract.signedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not available';

  // Safely extract customer name from signatures or use fallback
  const customerName =
    (contract.signatures &&
      typeof contract.signatures === 'object' &&
      'customer' in contract.signatures &&
      contract.signatures.customer &&
      typeof contract.signatures.customer === 'object' &&
      'name' in contract.signatures.customer &&
      contract.signatures.customer.name) ||
    'Customer';

  return (
    <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
      {/* Success Header */}
      <div className="mb-6 flex items-center">
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
            <CheckCircle className="h-7 w-7 text-white" />
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-green-900">✅ Contract Signed Successfully</h3>
          <p className="mt-1 text-sm text-green-700">
            Signed by <strong>{customerName}</strong> on {signedDate}
          </p>
        </div>
      </div>

      {/* Contract Information */}
      <div className="mb-4 rounded-lg bg-white p-4">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-gray-600">Contract ID</p>
            <p className="font-mono text-xs text-gray-900">{contract.id}</p>
          </div>
          <div>
            <p className="text-gray-600">Booking Number</p>
            <p className="font-semibold text-gray-900">{bookingNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Signed
            </span>
          </div>
          {contract.completedAt && (
            <div>
              <p className="text-gray-600">Completed</p>
              <p className="font-semibold text-gray-900">
                {new Date(contract.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Preview */}
      {contract.signatures &&
        typeof contract.signatures === 'object' &&
        'customer' in contract.signatures &&
        contract.signatures.customer &&
        typeof contract.signatures.customer === 'object' &&
        'signature' in contract.signatures.customer &&
        contract.signatures.customer.signature && (
          <div className="mb-4 rounded-lg bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Electronic Signature</p>
            <div className="inline-block rounded-lg border-2 border-gray-200 bg-gray-50 p-3">
              <img
                src={String(contract.signatures.customer.signature)}
                alt="Customer Signature"
                className="max-h-24 max-w-xs"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              🔒 Legally binding electronic signature - PIPEDA & UECA compliant
            </p>
          </div>
        )}

      {/* Download Actions */}
      <div className="flex flex-wrap gap-3">
        {/* Primary: Download Signed PDF (Puppeteer-generated) */}
        <a
          href={downloadUrl || `/api/contracts/download-signed/${contractId}`}
          download={`Contract-${bookingNumber}-Signed-${new Date().toISOString().split('T')[0]}.pdf`}
          className="flex min-w-[200px] flex-1 items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700"
        >
          <Download className="mr-2 h-5 w-5" />
          {downloadUrl
            ? 'Download Signed Contract & Rider'
            : generatingUrl
              ? 'Preparing secure link...'
              : 'Download Contract (HTML)'}
        </a>

        {/* Secondary: View in New Tab (Puppeteer PDF) */}
        <a
          href={downloadUrl || `/api/contracts/download-signed/${contractId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-[200px] flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          {downloadUrl
            ? 'View Signed PDF'
            : generatingUrl
              ? 'Preparing secure link...'
              : 'View Contract'}
        </a>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600">
          ✅ <strong>Professional PDF Ready:</strong> Your signed contract includes Master Agreement
          + Equipment Rider (8 pages) with your signature and initials embedded.
        </p>
      </div>

      {/* Legal Notice */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-900">
          <strong>📜 Legal Notice:</strong> This contract is governed by the laws of the Province of
          New Brunswick, Canada. Your electronic signature has the same legal effect as a
          handwritten signature. Keep this document for your records.
        </p>
      </div>
    </div>
  );
}
