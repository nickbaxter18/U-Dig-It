/**
 * Contract Preview Modal Component
 * Shows full contract before signing with expandable sections
 */

'use client';

import { AlertTriangle, FileText, Scale, Shield, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface ContractPreviewModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onProceedToSign: () => void;
}

export default function ContractPreviewModal({
  bookingId,
  isOpen,
  onClose,
  onProceedToSign,
}: ContractPreviewModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['parties']));
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    setHasScrolledToBottom(isAtBottom);
  };

  if (!isOpen) return null;

  const contractSections = [
    {
      id: 'parties',
      icon: <FileText className="h-5 w-5" />,
      title: '1. Parties & Equipment Details',
      required: true,
      content: (
        <div className="space-y-3 text-sm">
          <p>
            <strong>RENTAL AGREEMENT</strong> made this {new Date().toLocaleDateString()}
          </p>
          <p>
            <strong>BETWEEN:</strong>
          </p>
          <div className="ml-4 space-y-1">
            <p>
              <strong>U-Dig It Rentals Inc.</strong> ("Owner")
            </p>
            <p>Business License: NB-2024-RENTAL-001</p>
            <p>Address: Saint John, New Brunswick</p>
            <p>Phone: (506) 643-1575</p>
          </div>
          <p>
            <strong>AND:</strong>
          </p>
          <div className="ml-4 space-y-1">
            <p>
              <strong>[Customer Name]</strong> ("Renter")
            </p>
            <p>Booking ID: {bookingId}</p>
          </div>
          <p>
            <strong>EQUIPMENT:</strong>
          </p>
          <div className="ml-4 space-y-1">
            <p>Make/Model: Kubota SVL-75 Compact Track Loader</p>
            <p>Serial Number: [TBD]</p>
            <p>Operating Weight: 9,420 lbs</p>
            <p>Replacement Value: $120,000</p>
          </div>
        </div>
      ),
    },
    {
      id: 'insurance',
      icon: <Shield className="h-5 w-5" />,
      title: '2. Insurance Requirements ("No COI, No Release")',
      required: true,
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-red-700">
            CRITICAL: Equipment will NOT be released without verified insurance.
          </p>
          <p>
            <strong>REQUIRED COVERAGE:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong>Commercial General Liability:</strong> Minimum $2,000,000 per occurrence
              <ul className="list-circle ml-4 mt-1 space-y-1">
                <li>Must name "U-Dig It Rentals Inc." as Additional Insured</li>
                <li>Must include waiver of subrogation</li>
                <li>Certificate must be current and valid for rental period</li>
              </ul>
            </li>
            <li>
              <strong>Equipment Coverage:</strong> Minimum $120,000
              <ul className="list-circle ml-4 mt-1 space-y-1">
                <li>Must name "U-Dig It Rentals Inc." as Loss Payee</li>
                <li>Must cover theft, damage, and total loss</li>
                <li>Deductible disclosed and accepted by Renter</li>
              </ul>
            </li>
            <li>
              <strong>Automobile Liability:</strong> Minimum $1,000,000
              <ul className="list-circle ml-4 mt-1 space-y-1">
                <li>Required if transporting equipment</li>
                <li>Trailer insurance if using trailer</li>
              </ul>
            </li>
          </ul>
          <div className="mt-3 border-l-4 border-red-500 bg-red-50 p-3">
            <p className="font-semibold text-red-800">INSURANCE POLICY:</p>
            <p className="text-red-700">"No Certificate of Insurance, No Equipment Release"</p>
            <p className="mt-1 text-xs text-red-600">
              Equipment remains property of Owner until insurance is verified and accepted.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'operating',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: '3. Operating Limits & Safety Requirements',
      required: true,
      content: (
        <div className="space-y-3 text-sm">
          <p>
            <strong>MAXIMUM OPERATING SLOPE:</strong> 25° (47% grade)
          </p>
          <p>
            <strong>PROHIBITED USES:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Demolition work exceeding equipment capacity</li>
            <li>Underwater operations or submersion</li>
            <li>Lifting or carrying personnel</li>
            <li>Any use exceeding manufacturer specifications</li>
          </ul>
          <p>
            <strong>REQUIRED PPE:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Hard hat (CSA approved)</li>
            <li>Safety glasses with side shields</li>
            <li>Steel-toed boots (CSA Grade 1)</li>
            <li>High-visibility vest</li>
            <li>Hearing protection in high-noise environments</li>
          </ul>
          <p>
            <strong>OPERATOR QUALIFICATIONS:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Must be 18+ years of age</li>
            <li>Valid driver's license required</li>
            <li>Equipment-specific training recommended</li>
            <li>Utility locates MUST be performed before digging</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'financial',
      icon: <Scale className="h-5 w-5" />,
      title: '4. Financial Terms & Conditions',
      required: true,
      content: (
        <div className="space-y-3 text-sm">
          <p>
            <strong>RENTAL RATES:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Daily Rate: $450/day</li>
            <li>Weekly Rate: $2,500/week (7+ days)</li>
            <li>Monthly Rate: $8,000/month (30+ days)</li>
          </ul>
          <p>
            <strong>SECURITY DEPOSIT:</strong> $500 (refundable within 7 business days)
          </p>
          <p>
            <strong>DELIVERY/PICKUP:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Flat Float: $150/way (includes up to 30km)</li>
            <li>Additional Distance: $3.00/km + HST (each way)</li>
          </ul>
          <p>
            <strong>LATE RETURN FEES:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>0-2 hours late: $75</li>
            <li>2-4 hours late: $175</li>
            <li>Over 4 hours late: Full day rate ($450)</li>
            <li>Maximum: $700/day for extended late returns</li>
          </ul>
          <p>
            <strong>DAMAGE RESPONSIBILITY:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Renter assumes ALL risk of loss or damage</li>
            <li>Responsible for repair costs up to replacement value ($120,000)</li>
            <li>Insurance deductible payable by Renter</li>
            <li>Cleaning fee if returned excessively dirty: $100</li>
            <li>Fuel charge if not returned full: $100</li>
          </ul>
          <p>
            <strong>CANCELLATION POLICY:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>More than 72 hours: Full refund</li>
            <li>48-72 hours: 50% cancellation fee</li>
            <li>Less than 48 hours: 100% cancellation fee (no refund)</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'liability',
      icon: <Shield className="h-5 w-5" />,
      title: '5. Liability & Indemnification',
      required: true,
      content: (
        <div className="space-y-3 text-sm">
          <p>
            <strong>RENTER'S RESPONSIBILITIES:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Maintain equipment in good working condition</li>
            <li>Report any damage or malfunction immediately</li>
            <li>Use equipment only for intended purposes</li>
            <li>Comply with all safety regulations and manufacturer guidelines</li>
            <li>Perform required daily inspections and maintenance</li>
          </ul>
          <p>
            <strong>INDEMNIFICATION:</strong>
          </p>
          <p className="ml-4 border-l-4 border-yellow-500 bg-yellow-50 p-3">
            Renter agrees to indemnify and hold harmless U-Dig It Rentals Inc., its officers,
            employees, and agents from any claims, damages, losses, or expenses arising from
            Renter's use of the equipment, including but not limited to property damage, personal
            injury, or death.
          </p>
          <p>
            <strong>LIMITATION OF LIABILITY:</strong>
          </p>
          <p className="ml-4">
            Owner's liability is limited to the repair or replacement of defective equipment. Owner
            is not liable for any indirect, incidental, consequential, or special damages arising
            from equipment use.
          </p>
          <p>
            <strong>GOVERNING LAW:</strong>
          </p>
          <p className="ml-4">
            This agreement is governed by the laws of the Province of New Brunswick, Canada. Any
            disputes shall be resolved in the courts of New Brunswick.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Rental Agreement Preview</h2>
              <p className="text-sm text-blue-100">Review before signing • 5 sections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-blue-800"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scroll Progress Indicator */}
        {!hasScrolledToBottom && (
          <div className="flex items-center justify-between border-b-2 border-yellow-300 bg-yellow-50 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <svg className="h-5 w-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Scroll down to review all sections</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
        >
          {/* Document Header */}
          <div className="rounded-lg border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <h3 className="mb-2 text-center text-2xl font-bold text-gray-900">
              EQUIPMENT RENTAL AGREEMENT
            </h3>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span>
                📅{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>📝 Booking: {bookingId?.substring(0, 8).toUpperCase() || 'PENDING'}</span>
              <span>•</span>
              <span>📄 8 pages</span>
            </div>
          </div>

          {/* Contract Sections (Accordion) */}
          {contractSections.map((section: any, index: any) => (
            <div
              key={section.id}
              className={`overflow-hidden rounded-lg border-2 transition-all ${
                expandedSections.has(section.id)
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-300 shadow-sm'
              } `}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 transition-all hover:from-gray-100 hover:to-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${expandedSections.has(section.id) ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'} `}
                  >
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">{section.title}</h4>
                    {section.required && (
                      <span className="text-xs font-semibold text-red-600">Required Reading</span>
                    )}
                  </div>
                </div>
                <svg
                  className={`h-6 w-6 text-gray-600 transition-transform ${expandedSections.has(section.id) ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div className="border-t-2 border-gray-200 bg-white px-6 py-4">
                  {section.content}
                </div>
              )}
            </div>
          ))}

          {/* Legal Notice */}
          <div className="rounded-lg bg-gray-900 p-6 text-white">
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-6 w-6 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-bold">⚖️ LEGAL NOTICE</p>
                <p>
                  By electronically signing this agreement, you acknowledge that your electronic
                  signature has the same legal force and effect as a handwritten signature under the
                  Uniform Electronic Commerce Act (UECA) and Personal Information Protection and
                  Electronic Documents Act (PIPEDA).
                </p>
                <p>
                  This agreement is governed by and construed in accordance with the laws of the
                  Province of New Brunswick, Canada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="rounded-b-xl border-t-2 border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-sm text-gray-600">
              {hasScrolledToBottom ? (
                <span className="flex items-center gap-2 font-semibold text-green-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ✓ You've reviewed the entire contract
                </span>
              ) : (
                <span className="text-yellow-700">⚠️ Please scroll to review all sections</span>
              )}
            </div>
            <div className="flex w-full gap-3 sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-100 sm:flex-initial"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (!hasScrolledToBottom) {
                    alert(
                      'Please scroll to the bottom to review the entire contract before proceeding'
                    );
                    return;
                  }
                  onProceedToSign();
                }}
                className={`flex-1 rounded-lg px-6 py-3 font-bold shadow-lg transition-all sm:flex-initial ${
                  hasScrolledToBottom
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                } `}
                disabled={!hasScrolledToBottom}
              >
                ✍️ Proceed to Sign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
