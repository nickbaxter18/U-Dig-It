/**
 * SVL75-3 Equipment Rider Standalone Page
 * Displays the equipment-specific rider as a standalone document
 */

/**
 * SVL75-3 Equipment Rider Standalone Page
 * Displays the equipment-specific rider as a standalone document
 */

import { AlertTriangle, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SVL753RiderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <Link
            href="/equipment"
            className="mb-4 inline-flex items-center text-blue-100 transition-colors hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Equipment
          </Link>

          <h1 className="mb-2 flex items-center text-3xl font-bold">
            <FileText className="mr-3 h-8 w-8" />
            2025 Kubota SVL75-3 Equipment Rider
          </h1>
          <p className="text-blue-100">
            Equipment-specific rental terms and conditions for the Kubota SVL75-3 Compact Track
            Loader
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Information Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">About This Document</h2>
              <p className="mb-4 text-gray-700">
                This equipment-specific rider supplements the standard U-Dig It Rentals rental
                agreement. It contains important information about operating the Kubota SVL75-3,
                including:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>
                    Insurance requirements (CGL ≥ $2M, Equipment Coverage, Auto Liability)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>Transport and tie-down safety specifications</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>Operating limits (max 25° slope, PPE requirements, utility locates)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>Prohibited uses and maintenance obligations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-600">✓</span>
                  <span>
                    Financial terms including deposits, fuel, cleaning, and damage responsibility
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Equipment Specifications</h2>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-semibold">2025 Kubota SVL75-3</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">Compact Track Loader</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Operating Weight:</span>
                  <span className="font-semibold">9,190 - 9,420 lb</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Replacement Value:</span>
                  <span className="font-semibold text-blue-600">$120,000 CAD</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Hour Allowance:</span>
                  <span className="font-semibold">8 hrs/day, 40 hrs/week</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overage Rate:</span>
                  <span className="font-semibold">$65/hour</span>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href="/getting-insurance"
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Get Insurance Information
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mb-6 rounded-r-lg border-l-4 border-yellow-400 bg-yellow-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="mt-0.5 h-6 w-6 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-yellow-800">"No COI, No Release" Policy</h3>
              <p className="mt-1 text-sm text-yellow-700">
                <strong>Insurance is mandatory before equipment release.</strong> You must provide a
                Certificate of Insurance (COI) with proper endorsements showing U-Dig It Rentals
                Inc. as Additional Insured and Loss Payee. Coverage requirements: CGL ≥ $2,000,000,
                Equipment Coverage at full replacement value, and Auto Liability ≥ $1,000,000 if
                transporting on public roads.
              </p>
            </div>
          </div>
        </div>

        {/* Rider Document Content */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 text-white">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">EQUIPMENT-SPECIFIC RIDER</h2>
              <h3 className="mb-3 text-xl text-gray-200">
                2025 Kubota SVL75-3 Compact Track Loader
              </h3>
              <p className="text-sm text-gray-400">
                Document ID: UDIR-SVL75-3-RIDER | Version: 1.0 | Effective: Aug 22, 2025
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-6">
            <div className="flex items-start">
              <AlertTriangle className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-600" />
              <div>
                <h3 className="mb-2 text-sm font-semibold text-yellow-900">
                  ⚠️ IMPORTANT LEGAL NOTICE
                </h3>
                <p className="text-sm text-yellow-800">
                  This Rider is incorporated into and made part of the U-Dig It Rentals Inc. Rental
                  Agreement. If there is any conflict, the stricter term (greater safety/financial
                  protection) applies unless otherwise agreed in writing by U-Dig It Rentals Inc.
                  ("Owner").
                </p>
              </div>
            </div>
          </div>

          {/* Document Sections */}
          <div className="space-y-8 p-8">
            {/* Section 1: Unit Details */}
            <section>
              <h3 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-bold text-gray-900">
                1) Unit Details
              </h3>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <strong>Equipment:</strong> 2025 Kubota SVL75-3 (Compact Track Loader)
                </div>
                <div>
                  <strong>Replacement Value:</strong> $120,000 CAD (base unit w/ bucket)
                </div>
                <div>
                  <strong>Operating Weight:</strong> 9,190 lb (open cab) / 9,420 lb (closed cab)
                </div>
                <div>
                  <strong>Hour Allowance:</strong> 8 engine-hours/day, 40/week; excess at $65/hr
                </div>
              </div>
              <div className="mt-4">
                <strong className="mb-2 block">Transport Dimensions:</strong>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                  <li>Length (no bucket): 112 in (2,844 mm)</li>
                  <li>Length (bucket on ground): 142.1 in (3,609 mm)</li>
                  <li>Height (top of cab): 81.8 in (2,078 mm)</li>
                  <li>Vehicle width: 65.9 in (1,675 mm) standard / 69.1 in (1,755 mm) wide</li>
                  <li>Width with bucket: 68 in (1,727 mm)</li>
                </ul>
              </div>
            </section>

            {/* Section 2: Insurance */}
            <section>
              <h3 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-bold text-gray-900">
                2) Insurance (Required — "No COI, No Release")
              </h3>
              <p className="mb-4 text-sm">
                Renter must maintain, at Renter's expense, and provide evidence (COI + endorsements)
                approved by Owner before release and continuous through the Rental Period:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>CGL:</strong> ≥ $2,000,000 per occurrence, U-Dig It Rentals Inc. as
                  Additional Insured, primary & non-contributory, waiver of subrogation.
                </li>
                <li>
                  <strong>Rented/Leased Equipment/Property:</strong> limit ≥ full replacement value;
                  U-Dig It Rentals Inc. as Loss Payee.
                </li>
                <li>
                  <strong>Automobile Liability:</strong> ≥ $1,000,000 if Renter transports on public
                  roads.
                </li>
                <li>
                  <strong>Notice of Cancellation:</strong> insurer notice to Owner where available
                  (e.g., 10–30 days).
                </li>
              </ul>
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  <strong>Failure to maintain coverage is a material breach;</strong> Owner may
                  refuse release or repossess at Renter's expense.
                </p>
              </div>
            </section>

            {/* Section 3: Transport */}
            <section>
              <h3 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-bold text-gray-900">
                3) Transport & Tie-Down
              </h3>
              <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
                <li>Professional loading/unloading only; no one in cab during load/unload.</li>
                <li>
                  Trailer, hitch, tow vehicle, chains/binders & straps must be properly rated;
                  minimum 4-point tie-down on the machine; secure attachments separately.
                </li>
                <li>Verify overhead/bridge/width/weight limits; obtain permits where required.</li>
                <li>No public-road operation of the machine unless legally permitted.</li>
              </ul>
            </section>

            {/* Section 4: Operating Limits */}
            <section>
              <h3 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-bold text-gray-900">
                4) Operating Limits & Safety
              </h3>
              <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
                <li>
                  <strong>Max grade/slope:</strong> ≤ 25°. Travel straight up/down; avoid
                  side-hilling.
                </li>
                <li>
                  No riders; never lift/carry people; use manufacturer arm support/lock for work
                  under raised arms.
                </li>
                <li>
                  <strong>PPE:</strong> CSA boots, hi-viz, eye/ear protection; hard hat where
                  overhead hazards exist.
                </li>
                <li>
                  Utility locates completed and on site before ground disturbance; maintain
                  clearance from buried/overhead utilities.
                </li>
                <li>
                  Follow Operator's Manual, decals, and site rules; stop if unsafe and contact
                  Owner.
                </li>
                <li>
                  No impairment (alcohol/cannabis/drugs); competent adult operators (21+) only.
                </li>
                <li>No sub-rental or lending without Owner's written consent.</li>
              </ul>
            </section>

            {/* Sections 5-14 Summary */}
            <section>
              <h3 className="mb-4 border-b-2 border-blue-600 pb-2 text-lg font-bold text-gray-900">
                5-14) Additional Terms
              </h3>
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold">5) Prohibited Uses</h4>
                  <ul className="list-inside list-disc space-y-1 text-gray-700">
                    <li>Demolition beyond rated capability</li>
                    <li>Hazmat/contamination</li>
                    <li>Saltwater/deep mud operations</li>
                    <li>Alterations or disabling safety devices</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">6) Care & Maintenance</h4>
                  <ul className="list-inside list-disc space-y-1 text-gray-700">
                    <li>Daily pre-start inspection required</li>
                    <li>Grease per manual, check fluids/tracks</li>
                    <li>Report defects immediately</li>
                    <li>Renter responsible for fuel and cleaning</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">7) Damage, Loss, Theft</h4>
                  <ul className="list-inside list-disc space-y-1 text-gray-700">
                    <li>Renter responsible for all damage/loss</li>
                    <li>Tracks, teeth, glass, hoses billable</li>
                    <li>Theft: notify police immediately</li>
                    <li>Spills: immediate cleanup required</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">8) Financial Terms</h4>
                  <ul className="list-inside list-disc space-y-1 text-gray-700">
                    <li>Security deposit: $500 (not a cap)</li>
                    <li>Fuel: $100 refuel charge if not full</li>
                    <li>Cleaning: $100 flat rate for excess mud</li>
                    <li>Late return: billed daily until returned</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold">9) Telematics & Privacy</h4>
                  <p className="text-gray-700">
                    GPS/telematics data used for tracking and diagnostics. Pre/post-rental photos
                    for condition documentation.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">10) Site & Access</h4>
                  <p className="text-gray-700">
                    Renter provides safe, level access. Snow/ice management is Renter's
                    responsibility.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">11) Return Condition</h4>
                  <p className="text-gray-700">
                    Park level, bucket down, brake set. Clean radiator/tracks. Return all
                    attachments and keys.
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">12) Remedies & Repossession</h4>
                  <p className="text-gray-700">
                    Owner may repossess immediately upon breach or unsafe use.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold">13) Governing Law</h4>
              <p className="text-sm text-gray-700">
                This Rider and the Rental Agreement are governed by the laws of the{' '}
                <strong>Province of New Brunswick, Canada</strong>.
              </p>
            </section>

            <section className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h4 className="mb-3 font-semibold">14) Acceptance & Authority to Charge</h4>
              <p className="mb-3 text-sm text-gray-800">By signing, Renter acknowledges:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                <li>Equipment received in good condition</li>
                <li>Read and understood all terms</li>
                <li>Understands "No COI, No Release" requirement</li>
                <li>Responsible for damage, loss, theft</li>
                <li>$500 deposit is not a liability cap</li>
                <li>Authorizes charges for fuel, cleaning, overages, recovery</li>
                <li>LDW (if offered) is not insurance</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Questions About This Rider?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">📞 Phone</h3>
              <p className="text-gray-600">(506) 555-RENT</p>
              <p className="mt-1 text-xs text-gray-500">Mon-Fri: 7am - 6pm AST</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">📧 Email</h3>
              <p className="text-gray-600">rentals@udigit.ca</p>
              <p className="mt-1 text-xs text-gray-500">Response within 2 hours</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">📍 Location</h3>
              <p className="text-gray-600">Saint John, NB</p>
              <p className="mt-1 text-xs text-gray-500">Serving Atlantic Canada</p>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/book"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Book SVL75-3 Now
          </Link>

          <Link
            href="/equipment"
            className="inline-flex items-center rounded-lg bg-gray-100 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-200"
          >
            View All Equipment
          </Link>

          <Link
            href="/rider"
            className="inline-flex items-center rounded-lg bg-gray-100 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-200"
          >
            <FileText className="mr-2 h-4 w-4" />
            Standard Rental Terms
          </Link>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 border-t border-gray-200 bg-gray-100 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600">
          <p>
            Document Version 1.0 | Effective: August 22, 2025 | U-Dig It Rentals Inc. | Saint John,
            New Brunswick, Canada
          </p>
          <p className="mt-2">
            This rider forms an integral part of the rental agreement and is governed by the laws of
            the Province of New Brunswick.
          </p>
        </div>
      </div>
    </div>
  );
}
