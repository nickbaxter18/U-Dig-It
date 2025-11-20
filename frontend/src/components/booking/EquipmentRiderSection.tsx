/**
 * Equipment Rider Section Component
 * Displays equipment-specific rider in booking confirmation/contract flow
 */

'use client';

import { AlertCircle, CheckCircle, Download, FileText } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import EquipmentRiderViewer from '@/components/contracts/EquipmentRiderViewer';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';

interface EquipmentRiderSectionProps {
  bookingId: string;
  equipmentModel: string;
  onRiderGenerated?: (blob: Blob) => void;
  showFullPreview?: boolean;
}

export default function EquipmentRiderSection({
  bookingId,
  equipmentModel,
  onRiderGenerated,
  showFullPreview = false,
}: EquipmentRiderSectionProps) {
  const [requiresRider, setRequiresRider] = useState<boolean | null>(null);
  const [riderData, setRiderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const checkRiderRequirement = useCallback(async () => {
    try {
      const response = await fetch(`/api/contracts/equipment-rider?bookingId=${bookingId}`);

      if (response.ok) {
        const data = await response.json();
        setRequiresRider(data.requiresRider);
      } else {
        setRequiresRider(false);
      }
    } catch (err) {
      logger.error(
        'Error checking rider requirement:',
        {
          component: 'EquipmentRiderSection',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setRequiresRider(false);
    }
  }, [bookingId]);

  const fetchRiderData = useCallback(async () => {
    try {
      setLoading(true);

      // Use the imported supabase client

      // Get booking with customer and equipment details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          equipment:equipmentId (
            unitId,
            serialNumber,
            model,
            totalEngineHours,
            attachments
          ),
          customer:customerId (
            firstName,
            lastName,
            phone,
            driversLicense,
            companyName
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      if (booking) {
        const bookingAny: any = booking;
        const equipment = bookingAny.equipment;
        const customer = bookingAny.customer;

        setRiderData({
          serialNumber: equipment?.unitId || equipment?.serialNumber,
          hoursAtRelease: equipment?.totalEngineHours || 0,
          attachments: equipment?.attachments || [],
          rentalStart: new Date(bookingAny.startDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          rentalEnd: new Date(bookingAny.endDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          hourAllowanceDaily: bookingAny.hourAllowanceDaily || 8,
          hourAllowanceWeekly: bookingAny.hourAllowanceWeekly || 40,
          overageRate: bookingAny.overageHourlyRate || 65,
          deliveryIncluded: bookingAny.deliveryIncluded || false,
          pickupIncluded: bookingAny.pickupIncluded || false,
          deliveryFee: bookingAny.deliveryFee || 150,
          renterName: customer ? `${customer.firstName} ${customer.lastName}` : '',
          renterPhone: customer?.phone || '',
          renterLicense: customer?.driversLicense || '',
          renterCompany: customer?.companyName || '',
          conditionNotes: bookingAny.preRentalNotes || '',
        });
      }

      setLoading(false);
    } catch (err: unknown) {
      logger.error(
        'Error fetching rider data:',
        {
          component: 'EquipmentRiderSection',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message);
      setLoading(false);
    }
  }, [bookingId, supabase]);

  const handleDownloadRider = async () => {
    try {
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
    } catch (err: unknown) {
      logger.error(
        'Error downloading rider:',
        {
          component: 'EquipmentRiderSection',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to download equipment rider. Please try again.');
    }
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
            onChange={(e) => setAcknowledged(e.target.checked)}
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
              Please review the rider document below and check the box above to proceed
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadRider}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Download Rider PDF
        </button>

        <a
          href="/getting-insurance"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
        >
          <FileText className="h-4 w-4" />
          Get Insurance Information
        </a>
      </div>

      {/* Rider Preview */}
      {showFullPreview ? (
        <EquipmentRiderViewer
          equipmentModel={equipmentModel}
          bookingData={riderData}
          mode="preview"
          onGenerated={onRiderGenerated}
        />
      ) : (
        <EquipmentRiderViewer
          equipmentModel={equipmentModel}
          bookingData={riderData}
          mode="embed"
          onGenerated={onRiderGenerated}
        />
      )}
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
