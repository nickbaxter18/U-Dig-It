/**
 * Equipment Rider Viewer Component
 * Displays and manages equipment-specific rider documents
 */

'use client';

import { Download, Eye, FileText, Printer } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { downloadSVL75Rider, generateSVL75Rider } from './SVL75EquipmentRider';

// Dynamically import PDF components to avoid SSR issues
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      <p className="ml-4">Loading PDF viewer...</p>
    </div>
  ),
});

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

const SVL75EquipmentRiderDocument = dynamic(
  () => import('./SVL75EquipmentRider').then(mod => mod.default),
  { ssr: false }
);

interface RiderData {
  serialNumber?: string;
  hoursAtRelease?: number;
  attachments?: string[];
  rentalStart?: string;
  rentalEnd?: string;
  hourAllowanceDaily?: number;
  hourAllowanceWeekly?: number;
  overageRate?: number;
  deliveryIncluded?: boolean;
  pickupIncluded?: boolean;
  deliveryFee?: number;
  renterName?: string;
  renterPhone?: string;
  renterLicense?: string;
  renterCompany?: string;
  conditionNotes?: string;
}

interface EquipmentRiderViewerProps {
  equipmentModel: string;
  bookingData?: RiderData;
  mode?: 'preview' | 'embed' | 'download-only';
  onGenerated?: (blob: Blob) => void;
  className?: string;
}

export default function EquipmentRiderViewer({
  equipmentModel,
  bookingData,
  mode = 'preview',
  onGenerated,
  className = '',
}: EquipmentRiderViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [showPreview, setShowPreview] = useState(mode === 'preview');
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && bookingData && onGenerated) {
      generateSVL75Rider(bookingData).then(blob => {
        setGeneratedBlob(blob);
        onGenerated(blob);
      });
    }
  }, [isClient, bookingData, onGenerated]);

  // Only SVL75 models have equipment riders currently
  const isSVL75 =
    equipmentModel.toLowerCase().includes('svl') &&
    (equipmentModel.toLowerCase().includes('75') || equipmentModel.toLowerCase().includes('svl75'));

  if (!isSVL75) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center text-gray-600">
          <FileText className="mr-2 h-5 w-5" />
          <p className="text-sm">
            No equipment-specific rider available for {equipmentModel}. Standard rental terms apply.
          </p>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading equipment rider...</p>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    await downloadSVL75Rider(bookingData, `SVL75-3-Equipment-Rider-${Date.now()}.pdf`);
  };

  const handlePrint = async () => {
    if (generatedBlob) {
      const url = URL.createObjectURL(generatedBlob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (mode === 'download-only') {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-3 h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Kubota SVL75-3 Equipment Rider</h3>
              <p className="text-sm text-gray-600">Equipment-specific terms and conditions</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide' : 'Preview'}
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div style={{ height: '800px', width: '100%' }}>
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                <SVL75EquipmentRiderDocument data={bookingData} />
              </PDFViewer>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'embed') {
    return (
      <div className={`overflow-hidden rounded-lg bg-white ${className}`}>
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">SVL75-3 Equipment Rider</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded bg-gray-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700"
              title="Print"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div style={{ height: '600px', width: '100%' }}>
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <SVL75EquipmentRiderDocument data={bookingData} />
          </PDFViewer>
        </div>
      </div>
    );
  }

  // Default: preview mode with full controls
  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center text-xl font-bold">
              <FileText className="mr-2 h-6 w-6" />
              Equipment-Specific Rider
            </h2>
            <p className="mt-1 text-sm text-blue-100">2025 Kubota SVL75-3 Compact Track Loader</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-400"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="mt-0.5 h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-yellow-800">
              Equipment-Specific Terms Apply
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              This rider forms an integral part of your rental agreement. Please review all sections
              carefully before signing. Pay special attention to insurance requirements, operating
              limits, and prohibited uses.
            </p>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="p-6">
        <div
          className="overflow-hidden rounded-lg border border-gray-300"
          style={{ height: '800px' }}
        >
          <PDFViewer width="100%" height="100%" showToolbar={true}>
            <SVL75EquipmentRiderDocument data={bookingData} />
          </PDFViewer>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <strong>Document Version:</strong> 1.0 | <strong>Effective:</strong> Aug 22, 2025
          </p>

          <PDFDownloadLink
            document={<SVL75EquipmentRiderDocument data={bookingData} />}
            fileName={`SVL75-3-Equipment-Rider-${Date.now()}.pdf`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {({ loading }) => (
              <>
                <Download className="h-4 w-4" />
                {loading ? 'Preparing...' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}

// Export helper to check if equipment requires a rider
export function requiresEquipmentRider(equipmentModel: string): boolean {
  const model = equipmentModel.toLowerCase();
  return model.includes('svl') && (model.includes('75') || model.includes('svl75'));
}

// Export helper to get rider type
export function getEquipmentRiderType(equipmentModel: string): string | null {
  if (requiresEquipmentRider(equipmentModel)) {
    return 'SVL75-3';
  }
  return null;
}
