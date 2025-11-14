'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function SafetyPage() {
  return (
    <>
      <style jsx>{`
        .headline-3d {
          perspective: 1000px;
          perspective-origin: center;
        }
        .headline-3d h1 {
          transform: translateZ(40px) rotateX(2deg);
          transform-style: preserve-3d;
          filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.9))
            drop-shadow(0 16px 48px rgba(0, 0, 0, 0.7)) drop-shadow(0 24px 64px rgba(0, 0, 0, 0.5));
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        {/* Hero Section - Premium Gold Theme */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          {/* Premium Gold Accent Strip at Top */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>

          {/* Animated Dot Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '48px 48px',
              }}
            ></div>
          </div>

          {/* Multiple Logo Watermarks - Responsive */}
          <div className="pointer-events-none absolute inset-0">
            {/* Desktop Watermarks - Original (hidden on mobile) */}
            <div className="hidden md:block">
            {/* Top Left Corner */}
            <div className="absolute left-12 top-8 rotate-[8deg] opacity-10">
              <div className="relative h-56 w-56">
                <Image
                  src="/images/udigit-logo.png"
                  alt="U-Dig It Rentals - Safety First Equipment Operation Saint John NB"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 40px, 56px"
                  unoptimized
                />
              </div>
            </div>

            {/* Top Right Corner */}
            <div className="absolute right-16 top-12 rotate-[-10deg] opacity-10">
              <div className="relative h-60 w-60">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Safe Equipment Rental - U-Dig It Operator Safety"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 44px, 60px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Left */}
            <div className="absolute left-[15%] top-[22%] rotate-[-6deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="WorkSafe Equipment Operation - Safety Standards"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper Right */}
            <div className="absolute right-[18%] top-[24%] rotate-[12deg] opacity-10">
              <div className="relative h-52 w-52">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Operator Safety Training - U-Dig It Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 52px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Right */}
            <div className="absolute right-0 top-[45%] translate-x-[35%] rotate-[15deg] transform opacity-10">
              <div className="relative h-80 w-80">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Safe Equipment Use Guidelines - U-Dig It Rentals"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 60px, 80px"
                  unoptimized
                />
              </div>
            </div>

            {/* Center Left */}
            <div className="absolute left-0 top-[48%] -translate-x-[35%] rotate-[-12deg] transform opacity-10">
              <div className="w-76 h-76 relative">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Equipment Safety Protocols - U-Dig It"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 56px, 76px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Left */}
            <div className="absolute bottom-[12%] left-[20%] rotate-[4deg] opacity-10">
              <div className="relative h-44 w-44">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Operator Best Practices - U-Dig It Safety"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 32px, 44px"
                  unoptimized
                />
              </div>
            </div>

            {/* Bottom Right */}
            <div className="absolute bottom-[10%] right-[22%] rotate-[-7deg] opacity-10">
              <div className="relative h-48 w-48">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Safety First Equipment Rental - U-Dig It Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 36px, 48px"
                  unoptimized
                />
              </div>
            </div>

            {/* Upper center */}
            <div className="absolute left-[30%] top-[11%] rotate-[5deg] opacity-10">
              <div className="relative h-40 w-40">
                <Image
                  src="/images/udigit-logo.png"
                  alt="Safe Jobsite Practices - U-Dig It Rentals"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 28px, 40px"
                  unoptimized
                />
              </div>
            </div>
            </div>

            {/* Mobile Only - More Watermarks for better coverage */}
            <div className="md:hidden">
              <div className="absolute left-[2%] top-[3%] opacity-10"><div className="relative h-20 w-20"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="20px" unoptimized /></div></div>
              <div className="absolute right-[2%] top-[5%] rotate-12 opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
              <div className="absolute left-[20%] top-[12%] rotate-[-8deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute right-[15%] top-[15%] rotate-[10deg] opacity-10"><div className="relative h-14 w-14"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="14px" unoptimized /></div></div>
              <div className="absolute left-1/2 top-[2%] -translate-x-1/2 rotate-3 opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute left-[5%] top-1/3 -rotate-6 opacity-10"><div className="relative h-24 w-24"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="24px" unoptimized /></div></div>
              <div className="absolute right-[5%] top-[45%] rotate-[8deg] opacity-10"><div className="relative h-24 w-24"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="24px" unoptimized /></div></div>
              <div className="absolute left-[10%] top-[50%] rotate-[5deg] opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
              <div className="absolute right-[12%] top-[55%] -rotate-[7deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute bottom-[8%] left-[8%] rotate-6 opacity-10"><div className="relative h-20 w-20"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="20px" unoptimized /></div></div>
              <div className="absolute bottom-[3%] right-[3%] -rotate-6 opacity-10"><div className="relative h-22 w-22"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="22px" unoptimized /></div></div>
              <div className="absolute bottom-[15%] left-[25%] rotate-[4deg] opacity-10"><div className="relative h-14 w-14"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="14px" unoptimized /></div></div>
              <div className="absolute bottom-[12%] right-[20%] -rotate-[5deg] opacity-10"><div className="relative h-16 w-16"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="16px" unoptimized /></div></div>
              <div className="absolute bottom-[2%] left-1/3 -rotate-3 opacity-10"><div className="relative h-18 w-18"><Image src="/images/udigit-logo.png" alt="U-Dig It Rentals" fill className="object-contain" sizes="18px" unoptimized /></div></div>
            </div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <div className="headline-3d text-center">
              <div className="mb-6 inline-block">
                <span className="rounded-full border border-[#E1BC56]/30 bg-[#E1BC56]/20 px-6 py-2 text-sm font-semibold tracking-wide text-[#E1BC56] backdrop-blur-sm">
                  SAFETY FIRST
                </span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                Safety Guidance &
                <br />
                <span className="bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] bg-clip-text text-transparent">
                  Operator Resources
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                Safe, efficient, and lawful operation of all rented equipment.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/book"
                  className="transform rounded-lg bg-gradient-to-r from-[#E1BC56] via-[#F4D03F] to-[#E1BC56] px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                >
                  Book Equipment Now
                </Link>
                <a
                  href="tel:+15066431575"
                  className="transform rounded-lg border-2 border-white bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
                >
                  📞 (506) 643-1575
                </a>
              </div>
            </div>
          </div>

          {/* Premium Gold Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E1BC56] to-transparent"></div>
        </div>

        {/* Main Content */}
        <div className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white p-8 shadow-lg">
              <div className="prose prose-lg max-w-none">
                {/* Last Updated */}
                <p className="mb-8 text-sm text-gray-600">Last updated: August 17, 2025</p>

                {/* Introduction */}
                <p className="mb-6 leading-relaxed text-gray-700">
                  U-Dig It Rentals Inc. is committed to safe, efficient, and lawful operation of all
                  rented equipment. This guide gives operators clear rules, checklists, and
                  procedures. It does not replace the manufacturer's Operator's Manual or applicable
                  law. When in doubt, stop work and contact us.
                </p>

                {/* Scope & Legal Framework */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  SCOPE & LEGAL FRAMEWORK
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
                  <p className="mb-3 text-gray-700">
                    <strong>Applies to:</strong> All renters/operators of U-Dig It Rentals equipment
                    and attachments, on any jobsite.
                  </p>
                  <p className="mb-3 text-gray-700">
                    <strong>Follow first:</strong> Manufacturer Operator's Manual, machine decals,
                    and your signed Rental Agreement.
                  </p>
                  <p className="mb-3 text-gray-700">
                    <strong>Also comply with:</strong> WorkSafeNB / NB OHS regulations, municipal
                    bylaws, road/transport rules, utility-locate requirements, and environmental
                    laws.
                  </p>
                  <p className="font-semibold text-blue-900">
                    If rules conflict, the stricter requirement applies.
                  </p>
                </div>

                {/* Roles & Responsibilities */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  ROLES & RESPONSIBILITIES
                </h2>
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Renter/Employer</h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>Select a competent operator; provide training, supervision, and PPE.</li>
                      <li>
                        Complete utility locates; set up site controls (exclusion zones, traffic
                        plan).
                      </li>
                      <li>Keep daily inspection logs; report defects/incidents immediately.</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Operator</h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>Be trained/competent, sober, and fit for duty.</li>
                      <li>
                        Perform pre-start and post-use checks; operate within limits; stop if
                        unsafe.
                      </li>
                      <li>Protect people, property, and the environment.</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">
                      Spotter/Traffic Controller (if used)
                    </h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>
                        Maintain line of sight; use standard hand signals; has authority to STOP
                        work.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">U-Dig It Rentals</h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>
                        Provide safe, maintained equipment at delivery; supply basic instruction and
                        documentation; respond to defect reports and incidents.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Competency & Fit-for-Duty */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  COMPETENCY & FIT-FOR-DUTY
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    No alcohol/impairing drugs (including some prescriptions) within prohibited
                    windows.
                  </li>
                  <li>Manage fatigue/illness/heat or cold stress before operating.</li>
                  <li>Vision/hearing adequate (use corrective aids as required).</li>
                  <li>New operators supervised until competency is demonstrated.</li>
                </ul>

                {/* Required PPE */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">REQUIRED PPE</h2>
                <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                  <p className="mb-3 font-semibold text-green-900">Minimum on all jobs:</p>
                  <ul className="mb-4 list-disc space-y-1 pl-6 text-sm text-gray-700">
                    <li>CSA-approved safety boots with toe protection</li>
                    <li>High-visibility vest/jacket (Class 2 or higher)</li>
                    <li>Safety glasses with side shields</li>
                    <li>Hearing protection (plugs or muffs)</li>
                    <li>Work gloves; hard hat where overhead hazards exist</li>
                  </ul>
                  <p className="mb-2 font-semibold text-green-900">Task-based add-ons:</p>
                  <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                    <li>Respirator for dust/silica/fumes (fit-tested)</li>
                    <li>Cut-resistant gloves for chain/brush work</li>
                    <li>FR/arc-rated PPE where required by the site owner</li>
                  </ul>
                </div>

                {/* Pre-Job Planning */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  PRE-JOB PLANNING (JHA/FLHA)
                </h2>
                <p className="mb-3 text-gray-700">Before each shift/day:</p>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    <strong>Site walk-through:</strong> ground stability, slopes, edges/voids,
                    septic, wells, culverts, overhead lines, traffic/pedestrians, pets/public.
                  </li>
                  <li>
                    <strong>Utilities:</strong> request/verify locates; keep ticket # and map on
                    site; hand-expose as required.
                  </li>
                  <li>
                    <strong>Traffic plan:</strong> cones/signage, spotter location, public
                    interface, parking areas.
                  </li>
                  <li>
                    <strong>Exclusion zones:</strong> minimum 3 m (10 ft) around the machine;
                    increase for higher risk.
                  </li>
                  <li>
                    <strong>Comms plan:</strong> agree on hand signals/radios; anyone can call STOP.
                  </li>
                  <li>
                    <strong>Emergency plan:</strong> first aid, address/coordinates, access route,
                    spill kit, extinguisher, emergency contacts.
                  </li>
                  <li>
                    <strong>Environmental controls:</strong> spill prevention, dust/noise control,
                    stormwater/silt.
                  </li>
                </ul>
                <p className="mb-6 text-sm italic text-gray-600">
                  Log the plan and keep it with your pre-start.
                </p>

                {/* Utility Locates */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  UTILITY LOCATES & GROUND DISTURBANCE
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-6">
                  <ul className="list-disc space-y-2 pl-6 text-sm text-gray-700">
                    <li>Use the provincial service (e.g., Click Before You Dig).</li>
                    <li>
                      Respect required clearances; hand-dig to confirm line location/depth where
                      required.
                    </li>
                    <li>Stop work if marks are unclear or conditions change.</li>
                    <li>
                      <strong>If a line is contacted:</strong> stop, secure area, call 911 if
                      needed, notify the utility owner and U-Dig It; do not backfill or attempt
                      repairs.
                    </li>
                  </ul>
                </div>

                {/* Company Operating Limits */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  COMPANY OPERATING LIMITS (POLICY)
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <ul className="list-disc space-y-2 pl-6 text-sm text-gray-700">
                    <li>
                      <strong>Maximum working slope:</strong> Do not exceed 25° (≈46% grade).
                    </li>
                    <li>Travel straight up/down slopes; avoid side-hilling.</li>
                    <li>Keep attachment/load low and close to the machine.</li>
                    <li>Reduce limits dramatically on wet, icy, loose, or rutted ground.</li>
                    <li>
                      <strong>People:</strong> no riders; never lift or carry people with the
                      bucket/forks; never work under raised arms without the manufacturer's
                      mechanical support device in place.
                    </li>
                    <li>
                      <strong>Safety systems:</strong> seat belt, lap bar, interlocks, and backup
                      alarm must function.
                    </li>
                    <li>
                      <strong>Phones:</strong> no device use while operating.
                    </li>
                  </ul>
                  <p className="mt-3 text-sm italic text-red-900">
                    Tip: a smartphone inclinometer or digital angle finder can help verify slope.
                  </p>
                </div>

                {/* Machine Selection & Capacity */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  MACHINE SELECTION, CAPACITY & ATTACHMENTS
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Never exceed nameplate capacity (rated operating capacity / tipping load).
                  </li>
                  <li>
                    Attachments change capacity—check the attachment plate, manual, or our specs.
                  </li>
                  <li>
                    After attaching, lower to the ground and cycle tilt; visually confirm coupler
                    pins engaged. Re-check often.
                  </li>
                  <li>
                    Clean hydraulic quick-connects; verify they are fully seated; check for leaks.
                  </li>
                </ul>

                {/* Daily Pre-Start Inspection */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  DAILY PRE-START INSPECTION (LOG EVERY SHIFT)
                </h2>
                <div className="mb-6 space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Exterior/Undercarriage:</h3>
                    <p className="text-sm text-gray-700">
                      tracks (tension, cuts), debris in sprockets/rollers, drive motors dry;
                      frame/ROPS/FOPS intact; decals legible; attachment/coupler pins/locks good;
                      cylinders/hoses sound; no leaks/damage; belly pans clear.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Fluids & Cooling:</h3>
                    <p className="text-sm text-gray-700">
                      engine oil, coolant, hydraulic oil, fuel; radiator/oil cooler screens clean;
                      fan unrestricted.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Cab & Controls:</h3>
                    <p className="text-sm text-gray-700">
                      clean floor; pedals unobstructed; seat secure; seat belt OK; lap
                      bar/interlocks OK; horn/lights/backup alarm OK; wipers OK; fire extinguisher
                      (if supplied) charged.
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 font-bold text-gray-900">Function test:</h3>
                    <p className="text-sm text-gray-700">
                      start/idle; warning lights normal; smooth lift/tilt/aux hydraulics; parking
                      brake holds.
                    </p>
                  </div>
                  <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                    <p className="font-semibold text-red-900">
                      Unsafe or defective? Tag out and call U-Dig It.
                    </p>
                  </div>
                </div>

                {/* Operating Best Practices */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  OPERATING BEST PRACTICES
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Mount/dismount with three points of contact—never jump.</li>
                  <li>Travel at walking speed in tight areas; avoid sudden turns on slopes.</li>
                  <li>
                    Stay well back from edges/voids/trenches; approach square with bucket low.
                  </li>
                  <li>
                    Use a spotter for tight access, pedestrians/traffic, or blind spots—agree on
                    signals.
                  </li>
                  <li>
                    Treat hydraulic leaks as high-pressure injection hazards—do not touch;
                    depressurize per manual; seek medical care immediately if injected.
                  </li>
                  <li>Control noise/dust; use hearing protection and dust suppression.</li>
                </ul>

                {/* Working on Grades */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  WORKING ON GRADES (DETAIL)
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Keep the heavy end uphill (with a loaded bucket, the front is heavy).
                  </li>
                  <li>
                    If traction breaks: lower the bucket, steer straight, do not turn sharply.
                  </li>
                  <li>
                    Avoid cross-slope travel; if unavoidable, go slow with load inches above ground.
                  </li>
                </ul>

                {/* Forks & Pallet Handling */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  FORKS & PALLET HANDLING
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Set forks wide/even; keep load centered and banded if possible.</li>
                  <li>Tilt slightly back; keep load low while traveling.</li>
                  <li>No side-loading; no personnel near/under forks.</li>
                  <li>Respect the attachment's rated capacity at load center.</li>
                </ul>

                {/* Loading, Transport & Tie-Down */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  LOADING, TRANSPORT & TIE-DOWN
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Trailer must have adequate GVWR, working brakes, rated ramps, and a capable tow
                    vehicle.
                  </li>
                  <li>
                    Load slowly with bucket low; center over axles; use a spotter as needed.
                  </li>
                  <li>
                    Secure with four independent chains/straps to manufacturer tie-downs; secure
                    attachments separately.
                  </li>
                  <li>Re-check tie-down tension after 15–30 minutes of travel.</li>
                </ul>

                {/* Refuelling & Fire Safety */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  REFUELLING, FIRE SAFETY & BATTERIES
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Diesel only (ULSD). Engine off; no smoking; ground the nozzle; spill kit ready.
                  </li>
                  <li>
                    If DEF is required: use ISO 22241 product; never cross-contaminate.
                  </li>
                  <li>Allow cool-down before servicing; keep engine bay clean of debris.</li>
                  <li>
                    Jump-starting: follow manual; final ground away from the battery; beware of
                    explosive gases.
                  </li>
                </ul>

                {/* Weather & Seasonal Operations */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  WEATHER & SEASONAL OPERATIONS
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Lightning/high winds: stop work, secure equipment.</li>
                  <li>
                    Rain/snow/ice: slow down; avoid slopes; clear steps/handholds; de-ice cab floor.
                  </li>
                  <li>
                    Heat/cold stress: hydrate, take breaks, warm up/cool down; watch for symptoms.
                  </li>
                </ul>

                {/* Environmental Protection */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  ENVIRONMENTAL PROTECTION
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Keep drip trays/absorbents available; clean up spills immediately; report
                    significant spills per law and to U-Dig It.
                  </li>
                  <li>Avoid tracking sediment off site; use silt controls where needed.</li>
                  <li>Refuel &gt;30 m from watercourses where practicable.</li>
                </ul>

                {/* Shutdown & Securing */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  SHUTDOWN & SECURING
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Park level if possible; lower attachment to ground; neutralize controls; set
                    brake.
                  </li>
                  <li>Idle to cool, then shut down; raise lap bar; remove key; chock if on a grade.</li>
                  <li>
                    End-of-shift housekeeping: clear debris from radiator/engine bay; pick up tools.
                  </li>
                </ul>

                {/* Maintenance & Fault Reporting */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  MAINTENANCE & FAULT REPORTING
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>
                    Grease as per manual; wipe zerks; avoid over-greasing near belts/alternator.
                  </li>
                  <li>Report defects immediately (photos + description).</li>
                  <li>
                    Do not perform repairs that require lockout, lifting-arm support devices, or
                    specialized tools without authorization.
                  </li>
                </ul>

                {/* Incident & Emergency Response */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  INCIDENT & EMERGENCY RESPONSE
                </h2>
                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-6">
                  <p className="mb-4 font-semibold text-red-900">
                    Life-threatening: call 911 first.
                    <br />
                    Then contact U-Dig It Rentals:{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>{' '}
                    · 945 Golden Grove Road, Saint John, New Brunswick, E2H 2X1, Canada
                  </p>

                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <strong className="text-red-900">Tip-over:</strong> remain seat-belted,
                      hands/feet inside, brace. After movement stops, shut down if possible. Exit
                      only if safe.
                    </div>
                    <div>
                      <strong className="text-red-900">Fire:</strong> if small and safe—use
                      extinguisher (P.A.S.S.); otherwise evacuate and call 911.
                    </div>
                    <div>
                      <strong className="text-red-900">Utility strike:</strong> stop, secure area. If
                      electrical contact suspected, stay in cab until utility confirms safe; if
                      evacuation is required due to fire, jump clear with both feet together and hop
                      away—do not touch machine and ground simultaneously.
                    </div>
                    <div>
                      <strong className="text-red-900">Injury/near-miss/property damage:</strong> make
                      area safe, provide first aid, record details, notify us immediately.
                    </div>
                    <div>
                      <strong className="text-red-900">Hydraulic injection injury:</strong> treat as a
                      medical emergency—go to hospital immediately even if the wound looks minor.
                    </div>
                  </div>
                </div>

                {/* Documentation to Keep on Site */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  DOCUMENTATION TO KEEP ON SITE
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Utility locate ticket(s) and sketch/map</li>
                  <li>This Safety Guidance (printed or saved)</li>
                  <li>Daily pre-start checklist (signed) and hour-meter reading</li>
                  <li>Delivery/inspection forms and Rental Agreement</li>
                  <li>Emergency contacts (site owner, utilities, U-Dig It Rentals)</li>
                </ul>

                {/* Quick Checklists */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">QUICK CHECKLISTS</h2>
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg border-2 border-green-500 bg-green-50 p-6">
                    <h3 className="mb-3 font-bold text-green-900">A) Pre-Start (Daily)</h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>PPE on; JHA reviewed; exclusion zones set</li>
                      <li>Walk-around complete; no leaks/damage</li>
                      <li>Tracks/undercarriage clear; tension OK</li>
                      <li>Coupler pins locked; hoses/quick-connects seated</li>
                      <li>Fluids OK; coolers/radiator clean</li>
                      <li>Cab clean; seat secure; belt good; lap bar works</li>
                      <li>Horn/lights/backup alarm; interlocks OK</li>
                      <li>Lift/tilt/aux test slow; parking brake holds</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-6">
                    <h3 className="mb-3 font-bold text-yellow-900">B) Operating</h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>Bucket/load low; travel slow; use spotter as needed</li>
                      <li>
                        Keep ≥3 m (10 ft) from people/vehicles (more if risk increases)
                      </li>
                      <li>Straight up/down slopes; ≤25°; avoid side-hilling</li>
                      <li>Stay back from edges/voids; approach square</li>
                      <li>Stop for poor visibility, fatigue, or changing ground conditions</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6">
                    <h3 className="mb-3 font-bold text-blue-900">C) Post-Use</h3>
                    <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700">
                      <li>Park level; attachment down; brake set</li>
                      <li>Idle-cool; shut down; remove key; chock if needed</li>
                      <li>Clean radiator/engine bay; remove debris</li>
                      <li>Note hours; defects; fuel level; photos if damage/concern</li>
                    </ul>
                  </div>
                </div>

                {/* Standard Hand Signals */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  STANDARD HAND SIGNALS
                </h2>
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>
                      <strong>STOP:</strong> arms raised, palms facing operator
                    </li>
                    <li>
                      <strong>Move forward/back:</strong> arm motioning in the travel direction
                    </li>
                    <li>
                      <strong>Turn left/right:</strong> arm extended pointing left/right
                    </li>
                    <li>
                      <strong>Raise/lower:</strong> palm up/down motion
                    </li>
                    <li>
                      <strong>Tilt:</strong> hand mimics bucket angle
                    </li>
                  </ul>
                  <p className="mt-4 font-semibold text-gray-900">
                    Operator obeys STOP immediately—from anyone on site.
                  </p>
                </div>

                {/* Recovery/Getting Unstuck */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  RECOVERY/GETTING UNSTUCK (LAST RESORT)
                </h2>
                <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-700">
                  <li>Do not pull from axles, cylinders, or guards.</li>
                  <li>
                    Use only rated recovery points and rated rigging; clear the "line of fire."
                  </li>
                  <li>Never straddle a winch line/strap; use a damper blanket.</li>
                  <li>If unsure, contact U-Dig It for guidance or recovery.</li>
                </ul>

                {/* Model-Specific Values */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
                  MODEL-SPECIFIC VALUES
                </h2>
                <p className="mb-6 text-gray-700">
                  Each unit/attachment has unique limits (ROC, hydraulic pressures/flows, weights,
                  slopes). Check the Operator's Manual and nameplates supplied with your rental. If
                  you need a copy, contact us and we'll provide it.
                </p>

                {/* Contact & Support */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">CONTACT & SUPPORT</h2>
                <div className="mb-6 rounded-lg bg-gray-50 p-6">
                  <p className="mb-2 text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:nickbaxter@udigit.ca" className="text-blue-600 hover:underline">
                      nickbaxter@udigit.ca
                    </a>
                  </p>
                  <p className="mb-2 text-gray-700">
                    <strong>Phone:</strong>{' '}
                    <a href="tel:+15066431575" className="text-blue-600 hover:underline">
                      1 (506) 643-1575
                    </a>
                  </p>
                  <p className="mb-2 text-gray-700">
                    <strong>Address:</strong> 945 Golden Grove Road, Saint John, New Brunswick, E2H
                    2X1, Canada
                  </p>
                  <p className="text-gray-700">
                    <strong>Website:</strong>{' '}
                    <a href="https://udigit.ca" className="text-blue-600 hover:underline">
                      udigit.ca
                    </a>
                  </p>
                </div>

                {/* Legal Notes */}
                <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">LEGAL NOTES</h2>
                <div className="mb-6 rounded-lg border-l-4 border-gray-500 bg-gray-50 p-6">
                  <p className="text-sm text-gray-700">
                    This guidance is informational and does not replace the Operator's Manual or law.
                    Your signed Rental Agreement governs the rental. Failure to follow safety rules
                    may result in termination of the rental and charges for damage, recovery,
                    downtime, and cleaning.
                  </p>
                </div>

                {/* Help Section */}
                <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <p className="font-semibold text-blue-900">⚠️ Safety First, Always</p>
                  <p className="mt-2 text-blue-800">
                    If you have any questions about safe operation, equipment capabilities, or site
                    conditions, contact us before proceeding. Your safety and the safety of others is
                    our top priority.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="tel:+15066431575"
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      📞 Call (506) 643-1575
                    </a>
                    <a
                      href="mailto:nickbaxter@udigit.ca"
                      className="inline-flex items-center justify-center rounded-lg border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      ✉️ Email Safety Team
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}


