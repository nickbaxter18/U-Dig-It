/**
 * Booking Confirmation Page
 * Shown after successful payment and contract signing
 */

import { createClient } from '@/lib/supabase/server';
import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BookingConfirmedPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `
      *,
      equipment:equipmentId(make, model, unitId, images),
      customer:customerId(firstName, lastName, email, phone),
      contracts(id, status, signedAt),
      payments(amount, status, processedAt)
    `
    )
    .eq('id', params.id)
    .single();

  if (!booking) {
    redirect('/dashboard');
  }

  try {
    await checkAndCompleteBookingIfReady(params.id, 'Confirmed Page Viewed');
  } catch (error) {
    logger.error('Booking confirmed page completion check failed', {
      component: 'booking-confirmed-page',
      action: 'completion_check_error',
      metadata: { bookingId: params.id },
    }, error instanceof Error ? error : new Error(String(error)));
  }

  const contract = Array.isArray(booking.contracts)
    ? booking.contracts.find((c: { status?: string }) => c?.status === 'signed' || c?.status === 'completed')
      ?? booking.contracts[0]
    : null;
  const payment = booking.payments?.[0];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">🎉 Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your equipment rental is all set. We'll deliver it on schedule.
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Booking Details</h2>

          <div className="space-y-4">
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600">Booking Number</span>
              <span className="font-semibold text-gray-900">{booking.bookingNumber}</span>
            </div>

            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600">Equipment</span>
              <span className="font-semibold text-gray-900">
                {booking.equipment.make} {booking.equipment.model}
              </span>
            </div>

            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600">Rental Period</span>
              <span className="font-semibold text-gray-900">
                {new Date(booking.startDate).toLocaleDateString()} -{' '}
                {new Date(booking.endDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600">Delivery Address</span>
              <span className="text-right font-semibold text-gray-900">
                {booking.deliveryAddress || 'Pickup'}
              </span>
            </div>

            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-lg font-semibold text-green-600">
                ${Number(booking.totalAmount).toFixed(2)}
              </span>
            </div>

            {payment && (
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">Payment Status</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  ✅ Paid
                </span>
              </div>
            )}

            {contract && (
              <div className="flex justify-between border-b py-2">
                <span className="text-gray-600">Contract Status</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  ✅ Signed
                </span>
              </div>
            )}
          </div>
        </div>

        {/* What's Next */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-blue-900">
            <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            What Happens Next?
          </h3>
          <ol className="space-y-4 text-blue-800">
            <li className="flex items-start">
              <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                1
              </span>
              <div className="flex-1 pt-1">
                <strong className="text-blue-900">Confirmation Email Sent</strong>
                <p className="mt-1 text-sm text-blue-700">
                  Check your inbox at <strong>{booking.customer.email}</strong> for complete booking details, receipt, and signed contract copy.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                2
              </span>
              <div className="flex-1 pt-1">
                <strong className="text-blue-900">Equipment Preparation</strong>
                <p className="mt-1 text-sm text-blue-700">
                  Our team is preparing your {booking.equipment.make} {booking.equipment.model} and will perform a full safety inspection before delivery.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                3
              </span>
              <div className="flex-1 pt-1">
                <strong className="text-blue-900">Pre-Delivery Contact (24 Hours Before)</strong>
                <p className="mt-1 text-sm text-blue-700">
                  We'll call you at <strong>{booking.customer.phone || 'your registered number'}</strong> on{' '}
                  <strong>{new Date(new Date(booking.startDate).getTime() - 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>{' '}
                  to confirm delivery time and site access.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                4
              </span>
              <div className="flex-1 pt-1">
                <strong className="text-blue-900">Equipment Delivery & Orientation</strong>
                <p className="mt-1 text-sm text-blue-700">
                  Delivery scheduled for <strong>{new Date(booking.startDate).toLocaleDateString()}</strong>.
                  Our certified operator will deliver the equipment and provide a comprehensive safety orientation (approximately 20-30 minutes).
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                5
              </span>
              <div className="flex-1 pt-1">
                <strong className="text-blue-900">Equipment Pickup</strong>
                <p className="mt-1 text-sm text-blue-700">
                  Scheduled for <strong>{new Date(booking.endDate).toLocaleDateString()}</strong>.
                  Please ensure the equipment is accessible and ready for pickup. Final inspection and security deposit refund processed within 5-7 business days.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
            <h4 className="mb-2 font-semibold text-gray-900">📅 Add to Calendar</h4>
            <p className="mb-3 text-sm text-gray-700">
              Don't forget your rental dates! Add them to your calendar to receive reminders.
            </p>
            <div className="flex gap-3">
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Equipment Rental: ${booking.equipment.make} ${booking.equipment.model}`)}&dates=${new Date(booking.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(booking.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(`Booking ${booking.bookingNumber} - ${booking.equipment.make} ${booking.equipment.model}`)}&location=${encodeURIComponent(booking.deliveryAddress || 'U-Dig It Rentals, Saint John, NB')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                Google Calendar
              </a>
              <a
                href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${new Date(booking.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z%0ADTEND:${new Date(booking.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z%0ASUMMARY:${encodeURIComponent(`Equipment Rental: ${booking.equipment.make} ${booking.equipment.model}`)}%0ADESCRIPTION:${encodeURIComponent(`Booking ${booking.bookingNumber}`)  }%0ALOCATION:${encodeURIComponent(booking.deliveryAddress || 'U-Dig It Rentals')}%0AEND:VEVENT%0AEND:VCALENDAR`}
                download={`booking-${booking.bookingNumber}.ics`}
                className="flex-1 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-center text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                Download .ics
              </a>
            </div>
          </div>
        </div>

        {/* Important Reminders */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-yellow-900">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Important Reminders
          </h3>
          <ul className="space-y-2 text-yellow-900">
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">Ensure delivery site is accessible for our equipment trailer (minimum 12ft wide clearance)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">Have a designated operator available for the safety orientation</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">Keep the site clear of overhead power lines and underground utilities (Call before you dig: 1-800-242-3447)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">Daily inspection required before operation (check fluid levels, tracks, hydraulics)</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            <svg className="mx-auto mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </Link>

          <Link
            href={`/booking/${booking.id}/details`}
            className="rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            <svg className="mx-auto mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Full Details
          </Link>

          <button
            onClick={() => window.print()}
            className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="mx-auto mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Questions about your rental?{' '}
            <a href="mailto:support@udigitrentals.com" className="text-blue-600 hover:underline">
              Contact Support
            </a>{' '}
            or call{' '}
            <a href="tel:5065550100" className="text-blue-600 hover:underline">
              (506) 555-0100
            </a>
          </p>
        </div>

        {/* Electronic Signature Notice */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>
            Electronic signatures are legally binding under the Uniform Electronic Commerce Act (UECA)
            and PIPEDA (Personal Information Protection and Electronic Documents Act)
          </p>
        </div>
      </div>
    </div>
  );
}
