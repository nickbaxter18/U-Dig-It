/**
 * Booking Metadata Utilities
 *
 * Helper functions for generating metadata for booking pages
 */

import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';
import { cachedQuery, CACHE_PRESETS } from '@/lib/supabase/server-cache';

interface BookingMetadata {
  bookingNumber: string;
  status: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  equipment?: {
    make: string;
    model: string;
  } | null;
  customer?: {
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Fetch booking data for metadata generation
 */
async function fetchBookingForMetadata(bookingId: string): Promise<BookingMetadata | null> {
  try {
    return await cachedQuery(
      async (supabase) => {
        const { data, error } = await supabase
          .from('bookings')
          .select(
            'bookingNumber, status, totalAmount, startDate, endDate, equipment:equipmentId(make, model), customer:customerId(firstName, lastName)'
          )
          .eq('id', bookingId)
          .single();

        if (error || !data) {
          return null;
        }

        return {
          bookingNumber: data.bookingNumber,
          status: data.status,
          totalAmount: Number(data.totalAmount) || 0,
          startDate: data.startDate,
          endDate: data.endDate,
          equipment: data.equipment as { make: string; model: string } | null,
          customer: data.customer as { firstName: string; lastName: string } | null,
        };
      },
      [`booking-metadata-${bookingId}`],
      {
        ...CACHE_PRESETS.BOOKING,
        revalidate: 60, // 1 minute cache for metadata
      }
    );
  } catch (error) {
    console.error('Error fetching booking for metadata:', error);
    return null;
  }
}

/**
 * Generate metadata for a booking detail page
 */
export async function generateBookingMetadata(
  bookingId: string,
  options: {
    isAdmin?: boolean;
    baseUrl?: string;
  } = {}
): Promise<Metadata> {
  const { isAdmin = false, baseUrl = 'https://udigit.ca' } = options;

  const booking = await fetchBookingForMetadata(bookingId);

  if (!booking) {
    return {
      title: 'Booking Not Found | U-Dig It Rentals',
      description: 'The requested booking could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const equipmentName = booking.equipment
    ? `${booking.equipment.make} ${booking.equipment.model}`
    : 'Equipment';
  const customerName = booking.customer
    ? `${booking.customer.firstName} ${booking.customer.lastName}`
    : 'Customer';
  const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ');

  const title = isAdmin
    ? `Booking ${booking.bookingNumber} - Admin | U-Dig It Rentals`
    : `Booking ${booking.bookingNumber} | U-Dig It Rentals`;

  const description = isAdmin
    ? `Admin view: ${equipmentName} rental for ${customerName}. Status: ${statusLabel}. ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}.`
    : `Your ${equipmentName} rental booking. Status: ${statusLabel}. ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}${isAdmin ? '/admin/bookings' : '/dashboard/bookings'}/${bookingId}`,
      siteName: 'U-Dig It Rentals',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/images/kubota-svl-75-hero.png`,
          width: 1200,
          height: 630,
          alt: equipmentName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/kubota-svl-75-hero.png`],
    },
    robots: {
      index: !isAdmin, // Don't index admin pages
      follow: !isAdmin,
    },
  };
}






