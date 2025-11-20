'use client';

import { useRouter } from 'next/navigation';

import MobileOptimizedBooking from '@/components/MobileOptimizedBooking';

import { logger } from '@/lib/logger';

export default function MobileBookingPage() {
  const router = useRouter();

  const handleBookingComplete = (bookingData: unknown) => {
    // Handle booking completion
    logger.debug('Booking completed', {
      component: 'app-page',
      action: 'debug',
      metadata: { bookingData },
    });

    // Redirect to confirmation page
    router.push('/booking-confirmation');
  };

  return (
    <MobileOptimizedBooking
      onDateSelect={(startDate, endDate) => {
        logger.debug('Date selected', {
          component: 'app-page',
          action: 'debug',
          metadata: { startDate, endDate },
        });
      }}
      onLocationSelect={(address: unknown, city: unknown) => {
        logger.debug('Location selected', {
          component: 'app-page',
          action: 'debug',
          metadata: { address, city },
        });
      }}
      onBookingComplete={handleBookingComplete}
    />
  );
}
