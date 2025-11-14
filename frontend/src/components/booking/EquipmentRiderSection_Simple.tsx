/**
 * Equipment Rider Section Component (Simplified)
 * Displays equipment-specific rider information without embedded PDF viewer
 */

'use client';

import { AlertCircle, CheckCircle, Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface EquipmentRiderSectionProps {
  bookingId: string;
  equipmentModel: string;
  onRiderGenerated?: (blob: Blob) => void;
  showFullPreview?: boolean;
}

export default function EquipmentRiderSection({
  bookingId,
  equipmentModel,
  showFullPreview = false,
}: EquipmentRiderSectionProps) {
  const [requiresRider, setRequiresRider] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkRiderRequirement();
  }, [bookingId]);

  const checkRiderRequirement = async () => {
    try {
      setLoading(true);

      // Simple check based on equipment model
      const isSVL75 =
        equipmentModel.toLowerCase().includes('svl') &&
        (equipmentModel.toLowerCase().includes('75') ||
          equipmentModel.toLowerCase().includes('svl75'));

      setRequiresRider(isSVL75);
      setLoading(false);
    } catch (err) {
      logger.error('Error checking rider requirement:', {
        component: 'EquipmentRiderSection_Simple',
        action: 'error',
      }, err instanceof Error ? err : new Error(String(err)));
      setRequiresRider(false);
      setLoading(false);
    }
  };

  const handleDownloadRider = async () => {
    try {
      setDownloading(true);

      const response = await fetch('/api/contracts/equipment-rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate rider PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SVL75-3-Equipment-Rider-${bookingId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setDownloading(false);
    } catch (err: any) {
      logger.error('Error downloading rider:', {
        component: 'EquipmentRiderSection_Simple',
        action: 'error',
      }, err instanceof Error ? err : new Error(String(err)));
      alert('Failed to download equipment rider. Please try again.');
      setDownloading(false);
    }
  };

  const handleViewOnline = () => {
    window.open(`/equipment-rider/svl75-3`, '_blank');
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading equipment rider information...</p>
        </div>
      </div>
    );
  }

  if (!requiresRider) {
    return null; // Don't show section if rider not required
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center">
          <AlertCircle className="mr-2 h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Rider</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Important Notice */}
      <div className="rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-6">
        <div className="flex items-start">
          <FileText className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-blue-900">
              Equipment-Specific Rider Required
            </h3>
            <p className="mb-3 text-blue-800">
              This equipment requires an equipment-specific rider document in addition to the
              standard rental agreement. The rider contains important information about:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
              <li>Insurance requirements (CGL ≥ $2M, Equipment Coverage, Auto Liability)</li>
              <li>Transport and tie-down specifications</li>
              <li>
                Operating limits and safety requirements (max 25° slope, PPE, utility locates)
              </li>
              <li>Prohibited uses and care/maintenance obligations</li>
              <li>Financial terms and damage responsibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rider Acknowledgment */}
      <div className="rounded-lg border-2 border-gray-300 bg-white p-6">
        <div className="mb-4 flex items-start">
          <input
            type="checkbox"
            id="rider-acknowledgment"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="rider-acknowledgment" className="ml-3 flex-1">
            <span className="mb-1 block font-semibold text-gray-900">
              I acknowledge that I have read and understood the equipment-specific rider
            </span>
            <span className="text-sm text-gray-600">
              By checking this box, you confirm that you have reviewed the SVL75-3 Equipment Rider
              and understand all terms, including the "No COI, No Release" insurance requirement,
              operating limits, prohibited uses, and financial obligations.
            </span>
          </label>
        </div>

        {acknowledged && (
          <div className="mt-4 flex items-center rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Rider acknowledgment confirmed
            </span>
          </div>
        )}

        {!acknowledged && (
          <div className="mt-4 flex items-center rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Please review the rider document and check the box above to proceed
            </span>
          </div>
        )}
      </div>

      {/* Rider Document Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              SVL75-3 Equipment Rider Document
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Professional 4-page legal document with all safety, insurance, and operating
              requirements
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-1">Version 1.0</span>
            <span>•</span>
            <span>Aug 22, 2025</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Download Button */}
          <button
            onClick={handleDownloadRider}
            disabled={downloading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download Rider PDF
              </>
            )}
          </button>

          {/* View Online Button */}
          <button
            onClick={handleViewOnline}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-4 text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ExternalLink className="h-5 w-5" />
            View Full Rider Online
          </button>
        </div>

        {/* Insurance Link */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <a
            href="/getting-insurance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <FileText className="mr-1 h-4 w-4" />
            Need insurance? Get help with insurance requirements →
          </a>
        </div>
      </div>

      {/* Key Requirements Summary */}
      <div className="rounded-r-lg border-l-4 border-yellow-400 bg-yellow-50 p-6">
        <h3 className="mb-3 font-semibold text-yellow-900">⚠️ Key Requirements from Rider:</h3>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold text-yellow-900">
              🛡️ Insurance ("No COI, No Release")
            </h4>
            <ul className="space-y-1 text-yellow-800">
              <li>• CGL: $2,000,000 minimum</li>
              <li>• Equipment Coverage: Full replacement value</li>
              <li>• Auto Liability: $1,000,000 (if transporting)</li>
              <li>• U-Dig It as Additional Insured & Loss Payee</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-yellow-900">⚙️ Operating Limits & Safety</h4>
            <ul className="space-y-1 text-yellow-800">
              <li>• Max slope: 25° (straight up/down only)</li>
              <li>• PPE required: CSA boots, hi-viz, eye/ear protection</li>
              <li>• Utility locates required before digging</li>
              <li>• No riders, no people lifting</li>
              <li>• Operators 21+ only, no impairment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export helper component for simple display
export function EquipmentRiderBadge({ equipmentModel }: { equipmentModel: string }) {
  const isSVL75 =
    equipmentModel.toLowerCase().includes('svl') &&
    (equipmentModel.toLowerCase().includes('75') || equipmentModel.toLowerCase().includes('svl75'));

  if (!isSVL75) return null;

  return (
    <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
      <FileText className="mr-1 h-3 w-3" />
      Equipment Rider Required
    </div>
  );
}
