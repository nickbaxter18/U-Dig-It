'use client';

import { ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface TermsAcceptanceProps {
  onAcceptanceChange: (accepted: boolean) => void;
  error?: string;
  showDetails?: boolean;
}

export default function TermsAcceptance({
  onAcceptanceChange,
  error,
  showDetails = true,
}: TermsAcceptanceProps) {
  const [accepted, setAccepted] = useState(false);

  const handleChange = (checked: boolean) => {
    setAccepted(checked);
    onAcceptanceChange(checked);
  };

  return (
    <div className="space-y-4">
      {/* Terms Summary */}
      {showDetails && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h4 className="mb-4 flex items-center font-semibold text-gray-900">
            <FileText className="mr-2 h-5 w-5" />
            Rental Agreement Summary
          </h4>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="mr-2 min-w-[180px] font-semibold">Security Deposit:</span>
              <span>$500.00 (refundable when equipment returned clean, refueled, and in good condition)</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 min-w-[180px] font-semibold">Cancellation Policy:</span>
              <span>
                Free cancellation up to 48 hours before rental start. 50% fee for cancellations
                within 48 hours.
              </span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 min-w-[180px] font-semibold">Equipment Condition:</span>
              <span>Customer responsible for damage beyond normal wear, refueling, and cleaning (excess mud/debris)</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 min-w-[180px] font-semibold">Insurance Required:</span>
              <span>Valid COI with $2M liability and $120K equipment coverage</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 min-w-[180px] font-semibold">Late Returns:</span>
              <span>Additional charges apply for equipment returned after scheduled time</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2 min-w-[180px] font-semibold">Operator Requirements:</span>
              <span>Equipment must be operated by qualified, trained personnel only</span>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-300 pt-4">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/terms"
                target="_blank"
                className="flex items-center text-sm font-medium text-[#E1BC56] hover:text-[#d4b04a]"
              >
                View Full Terms & Conditions
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
              <Link
                href="/privacy"
                target="_blank"
                className="flex items-center text-sm font-medium text-[#E1BC56] hover:text-[#d4b04a]"
              >
                Privacy Policy
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Acceptance Checkbox */}
      <div
        className={`rounded-lg border-2 p-6 transition-colors ${
          error
            ? 'border-red-300 bg-red-50'
            : accepted
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-white'
        }`}
      >
        <label className="group flex cursor-pointer items-start">
          <input
            type="checkbox"
            checked={accepted}
            onChange={e => handleChange(e.target.checked)}
            className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-[#E1BC56] focus:ring-[#E1BC56] focus:ring-offset-2"
          />
          <span className="ml-3 text-sm leading-relaxed text-gray-700">
            I have read and agree to the{' '}
            <Link
              href="/terms"
              target="_blank"
              className="font-semibold text-[#E1BC56] underline hover:text-[#d4b04a]"
            >
              Rental Agreement
            </Link>
            {', '}
            <Link
              href="/terms"
              target="_blank"
              className="font-semibold text-[#E1BC56] underline hover:text-[#d4b04a]"
            >
              Terms & Conditions
            </Link>
            {', and '}
            <Link
              href="/privacy"
              target="_blank"
              className="font-semibold text-[#E1BC56] underline hover:text-[#d4b04a]"
            >
              Privacy Policy
            </Link>
            . I understand that I am responsible for the equipment during the rental period and
            agree to return it in the same condition, subject to normal wear and tear.
            <span className="ml-1 text-red-500">*</span>
          </span>
        </label>

        {error && (
          <p className="mt-3 flex items-center text-sm text-red-600">
            <span className="font-semibold">⚠</span>
            <span className="ml-2">{error}</span>
          </p>
        )}
      </div>

      {/* Additional Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Important:</strong> By accepting these terms, you acknowledge that you have the
          authority to enter into this rental agreement and that all information provided is
          accurate. Electronic signatures are legally binding.
        </p>
      </div>
    </div>
  );
}
