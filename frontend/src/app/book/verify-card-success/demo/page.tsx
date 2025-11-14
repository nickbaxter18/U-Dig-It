/**
 * Demo Page for Booking Confirmed Modal
 *
 * Shows the Booking Confirmed modal without requiring Stripe integration
 * Used for testing and demonstration purposes
 */

'use client';

import BookingConfirmedModal from '@/components/booking/BookingConfirmedModal';
import { useState } from 'react';

export default function BookingConfirmedDemoPage() {
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-8">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Booking Confirmed Modal Demo</h1>
        <p className="mb-6 text-gray-600">
          This demonstrates the modal that appears after successful card verification
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Show Booking Confirmed Modal
        </button>

        {/* Demo modal with sample booking data */}
        {showModal && (
          <BookingConfirmedModal
            isOpen={showModal}
            bookingNumber="BK-DEMO-TEST-123"
            bookingId="demo-id-123"
          />
        )}
      </div>
    </div>
  );
}



